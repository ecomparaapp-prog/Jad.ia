import { Router, type IRouter } from "express";
import { db, projectsTable, projectFilesTable, activityLogsTable } from "@workspace/db";
import { eq, desc, gte, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/stats/dashboard", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const userId = authReq.user.id;

  const projectsList = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, userId));

  const totalProjects = projectsList.length;

  let totalFiles = 0;
  if (projectsList.length > 0) {
    const projectIds = projectsList.map((p) => p.id);
    const filesCount = await db
      .select({ count: count() })
      .from(projectFilesTable)
      .where(sql`${projectFilesTable.projectId} = ANY(${sql`ARRAY[${sql.join(projectIds.map(id => sql`${id}`), sql`, `)}]::int[]`})`);
    totalFiles = Number(filesCount[0]?.count ?? 0);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProjects = projectsList.filter((p) => p.createdAt >= thirtyDaysAgo);
  const recentProjectsCount = recentProjects.length;

  const languageCounts: Record<string, number> = {};
  for (const p of projectsList) {
    languageCounts[p.language] = (languageCounts[p.language] ?? 0) + 1;
  }

  const languagesUsed = Object.entries(languageCounts).map(([language, cnt]) => ({
    language,
    count: cnt,
  }));

  res.json({
    totalProjects,
    totalFiles,
    recentProjectsCount,
    languagesUsed,
  });
});

router.get("/stats/activity", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as typeof req & { user: { id: number } };
  const userId = authReq.user.id;

  const activities = await db
    .select()
    .from(activityLogsTable)
    .where(eq(activityLogsTable.userId, userId))
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(20);

  res.json(activities);
});

export default router;
