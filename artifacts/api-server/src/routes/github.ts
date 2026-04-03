import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable, githubReposTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();
const GH = "https://api.github.com";

function token(): string {
  const t = process.env.GITHUB_TOKEN;
  if (!t) throw Object.assign(new Error("GITHUB_TOKEN não configurado nos Secrets."), { status: 503 });
  return t;
}

function ghHeaders(tk: string) {
  return {
    Authorization: `Bearer ${tk}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "Jad.ia/1.0",
  };
}

async function gh(path: string, opts?: RequestInit): Promise<Response> {
  const tk = token();
  return fetch(`${GH}${path}`, { ...opts, headers: { ...ghHeaders(tk), ...(opts?.headers ?? {}) } });
}

function blobSha(content: string): string {
  const buf = Buffer.from(content, "utf-8");
  return crypto.createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 100) || "jadia-project";
}

function gitignoreFor(language: string): string {
  const py = language.toLowerCase().includes("python");
  return [
    "# Dependências",
    "node_modules/",
    ".pnp",
    ".pnp.js",
    "",
    "# Build",
    "dist/",
    "build/",
    ".next/",
    "out/",
    "",
    "# Ambiente",
    ".env",
    ".env.local",
    ".env.*.local",
    "",
    "# Logs",
    "npm-debug.log*",
    "yarn-debug.log*",
    "pnpm-debug.log*",
    "",
    "# Editor",
    ".vscode/",
    ".idea/",
    "*.swp",
    "*.swo",
    "",
    "# OS",
    ".DS_Store",
    "Thumbs.db",
    "",
    "# Replit",
    ".replit",
    "replit.nix",
    ".upm/",
    ".cache/",
    ...(py
      ? [
          "",
          "# Python",
          "__pycache__/",
          "*.py[cod]",
          "*.pyo",
          "venv/",
          ".venv/",
          "*.egg-info/",
        ]
      : []),
  ].join("\n");
}

async function getAuthenticatedUser(tk: string): Promise<{ login: string; name: string; email: string | null }> {
  const res = await fetch(`${GH}/user`, { headers: ghHeaders(tk) });
  if (!res.ok) throw new Error(`GitHub auth error: ${res.status}`);
  const data = await res.json() as { login: string; name?: string; email?: string | null };
  return { login: data.login, name: data.name ?? data.login, email: data.email ?? null };
}

router.get("/projects/:id/github", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;

  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Projeto não encontrado" }); return; }

    const [repo] = await db.select().from(githubReposTable)
      .where(eq(githubReposTable.projectId, projectId));

    if (!repo) {
      const hasToken = !!process.env.GITHUB_TOKEN;
      res.json({ connected: false, hasToken });
      return;
    }

    res.json({
      connected: true,
      owner: repo.owner,
      repoName: repo.repoName,
      repoUrl: repo.repoUrl,
      defaultBranch: repo.defaultBranch,
      lastSyncAt: repo.lastSyncAt,
      lastCommitSha: repo.lastCommitSha,
    });
  } catch (err) {
    logger.error({ err }, "Erro ao buscar status GitHub");
    res.status(500).json({ error: "Erro ao buscar status do GitHub." });
  }
});

router.post("/projects/:id/github/connect", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;
  const { repoName: customName, isPrivate = false } = req.body as { repoName?: string; isPrivate?: boolean };

  try {
    const tk = token();

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Projeto não encontrado" }); return; }

    const user = await getAuthenticatedUser(tk);
    const repoSlug = slugify(customName ?? project.name);

    const checkRes = await gh(`/repos/${user.login}/${repoSlug}`);
    let repoData: { name: string; html_url: string; default_branch: string; full_name: string };

    if (checkRes.status === 404) {
      const createRes = await gh("/user/repos", {
        method: "POST",
        body: JSON.stringify({
          name: repoSlug,
          description: project.description ?? `Projeto criado com Jad.ia`,
          private: isPrivate,
          auto_init: false,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Erro ao criar repositório: ${err}`);
      }
      repoData = await createRes.json() as typeof repoData;

      const gitignore = gitignoreFor(project.language);
      const readmeContent = [
        `# ${project.name}`,
        "",
        project.description ?? "",
        "",
        `> Criado com [Jad.ia](https://jadia.dev) — Plataforma de desenvolvimento com IA`,
        "",
        `## Tecnologias`,
        "",
        `- **Linguagem:** ${project.language}`,
        "",
        `## Como rodar`,
        "",
        "```bash",
        "# Clone o repositório",
        `git clone ${repoData.html_url}`,
        "```",
      ].join("\n");

      const initFiles = [
        { path: "README.md", content: readmeContent },
        { path: ".gitignore", content: gitignore },
      ];

      for (const file of initFiles) {
        await gh(`/repos/${user.login}/${repoSlug}/contents/${file.path}`, {
          method: "PUT",
          body: JSON.stringify({
            message: `chore: inicializar repositório via Jad.ia`,
            content: Buffer.from(file.content, "utf-8").toString("base64"),
          }),
        });
      }
    } else if (checkRes.ok) {
      repoData = await checkRes.json() as typeof repoData;
    } else {
      const err = await checkRes.text();
      throw new Error(`Erro ao verificar repositório: ${err}`);
    }

    const existing = await db.select().from(githubReposTable).where(eq(githubReposTable.projectId, projectId));
    if (existing.length > 0) {
      await db.update(githubReposTable).set({
        owner: user.login,
        repoName: repoData.name,
        repoUrl: repoData.html_url,
        defaultBranch: repoData.default_branch,
      }).where(eq(githubReposTable.projectId, projectId));
    } else {
      await db.insert(githubReposTable).values({
        projectId,
        owner: user.login,
        repoName: repoData.name,
        repoUrl: repoData.html_url,
        defaultBranch: repoData.default_branch,
      });
    }

    res.json({
      connected: true,
      owner: user.login,
      repoName: repoData.name,
      repoUrl: repoData.html_url,
      defaultBranch: repoData.default_branch,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Erro ao conectar GitHub");
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: msg });
  }
});

