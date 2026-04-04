import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAuthSSE } from "../lib/auth";
import { logger } from "../lib/logger";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { EventEmitter } from "events";

const router: IRouter = Router();

interface MobileSession {
  projectId: number;
  userId: number;
  process: ChildProcess | null;
  status: "installing" | "starting" | "ready" | "error" | "stopped";
  tunnelUrl: string | null;
  logs: string[];
  emitter: EventEmitter;
}

let session: MobileSession | null = null;
const EXPO_DIR = "/tmp/jadia-expo-preview";
const USER_SRC = path.join(EXPO_DIR, "src");

async function ensureExpoTemplate(): Promise<void> {
  if (existsSync(path.join(EXPO_DIR, "node_modules", "expo"))) return;

  await fs.mkdir(EXPO_DIR, { recursive: true });
  await fs.mkdir(USER_SRC, { recursive: true });

  const pkgJson = {
    name: "jadia-mobile-preview",
    version: "1.0.0",
    main: "App.js",
    scripts: { start: "npx expo start --tunnel --non-interactive" },
    dependencies: {
      expo: "~53.0.0",
      react: "18.3.2",
      "react-native": "0.76.7",
      "react-native-web": "~0.19.13",
      "@expo/metro-runtime": "~4.0.1",
    },
  };

  const appJson = {
    expo: {
      name: "Jad.ia Preview",
      slug: "jadia-preview",
      version: "1.0.0",
      orientation: "portrait",
      platforms: ["ios", "android"],
      sdkVersion: "53.0.0",
    },
  };

  const babelConfig = `module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};`;

  await fs.writeFile(path.join(EXPO_DIR, "package.json"), JSON.stringify(pkgJson, null, 2));
  await fs.writeFile(path.join(EXPO_DIR, "app.json"), JSON.stringify(appJson, null, 2));
  await fs.writeFile(path.join(EXPO_DIR, "babel.config.js"), babelConfig);
  await fs.writeFile(
    path.join(EXPO_DIR, "App.js"),
    `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

let UserApp;
try {
  UserApp = require('./src/App').default;
} catch {
  UserApp = null;
}

export default function App() {
  if (UserApp) return <UserApp />;
  return (
    <View style={s.c}>
      <Text style={s.t}>Jad.ia Mobile Preview</Text>
      <Text style={s.s}>Gere um app mobile para começar</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1a' },
  t: { color: '#a78bfa', fontSize: 22, fontWeight: 'bold' },
  s: { color: '#6b7280', fontSize: 14, marginTop: 8 },
});
`
  );
}

async function installDeps(onLog: (line: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["install", "--legacy-peer-deps"], {
      cwd: EXPO_DIR,
      env: { ...process.env, CI: "1" },
    });
    proc.stdout.on("data", (d) => onLog(d.toString()));
    proc.stderr.on("data", (d) => onLog(d.toString()));
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`npm install exited ${code}`))));
  });
}

async function syncProjectFiles(projectId: number, userId: number): Promise<void> {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
  if (!project) throw new Error("Projeto não encontrado");

  const files = await db
    .select()
    .from(projectFilesTable)
    .where(eq(projectFilesTable.projectId, projectId));

  await fs.mkdir(USER_SRC, { recursive: true });
  for (const file of files) {
    if (file.name === ".jadia_context") continue;
    const filePath = path.join(USER_SRC, file.name);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content ?? "");
  }
}

function broadcast(s: MobileSession, data: object) {
  s.emitter.emit("update", data);
}

function startExpoProcess(s: MobileSession) {
  const env = {
    ...process.env,
    CI: "0",
    EXPO_NO_TYPESCRIPT_SETUP: "1",
    EXPO_NO_GIT_STATUS: "1",
    NODE_OPTIONS: "--max-old-space-size=512",
  };

  const proc = spawn("npx", ["expo", "start", "--tunnel", "--non-interactive"], {
    cwd: EXPO_DIR,
    env,
  });
  s.process = proc;

  const tunnelRegex = /exp:\/\/[^\s\]]+/;
  const processLine = (line: string) => {
    const clean = line.replace(/\x1B\[[0-9;]*m/g, "").trim();
    if (!clean) return;
    s.logs.push(clean);
    if (s.logs.length > 200) s.logs.shift();
    broadcast(s, { type: "log", line: clean });

    const m = clean.match(tunnelRegex);
    if (m && s.status !== "ready") {
      s.tunnelUrl = m[0];
      s.status = "ready";
      broadcast(s, { type: "status", status: "ready", tunnelUrl: s.tunnelUrl });
      logger.info({ projectId: s.projectId, url: s.tunnelUrl }, "Expo tunnel pronto");
    }

    if (
      clean.includes("Starting Metro") ||
      clean.includes("Metro waiting") ||
      (s.status === "starting" && clean.includes("Tunnel"))
    ) {
      broadcast(s, { type: "status", status: "starting", tunnelUrl: null });
    }

    if (clean.toLowerCase().includes("error") && s.status === "starting") {
      s.status = "error";
      broadcast(s, { type: "status", status: "error", tunnelUrl: null, message: clean });
    }
  };

  proc.stdout.on("data", (d: Buffer) =>
    d.toString().split("\n").forEach(processLine)
  );
  proc.stderr.on("data", (d: Buffer) =>
    d.toString().split("\n").forEach(processLine)
  );
  proc.on("close", (code) => {
    if (session?.process === proc) {
      s.status = "stopped";
      s.process = null;
      broadcast(s, { type: "status", status: "stopped", tunnelUrl: null });
    }
    logger.info({ code }, "Expo process encerrado");
  });
}

