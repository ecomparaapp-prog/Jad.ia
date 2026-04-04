import { Router, type IRouter } from "express";
import { db, githubOAuthTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router: IRouter = Router();

interface StateEntry {
  userId: number;
  expiresAt: number;
}

const oauthStateMap = new Map<string, StateEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of oauthStateMap.entries()) {
    if (val.expiresAt < now) oauthStateMap.delete(key);
  }
}, 60_000);

function getAppBaseUrl(req: { headers: { host?: string; "x-forwarded-proto"?: string; "x-forwarded-host"?: string } }): string {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}`;
  const proto = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5173";
  return `${proto}://${host}`;
}

router.get("/auth/github/authorize", requireAuth, async (req, res): Promise<void> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(503).json({ error: "GITHUB_CLIENT_ID não configurado. Configure os Secrets da aplicação." });
    return;
  }

  const userId = (req as unknown as { user: { id: number } }).user.id;
  const state = crypto.randomBytes(16).toString("hex");
  oauthStateMap.set(state, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });

  const base = getAppBaseUrl(req as never);
  const callbackUrl = `${base}/api/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "repo",
    state,
  });

  res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

router.get("/auth/github/callback", async (req, res): Promise<void> => {
  const base = getAppBaseUrl(req as never);
  const frontendUrl = base;

  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    logger.warn({ error }, "GitHub OAuth negado pelo usuário");
    res.redirect(`${frontendUrl}?github=denied`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${frontendUrl}?github=error&reason=missing_params`);
    return;
  }

  const stateData = oauthStateMap.get(state);
  if (!stateData || stateData.expiresAt < Date.now()) {
    oauthStateMap.delete(state);
    res.redirect(`${frontendUrl}?github=error&reason=invalid_state`);
    return;
  }
  oauthStateMap.delete(state);

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.redirect(`${frontendUrl}?github=error&reason=server_config`);
    return;
  }

  try {
    const callbackUrl = `${base}/api/auth/github/callback`;
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "Jad.ia/1.0" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: callbackUrl }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; scope?: string; error?: string };

    if (!tokenData.access_token) {
      logger.error({ tokenData }, "GitHub OAuth token exchange falhou");
      res.redirect(`${frontendUrl}?github=error&reason=token_exchange`);
      return;
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "Jad.ia/1.0",
      },
    });

    if (!userRes.ok) {
      res.redirect(`${frontendUrl}?github=error&reason=user_fetch`);
      return;
    }

    const ghUser = await userRes.json() as { login: string; name?: string | null; avatar_url?: string };

    await db.insert(githubOAuthTokensTable).values({
      userId: stateData.userId,
      accessToken: tokenData.access_token,
      githubLogin: ghUser.login,
      githubName: ghUser.name ?? ghUser.login,
      githubAvatarUrl: ghUser.avatar_url ?? null,
      scope: tokenData.scope ?? "repo",
    }).onConflictDoUpdate({
      target: githubOAuthTokensTable.userId,
      set: {
        accessToken: tokenData.access_token,
        githubLogin: ghUser.login,
        githubName: ghUser.name ?? ghUser.login,
        githubAvatarUrl: ghUser.avatar_url ?? null,
        scope: tokenData.scope ?? "repo",
        updatedAt: new Date(),
      },
    });

    logger.info({ userId: stateData.userId, login: ghUser.login }, "GitHub OAuth conectado com sucesso");
    res.redirect(`${frontendUrl}?github=connected`);
  } catch (err) {
    logger.error({ err }, "Erro no GitHub OAuth callback");
    res.redirect(`${frontendUrl}?github=error&reason=server_error`);
  }
});

router.get("/auth/github/status", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { user: { id: number } }).user.id;

  try {
    const [token] = await db.select({
      githubLogin: githubOAuthTokensTable.githubLogin,
      githubName: githubOAuthTokensTable.githubName,
      githubAvatarUrl: githubOAuthTokensTable.githubAvatarUrl,
      scope: githubOAuthTokensTable.scope,
      createdAt: githubOAuthTokensTable.createdAt,
    }).from(githubOAuthTokensTable).where(eq(githubOAuthTokensTable.userId, userId));

    if (!token) {
      const hasClientId = !!process.env.GITHUB_CLIENT_ID;
      res.json({ connected: false, oauthConfigured: hasClientId });
      return;
    }

    res.json({
      connected: true,
      oauthConfigured: true,
      githubLogin: token.githubLogin,
      githubName: token.githubName,
      githubAvatarUrl: token.githubAvatarUrl,
      scope: token.scope,
      connectedAt: token.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Erro ao buscar status OAuth GitHub");
    res.status(500).json({ error: "Erro ao verificar status." });
  }
});

router.delete("/auth/github/disconnect", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as unknown as { user: { id: number } }).user.id;

  try {
    await db.delete(githubOAuthTokensTable).where(eq(githubOAuthTokensTable.userId, userId));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Erro ao desconectar GitHub OAuth");
    res.status(500).json({ error: "Erro ao desconectar." });
  }
});

export default router;