router.post("/projects/:id/github/sync", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;
  const { commitMessage } = req.body as { commitMessage?: string };

  try {
    const tk = token();

    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Projeto não encontrado" }); return; }

    const [repo] = await db.select().from(githubReposTable).where(eq(githubReposTable.projectId, projectId));
    if (!repo) { res.status(400).json({ error: "Repositório não conectado. Conecte primeiro." }); return; }

    const files = await db.select().from(projectFilesTable).where(eq(projectFilesTable.projectId, projectId));
    if (files.length === 0) { res.status(400).json({ error: "Nenhum arquivo para sincronizar." }); return; }

    const { owner, repoName, defaultBranch } = repo;
    const user = await getAuthenticatedUser(tk);

    const refRes = await gh(`/repos/${owner}/${repoName}/git/ref/heads/${defaultBranch}`);
    let currentCommitSha: string | null = null;
    let currentTreeSha: string | null = null;

    if (refRes.ok) {
      const refData = await refRes.json() as { object: { sha: string } };
      currentCommitSha = refData.object.sha;

      const commitRes = await gh(`/repos/${owner}/${repoName}/git/commits/${currentCommitSha}`);
      if (commitRes.ok) {
        const commitData = await commitRes.json() as { tree: { sha: string } };
        currentTreeSha = commitData.tree.sha;
      }
    }

    let existingFileShas: Record<string, string> = {};
    if (currentTreeSha) {
      const treeRes = await gh(`/repos/${owner}/${repoName}/git/trees/${currentTreeSha}?recursive=1`);
      if (treeRes.ok) {
        const treeData = await treeRes.json() as { tree: Array<{ path: string; sha: string; type: string }> };
        for (const item of treeData.tree) {
          if (item.type === "blob") existingFileShas[item.path] = item.sha;
        }
      }
    }

    const changedFiles = files.filter((f) => {
      const localSha = blobSha(f.content);
      return existingFileShas[f.name] !== localSha;
    });

    if (changedFiles.length === 0) {
      res.json({ message: "Nenhuma alteração para sincronizar.", filesChanged: 0 });
      return;
    }

    const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];
    for (const file of changedFiles) {
      const blobRes = await gh(`/repos/${owner}/${repoName}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: file.content, encoding: "utf-8" }),
      });
      if (!blobRes.ok) throw new Error(`Erro ao criar blob para ${file.name}`);
      const blobData = await blobRes.json() as { sha: string };
      treeEntries.push({ path: file.name, mode: "100644", type: "blob", sha: blobData.sha });
    }

    const newTreeBody: Record<string, unknown> = { tree: treeEntries };
    if (currentTreeSha) newTreeBody.base_tree = currentTreeSha;
    const newTreeRes = await gh(`/repos/${owner}/${repoName}/git/trees`, {
      method: "POST",
      body: JSON.stringify(newTreeBody),
    });
    if (!newTreeRes.ok) throw new Error("Erro ao criar tree no GitHub");
    const newTree = await newTreeRes.json() as { sha: string };

    const fileList = changedFiles.map((f) => f.name).join(", ");
    const msg = commitMessage ?? `feat: atualizar ${changedFiles.length} arquivo(s) via Jad.ia\n\nArquivos: ${fileList}`;

    const newCommitBody: Record<string, unknown> = {
      message: msg,
      tree: newTree.sha,
      author: { name: user.name, email: user.email ?? `${user.login}@users.noreply.github.com`, date: new Date().toISOString() },
    };
    if (currentCommitSha) newCommitBody.parents = [currentCommitSha];

    const newCommitRes = await gh(`/repos/${owner}/${repoName}/git/commits`, {
      method: "POST",
      body: JSON.stringify(newCommitBody),
    });
    if (!newCommitRes.ok) throw new Error("Erro ao criar commit no GitHub");
    const newCommit = await newCommitRes.json() as { sha: string; html_url: string };

    const updateRefMethod = refRes.ok ? "PATCH" : "PUT";
    const updateRefPath = refRes.ok
      ? `/repos/${owner}/${repoName}/git/refs/heads/${defaultBranch}`
      : `/repos/${owner}/${repoName}/git/refs`;
    const updateRefBody = refRes.ok
      ? { sha: newCommit.sha, force: false }
      : { ref: `refs/heads/${defaultBranch}`, sha: newCommit.sha };

    await gh(updateRefPath, { method: updateRefMethod, body: JSON.stringify(updateRefBody) });

    await db.update(githubReposTable).set({
      lastSyncAt: new Date(),
      lastCommitSha: newCommit.sha,
    }).where(eq(githubReposTable.projectId, projectId));

    res.json({
      message: `Sincronização concluída com sucesso.`,
      filesChanged: changedFiles.length,
      commitSha: newCommit.sha,
      commitUrl: newCommit.html_url,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Erro ao sincronizar com GitHub");
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: msg });
  }
});

router.get("/projects/:id/github/commits", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;

  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Projeto não encontrado" }); return; }

    const [repo] = await db.select().from(githubReposTable).where(eq(githubReposTable.projectId, projectId));
    if (!repo) { res.json([]); return; }

    const commitsRes = await gh(`/repos/${repo.owner}/${repo.repoName}/commits?per_page=15`);
    if (!commitsRes.ok) { res.json([]); return; }

    const raw = await commitsRes.json() as Array<{
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } };
    }>;

    const commits = raw.map((c) => ({
      sha: c.sha.slice(0, 7),
      fullSha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    res.json(commits);
  } catch (err) {
    logger.error({ err }, "Erro ao buscar commits");
    res.json([]);
  }
});

router.delete("/projects/:id/github", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;

  try {
    const [project] = await db.select().from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));
    if (!project) { res.status(404).json({ error: "Projeto não encontrado" }); return; }

    await db.delete(githubReposTable).where(eq(githubReposTable.projectId, projectId));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Erro ao desconectar GitHub");
    res.status(500).json({ error: "Erro ao desconectar." });
  }
});

export default router;
