import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";

export const githubReposTable = pgTable("github_repos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique().references(() => projectsTable.id, { onDelete: "cascade" }),
  owner: text("owner").notNull(),
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  defaultBranch: text("default_branch").notNull().default("main"),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastCommitSha: text("last_commit_sha"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GithubRepo = typeof githubReposTable.$inferSelect;
