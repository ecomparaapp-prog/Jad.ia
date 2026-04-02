import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const CONTEXT_FILE_NAME = ".jadia_context";

router.get("/projects/:id/context", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;

  if (Number.isNaN(projectId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }

    const [ctxFile] = await db
      .select()
      .from(projectFilesTable)
      .where(and(eq(projectFilesTable.projectId, projectId), eq(projectFilesTable.name, CONTEXT_FILE_NAME)));

    if (!ctxFile) {
      res.json({ context: null });
      return;
    }

    try {
      const context = JSON.parse(ctxFile.content);
      res.json({ context });
    } catch {
      res.json({ context: null });
    }
  } catch (error) {
    logger.error({ error }, "Erro ao buscar contexto do projeto");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/projects/:id/context", requireAuth, async (req, res): Promise<void> => {
  const projectId = Number(req.params.id);
  const userId = (req as unknown as { userId: number }).userId;

  if (Number.isNaN(projectId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const contextData = req.body;
  if (!contextData || typeof contextData !== "object") {
    res.status(400).json({ error: "Dados de contexto inválidos" });
    return;
  }

  try {
    const [project] = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }

    const content = JSON.stringify(contextData, null, 2);

    const [existing] = await db
      .select({ id: projectFilesTable.id })
      .from(projectFilesTable)
      .where(and(eq(projectFilesTable.projectId, projectId), eq(projectFilesTable.name, CONTEXT_FILE_NAME)));

    if (existing) {
      await db
        .update(projectFilesTable)
        .set({ content, updatedAt: new Date() })
        .where(eq(projectFilesTable.id, existing.id));
    } else {
      await db.insert(projectFilesTable).values({
        projectId,
        name: CONTEXT_FILE_NAME,
        content,
        language: "json",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Erro ao salvar contexto do projeto");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
