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

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const token = authHeader.slice(7);
  const userId = await getSession(token);
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
  (req as Request & { user: typeof user; token: string }).token = token;
  next();
}
