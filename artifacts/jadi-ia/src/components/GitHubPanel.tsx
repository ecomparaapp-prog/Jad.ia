import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GitBranch,
  Github,
  RefreshCw,
  ExternalLink,
  GitCommit,
  Loader2,
  Check,
  AlertTriangle,
  Unlink,
  Upload,
  Clock,
  LogOut,
} from "lucide-react";

interface OAuthStatus {
  connected: boolean;
  oauthConfigured: boolean;
  githubLogin?: string;
  githubName?: string;
  githubAvatarUrl?: string;
  scope?: string;
  connectedAt?: string;
}

interface RepoStatus {
  connected: boolean;
  owner?: string;
  repoName?: string;
  repoUrl?: string;
  defaultBranch?: string;
  lastSyncAt?: string | null;
  lastCommitSha?: string | null;
}

interface Commit {
  sha: string;
  fullSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface SyncResult {
  message: string;
  filesChanged: number;
  commitSha?: string;
  commitUrl?: string;
}

interface Props {
  projectId: number;
  projectName: string;
}

const BASE = "/api";

export default function GitHubPanel({ projectId, projectName }: Props) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const [repoStatus, setRepoStatus] = useState<RepoStatus | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);

  const [loadingOauth, setLoadingOauth] = useState(true);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingOauth, setDisconnectingOauth] = useState(false);
  const [disconnectingRepo, setDisconnectingRepo] = useState(false);
  const [startingOauth, setStartingOauth] = useState(false);

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [repoNameInput, setRepoNameInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const fetchOauthStatus = useCallback(async () => {
    if (!token) return;
    setLoadingOauth(true);
    try {
      const res = await fetch(`${BASE}/auth/github/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as OAuthStatus;
      setOauthStatus(data);
    } catch {
      setOauthStatus({ connected: false, oauthConfigured: false });
    } finally {
      setLoadingOauth(false);
    }
  }, [token]);

  const fetchRepoStatus = useCallback(async () => {
    if (!token) return;
    setLoadingRepo(true);
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as RepoStatus;
      setRepoStatus(data);
    } catch {
      setRepoStatus({ connected: false });
    } finally {
      setLoadingRepo(false);
    }
  }, [projectId, token]);

  const fetchCommits = useCallback(async () => {
    if (!token) return;
    setLoadingCommits(true);
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github/commits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCommits(await res.json() as Commit[]);
    } catch {
      /* ignore */
    } finally {
      setLoadingCommits(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    fetchOauthStatus();
  }, [fetchOauthStatus]);

  useEffect(() => {
    if (oauthStatus?.connected) fetchRepoStatus();
  }, [oauthStatus?.connected, fetchRepoStatus]);

  useEffect(() => {
    if (repoStatus?.connected) fetchCommits();
  }, [repoStatus?.connected, fetchCommits]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubParam = params.get("github");
    if (githubParam === "connected") {
      toast({ title: "GitHub conectado com sucesso!", description: "Sua conta foi vinculada." });
      fetchOauthStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("github");
      window.history.replaceState({}, "", url.toString());
    } else if (githubParam === "denied") {
      toast({ title: "Autorização cancelada", description: "Você cancelou a conexão com o GitHub.", variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete("github");
      window.history.replaceState({}, "", url.toString());
    } else if (githubParam === "error") {
      toast({ title: "Erro ao conectar GitHub", description: "Tente novamente.", variant: "destructive" });
      const url = new URL(window.location.href);
      url.searchParams.delete("github");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function handleStartOAuth() {
    if (!token) return;
    setStartingOauth(true);
    try {
      const res = await fetch(`${BASE}/auth/github/authorize`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Erro ao iniciar OAuth");
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "Erro ao conectar",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      });
      setStartingOauth(false);
    }
  }

  async function handleDisconnectOAuth() {
    if (!token) return;
    setDisconnectingOauth(true);
    try {
      await fetch(`${BASE}/auth/github/disconnect`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setOauthStatus({ connected: false, oauthConfigured: true });
      setRepoStatus(null);
      setCommits([]);
      toast({ title: "GitHub desconectado." });
    } catch {
      toast({ title: "Erro ao desconectar.", variant: "destructive" });
    } finally {
      setDisconnectingOauth(false);
    }
  }

  async function handleConnectRepo() {
    if (!token) return;
    setConnecting(true);
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: repoNameInput || projectName, isPrivate }),
      });
      const data = await res.json() as RepoStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao conectar.");
      setRepoStatus({ connected: true, ...data });
      setShowConnectForm(false);
      setRepoNameInput("");
      toast({ title: "Repositório conectado!", description: `github.com/${data.owner}/${data.repoName}` });
      fetchCommits();
    } catch (err) {
      toast({ title: "Erro ao criar repositório", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  }

  async function handleSync() {
    if (!token) return;
    setSyncing(true);
    setLastSync(null);
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json() as SyncResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao sincronizar.");
      setLastSync(data);
      toast({
        title: data.filesChanged === 0 ? "Nada para sincronizar" : "Sincronização concluída!",
        description: data.filesChanged === 0
          ? "Todos os arquivos já estão atualizados."
          : `${data.filesChanged} arquivo(s) enviado(s) com sucesso.`,
      });
      fetchRepoStatus();
      fetchCommits();
    } catch (err) {
      toast({ title: "Erro ao sincronizar", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnectRepo() {
    if (!token) return;
    setDisconnectingRepo(true);
    try {
      await fetch(`${BASE}/projects/${projectId}/github`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepoStatus({ connected: false });
      setCommits([]);
      setLastSync(null);
      toast({ title: "Repositório desconectado." });
    } catch {
      toast({ title: "Erro ao desconectar.", variant: "destructive" });
    } finally {
      setDisconnectingRepo(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `há ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `há ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `há ${days}d`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  if (loadingOauth) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">

      {/* ── BLOCO 1: Conexão OAuth com o GitHub ── */}
      {!oauthStatus?.connected ? (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">Conectar ao GitHub</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Vincule sua conta do GitHub para criar repositórios e publicar projetos diretamente da Jad.ia.
          </p>
          {!oauthStatus?.oauthConfigured ? (
            <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                <p className="text-[10px] font-medium text-yellow-300">OAuth não configurado</p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Configure <code className="bg-muted px-1 rounded">GITHUB_CLIENT_ID</code> e{" "}
                <code className="bg-muted px-1 rounded">GITHUB_CLIENT_SECRET</code> nos Secrets do Replit.
              </p>
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Criar OAuth App no GitHub
              </a>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-[#238636] hover:bg-[#2ea043] text-white border-0"
              onClick={handleStartOAuth}
              disabled={startingOauth}
            >
              {startingOauth ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Github className="h-3.5 w-3.5 mr-1.5" />
              )}
              {startingOauth ? "Redirecionando..." : "Entrar com GitHub"}
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#238636]/30 bg-[#238636]/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {oauthStatus.githubAvatarUrl ? (
                <img
                  src={oauthStatus.githubAvatarUrl}
                  alt={oauthStatus.githubLogin}
                  className="h-6 w-6 rounded-full border border-[#238636]/40"
                />
              ) : (
                <Github className="h-4 w-4 text-[#3fb950]" />
              )}
              <div>
                <p className="text-[11px] font-medium text-[#3fb950]">
                  {oauthStatus.githubName ?? oauthStatus.githubLogin}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">@{oauthStatus.githubLogin}</p>
              </div>
            </div>
            <button
              onClick={handleDisconnectOAuth}
              disabled={disconnectingOauth}
              className="text-muted-foreground/40 hover:text-red-400 transition-colors p-1"
              title="Desconectar conta do GitHub"
            >
              {disconnectingOauth ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <LogOut className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── BLOCO 2: Repositório do projeto (só se OAuth conectado) ── */}
      {oauthStatus?.connected && (
        <>
          {loadingRepo ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
            </div>
          ) : !repoStatus?.connected ? (
            <div className="space-y-2">
              {!showConnectForm ? (
                <>
                  <div className="p-2.5 rounded-lg bg-muted/20 border border-border space-y-1">
                    <p className="text-[11px] font-medium">Nenhum repositório vinculado</p>
                    <p className="text-[10px] text-muted-foreground">
                      Crie ou conecte um repositório no GitHub para versionar este projeto.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs bg-[#238636] hover:bg-[#2ea043] text-white border-0"
                    onClick={() => setShowConnectForm(true)}
                  >
                    <Github className="h-3 w-3 mr-1.5" />
                    Criar repositório
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nome do repositório</p>
                  <Input
                    value={repoNameInput}
                    onChange={(e) => setRepoNameInput(e.target.value)}
                    placeholder={projectName}
                    className="h-7 text-xs font-mono"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-[11px] text-muted-foreground">Repositório privado</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-[#238636] hover:bg-[#2ea043] text-white border-0"
                      onClick={handleConnectRepo}
                      disabled={connecting}
                    >
                      {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      <span className="ml-1">{connecting ? "Criando..." : "Criar"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setShowConnectForm(false)}
                      disabled={connecting}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.4)]" />
                    <span className="text-[10px] text-[#3fb950]">Repositório conectado</span>
                  </div>
                  <button
                    onClick={handleDisconnectRepo}
                    disabled={disconnectingRepo}
                    className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                    title="Desvincular repositório"
                  >
                    <Unlink className="h-3 w-3" />
                  </button>
                </div>

                <a
                  href={repoStatus.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 group"
                >
                  <Github className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] font-mono text-foreground/80 group-hover:text-teal-400 transition-colors truncate">
                    {repoStatus.owner}/{repoStatus.repoName}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50 group-hover:text-teal-400 transition-colors flex-shrink-0 ml-auto" />
                </a>

                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-mono text-muted-foreground">{repoStatus.defaultBranch ?? "main"}</span>
                  {repoStatus.lastSyncAt && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/60">{formatDate(repoStatus.lastSyncAt)}</span>
                    </>
                  )}
                </div>
              </div>

              {lastSync && lastSync.filesChanged > 0 && (
                <div className="rounded-md border border-[#238636]/20 bg-[#238636]/5 px-3 py-2 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-[#3fb950]" />
                    <span className="text-[11px] text-[#3fb950]">{lastSync.filesChanged} arquivo(s) sincronizado(s)</span>
                  </div>
                  {lastSync.commitUrl && (
                    <a
                      href={lastSync.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-teal-400 transition-colors"
                    >
                      <GitCommit className="h-2.5 w-2.5" />
                      {lastSync.commitSha?.slice(0, 7)}
                      <ExternalLink className="h-2 w-2 ml-0.5" />
                    </a>
                  )}
                </div>
              )}

              <Button
                size="sm"
                className="w-full h-8 text-xs"
                style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Enviando alterações...
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Publicar no GitHub
                  </>
                )}
              </Button>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Histórico</span>
                  <button onClick={fetchCommits} disabled={loadingCommits} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    <RefreshCw className={`h-3 w-3 ${loadingCommits ? "animate-spin" : ""}`} />
                  </button>
                </div>
                {loadingCommits ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                  </div>
                ) : commits.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/50 text-center py-3">Nenhum commit ainda</p>
                ) : (
                  <ScrollArea className="h-[160px]">
                    <div className="space-y-0.5">
                      {commits.map((c) => (
                        <a
                          key={c.fullSha}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/40 transition-colors group"
                        >
                          <GitCommit className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-foreground/80 truncate leading-tight">{c.message}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <code className="text-[9px] text-muted-foreground/50 font-mono">{c.sha}</code>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-[9px] text-muted-foreground/50">{formatDate(c.date)}</span>
                            </div>
                          </div>
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {!repoStatus.lastSyncAt && (
                <div className="flex items-start gap-2 p-2.5 rounded-md border border-yellow-500/15 bg-yellow-500/5">
                  <AlertTriangle className="h-3 w-3 text-yellow-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-yellow-300/70 leading-relaxed">
                    Repositório criado mas ainda não publicado. Clique em <strong>Publicar no GitHub</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
