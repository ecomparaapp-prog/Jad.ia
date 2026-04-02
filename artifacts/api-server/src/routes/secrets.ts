import { Router, type IRouter } from "express";
import { db, projectSecretsTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateProjectSecretBody,
  CreateProjectSecretParams,
  ListProjectSecretsParams,
  DeleteProjectSecretParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/projects/:id/secrets", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = ListProjectSecretsParams.safeParse(req.params);
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

  const secrets = await db
    .select({
      id: projectSecretsTable.id,
      projectId: projectSecretsTable.projectId,
      key: projectSecretsTable.key,
      createdAt: projectSecretsTable.createdAt,
    })
    .from(projectSecretsTable)
    .where(eq(projectSecretsTable.projectId, params.data.id))
    .orderBy(projectSecretsTable.key);

  res.json(secrets);
});

router.post("/projects/:id/secrets", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = CreateProjectSecretParams.safeParse(req.params);
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

  const parsed = CreateProjectSecretBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [secret] = await db
    .insert(projectSecretsTable)
    .values({
      projectId: params.data.id,
      key: parsed.data.key,
      value: parsed.data.value,
    })
    .returning();

  res.status(201).json({
    id: secret.id,
    projectId: secret.projectId,
    key: secret.key,
    createdAt: secret.createdAt,
  });
});

router.delete("/projects/:id/secrets/:secretId", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const params = DeleteProjectSecretParams.safeParse(req.params);
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

  const [secret] = await db
    .delete(projectSecretsTable)
    .where(and(eq(projectSecretsTable.id, params.data.secretId), eq(projectSecretsTable.projectId, params.data.id)))
    .returning();

  if (!secret) {
    res.status(404).json({ error: "Secret não encontrado" });
    return;
  }

  res.sendStatus(204);
});

export default router;
