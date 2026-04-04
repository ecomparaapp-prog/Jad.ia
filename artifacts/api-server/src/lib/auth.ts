import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function setSession(token: string, userId: number): Promise<void> {
  await db.insert(sessionsTable).values({ token, userId }).onConflictDoNothing();
}

export async function getSession(token: string): Promise<number | undefined> {
  const [session] = await db
    .select({ userId: sessionsTable.userId })
    .from(sessionsTable)
    .where(eq(sessionsTable.token, token));
  return session?.userId;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function resolveAuth(req: Request, res: Response, next: NextFunction, allowQuery: boolean): Promise<void> {
  let rawToken: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    rawToken = authHeader.slice(7);
  } else if (allowQuery && typeof req.query.token === "string") {
    rawToken = req.query.token;
  }

  if (!rawToken) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const userId = await getSession(rawToken);
  if (!userId) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }
  (req as Request & { user: typeof user; token: string }).user = user;
  (req as Request & { user: typeof user; token: string }).token = rawToken;
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  return resolveAuth(req, res, next, false);
}

export async function requireAuthSSE(req: Request, res: Response, next: NextFunction): Promise<void> {
  return resolveAuth(req, res, next, true);
}
