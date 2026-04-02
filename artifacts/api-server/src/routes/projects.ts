import { Router, type IRouter } from "express";
import { db, projectsTable, projectFilesTable, activityLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, authReq.user.id))
    .orderBy(projectsTable.updatedAt);
  res.json(projects);
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      userId: authReq.user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      language: parsed.data.language,
      theme: parsed.data.theme ?? "dark",
    })
    .returning();

  await db.insert(projectFilesTable).values({
    projectId: project.id,
    name: "index." + getExtension(project.language),
    content: getDefaultContent(project.language),
    language: project.language,
  });

  await db.insert(activityLogsTable).values({
    userId: authReq.user.id,
    type: "project_created",
    description: `Projeto "${project.name}" criado`,
    projectId: project.id,
    projectName: project.name,
  });

  res.status(201).json(project);
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, authReq.user.id)));

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado" });
    return;
  }

  res.json(project);
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, authReq.user.id)))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado" });
    return;
  }

  res.json(project);
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, authReq.user.id)))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado" });
    return;
  }

  res.sendStatus(204);
});

function getExtension(language: string): string {
  const map: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    html: "html",
    css: "css",
    react: "tsx",
    vue: "vue",
    "node.js": "js",
    "next.js": "tsx",
    "react native": "tsx",
  };
  return map[language.toLowerCase()] ?? "txt";
}

function getDefaultContent(language: string): string {
  const map: Record<string, string> = {
    javascript: `// Olá, mundo!\nconsole.log("Bem-vindo ao Jad.ia!");\n`,
    typescript: `// Olá, mundo!\nconst mensagem: string = "Bem-vindo ao Jad.ia!";\nconsole.log(mensagem);\n`,
    python: `# Olá, mundo!\nprint("Bem-vindo ao Jad.ia!")\n`,
    html: `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <title>Meu Projeto</title>\n</head>\n<body>\n  <h1>Bem-vindo ao Jad.ia!</h1>\n</body>\n</html>\n`,
    css: `/* Estilos do projeto */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n`,
    react: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Bem-vindo ao Jad.ia!</h1>\n    </div>\n  );\n}\n`,
    vue: `<template>\n  <div>\n    <h1>Bem-vindo ao Jad.ia!</h1>\n  </div>\n</template>\n\n<script>\nexport default {\n  name: 'App'\n}\n</script>\n`,
  };
  return map[language.toLowerCase()] ?? `// ${language}\n// Bem-vindo ao Jad.ia!\n`;
}

export default router;
