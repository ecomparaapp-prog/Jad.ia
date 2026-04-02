import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateProjectFileBody,
  UpdateProjectFileBody,
  ListProjectFilesParams,
  GetProjectFileParams,
  UpdateProjectFileParams,
  DeleteProjectFileParams,
  CreateProjectFileParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/projects/:id/files", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = ListProjectFilesParams.safeParse(req.params);
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

  const files = await db
    .select()
    .from(projectFilesTable)
    .where(eq(projectFilesTable.projectId, params.data.id))
    .orderBy(projectFilesTable.name);

  res.json(files);
});

router.post("/projects/:id/files", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = CreateProjectFileParams.safeParse(req.params);
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

  const parsed = CreateProjectFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [file] = await db
    .insert(projectFilesTable)
    .values({
      projectId: params.data.id,
      name: parsed.data.name,
      content: parsed.data.content ?? "",
      language: parsed.data.language,
    })
    .returning();

  res.status(201).json(file);
});

router.get("/projects/:id/files/:fileId", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = GetProjectFileParams.safeParse(req.params);
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

  const [file] = await db
    .select()
    .from(projectFilesTable)
    .where(and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.id)));

  if (!file) {
    res.status(404).json({ error: "Arquivo não encontrado" });
    return;
  }

  res.json(file);
});

router.patch("/projects/:id/files/:fileId", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = UpdateProjectFileParams.safeParse(req.params);
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

  const parsed = UpdateProjectFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [file] = await db
    .update(projectFilesTable)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.id)))
    .returning();

  if (!file) {
    res.status(404).json({ error: "Arquivo não encontrado" });
    return;
  }

  res.json(file);
});

router.delete("/projects/:id/files/:fileId", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = DeleteProjectFileParams.safeParse(req.params);
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

  const [file] = await db
    .delete(projectFilesTable)
    .where(and(eq(projectFilesTable.id, params.data.fileId), eq(projectFilesTable.projectId, params.data.id)))
    .returning();

  if (!file) {
    res.status(404).json({ error: "Arquivo não encontrado" });
    return;
  }

  res.sendStatus(204);
});

export default router;