router.post("/projects/:id/mobile/start", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const projectId = parseInt(req.params.id, 10);
  if (isNaN(projectId)) { res.status(400).json({ error: "ID inválido" }); return; }

  if (session && session.process && session.status !== "stopped") {
    if (session.projectId === projectId) {
      res.json({ status: session.status, tunnelUrl: session.tunnelUrl });
      return;
    }
    session.process.kill("SIGTERM");
    session = null;
  }

  const newSession: MobileSession = {
    projectId,
    userId: authReq.user.id,
    process: null,
    status: "installing",
    tunnelUrl: null,
    logs: [],
    emitter: new EventEmitter(),
  };
  newSession.emitter.setMaxListeners(50);
  session = newSession;

  res.json({ status: "installing" });

  try {
    await ensureExpoTemplate();
    broadcast(newSession, { type: "status", status: "installing", tunnelUrl: null });

    const needsInstall = !existsSync(path.join(EXPO_DIR, "node_modules", "expo"));
    if (needsInstall) {
      await installDeps((line) => {
        newSession.logs.push(line);
        broadcast(newSession, { type: "log", line });
      });
    }

    await syncProjectFiles(projectId, authReq.user.id);
    newSession.status = "starting";
    broadcast(newSession, { type: "status", status: "starting", tunnelUrl: null });

    startExpoProcess(newSession);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Erro ao iniciar mobile preview");
    newSession.status = "error";
    broadcast(newSession, { type: "status", status: "error", tunnelUrl: null, message: msg });
  }
});

router.post("/projects/:id/mobile/stop", requireAuth, async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (session && session.projectId === projectId && session.process) {
    session.process.kill("SIGTERM");
    session.status = "stopped";
    session.process = null;
    broadcast(session, { type: "status", status: "stopped", tunnelUrl: null });
  }
  res.json({ success: true });
});

router.post("/projects/:id/mobile/sync", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const projectId = parseInt(req.params.id, 10);
  const { fileName, content } = req.body as { fileName?: string; content?: string };

  if (!session || session.projectId !== projectId || session.status === "stopped") {
    res.json({ synced: false, reason: "Nenhuma sessão ativa" });
    return;
  }
  if (!fileName || content === undefined) {
    res.status(400).json({ error: "fileName e content são obrigatórios" });
    return;
  }

  try {
    const filePath = path.join(USER_SRC, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    broadcast(session, { type: "sync", fileName });
    res.json({ synced: true, userId: authReq.user.id });
  } catch (err) {
    logger.error({ err }, "Erro ao sincronizar arquivo");
    res.status(500).json({ error: "Erro ao sincronizar" });
  }
});

router.post("/projects/:id/mobile/clear-cache", requireAuth, async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);

  if (session && session.projectId === projectId && session.process) {
    session.process.kill("SIGTERM");
    session.process = null;
  }

  try {
    const cacheDir = path.join(EXPO_DIR, ".expo");
    const metroCache = path.join(EXPO_DIR, "node_modules", ".cache");
    await fs.rm(cacheDir, { recursive: true, force: true });
    await fs.rm(metroCache, { recursive: true, force: true });

    if (session && session.projectId === projectId) {
      session.status = "starting";
      session.tunnelUrl = null;
      broadcast(session, { type: "status", status: "starting", tunnelUrl: null });
      startExpoProcess(session);
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Erro ao limpar cache");
    res.status(500).json({ error: "Erro ao limpar cache" });
  }
});

router.get("/projects/:id/mobile/status", requireAuthSSE, async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if ("flush" in res && typeof (res as unknown as { flush: () => void }).flush === "function") {
      (res as unknown as { flush: () => void }).flush();
    }
  };

  if (session && session.projectId === projectId) {
    send({ type: "status", status: session.status, tunnelUrl: session.tunnelUrl });
    for (const line of session.logs.slice(-30)) {
      send({ type: "log", line });
    }
  } else {
    send({ type: "status", status: "stopped", tunnelUrl: null });
  }

  const onUpdate = (data: object) => send(data);

  if (session && session.projectId === projectId) {
    session.emitter.on("update", onUpdate);
  }

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 20_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    if (session) session.emitter.off("update", onUpdate);
  });
});

router.get("/projects/:id/mobile/state", requireAuth, async (req, res): Promise<void> => {
  const projectId = parseInt(req.params.id, 10);
  if (!session || session.projectId !== projectId) {
    res.json({ status: "stopped", tunnelUrl: null });
    return;
  }
  res.json({ status: session.status, tunnelUrl: session.tunnelUrl });
});

export default router;
