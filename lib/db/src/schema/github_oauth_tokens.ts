import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const githubOAuthTokensTable = pgTable("github_oauth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  githubLogin: text("github_login").notNull(),
  githubName: text("github_name"),
  githubAvatarUrl: text("github_avatar_url"),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type GithubOAuthToken = typeof githubOAuthTokensTable.$inferSelect;
