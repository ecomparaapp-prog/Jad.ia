import { useState, useEffect, useCallback } from "react";
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
  KeyRound,
  Clock,
} from "lucide-react";

interface GitHubStatus {
  connected: boolean;
  hasToken?: boolean;
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

  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [repoNameInput, setRepoNameInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as GitHubStatus;
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
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
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.connected) fetchCommits();
  }, [status?.connected, fetchCommits]);

  async function handleConnect() {
    if (!token) return;
    setConnecting(true);
    try {
      const res = await fetch(`${BASE}/projects/${projectId}/github/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ repoName: repoNameInput || projectName, isPrivate }),
      });
      const data = await res.json() as GitHubStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao conectar.");
      setStatus({ connected: true, ...data });
      setShowConnect(false);
      setRepoNameInput("");
      toast({ title: "Repositório conectado!", description: `github.com/${data.owner}/${data.repoName}` });
      fetchCommits();
    } catch (err) {
      toast({ title: "Erro ao conectar", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
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
      fetchStatus();
      fetchCommits();
    } catch (err) {
      toast({ title: "Erro ao sincronizar", description: String(err instanceof Error ? err.message : err), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!token) return;
    setDisconnecting(true);
    try {
      await fetch(`${BASE}/projects/${projectId}/github`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus({ connected: false });
      setCommits([]);
      setLastSync(null);
      toast({ title: "Repositório desconectado." });
    } catch {
      toast({ title: "Erro ao desconectar.", variant: "destructive" });
    } finally {
      setDisconnecting(false);
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

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status?.hasToken && !status?.connected) {
    return (
      <div className="space-y-3 p-1">
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs font-medium text-yellow-300">GITHUB_TOKEN não configurado</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Para usar o GitHub Bridge, adicione um Personal Access Token nos Secrets do Replit com a chave <code className="bg-muted px-1 rounded">GITHUB_TOKEN</code>.
          </p>
          <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
            <li>Acesse <strong>GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens Classic</strong></li>
            <li>Crie um token com permissão <code className="bg-muted px-1 rounded">repo</code></li>
            <li>No Replit, adicione nos Secrets: <code className="bg-muted px-1 rounded">GITHUB_TOKEN = seu_token</code></li>
          </ol>
          <a
            href="https://github.com/settings/tokens/new"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Criar token no GitHub
          </a>
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="space-y-3 p-1">
        {!showConnect ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
              <div className="flex items-center gap-2">
                <Github className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium">GitHub Bridge</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Conecte este projeto a um repositório no GitHub para versionar automaticamente o código gerado pela IA.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-[#238636] hover:bg-[#2ea043] text-white border-0"
              onClick={() => setShowConnect(true)}
            >
              <Github className="h-3.5 w-3.5 mr-1.5" />
              Conectar ao GitHub
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Nome do repositório</p>
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
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                <span className="ml-1">{connecting ? "Criando..." : "Criar"}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowConnect(false)}
                disabled={connecting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      <div className="rounded-lg border border-[#238636]/30 bg-[#238636]/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.6)]" />
            <span className="text-[11px] font-medium text-[#3fb950]">Conectado</span>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-muted-foreground/40 hover:text-red-400 transition-colors"
            title="Desconectar repositório"
          >
            <Unlink className="h-3 w-3" />
          </button>
        </div>

        <a
          href={status.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 group"
        >
          <Github className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-[11px] font-mono text-foreground/80 group-hover:text-teal-400 transition-colors truncate">
            {status.owner}/{status.repoName}
          </span>
          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50 group-hover:text-teal-400 transition-colors flex-shrink-0 ml-auto" />
        </a>

        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] font-mono text-muted-foreground">{status.defaultBranch ?? "main"}</span>
          {status.lastSyncAt && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/60">{formatDate(status.lastSyncAt)}</span>
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
            Sincronizar com GitHub
          </>
        )}
      </Button>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Histórico de commits</span>
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
          <ScrollArea className="h-[180px]">
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

      {!status.lastSyncAt && (
        <div className="flex items-start gap-2 p-2.5 rounded-md border border-yellow-500/15 bg-yellow-500/5">
          <AlertTriangle className="h-3 w-3 text-yellow-400/70 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-300/70 leading-relaxed">
            Repositório criado mas ainda não sincronizado. Clique em <strong>Sincronizar</strong> para enviar os arquivos.
          </p>
        </div>
      )}
    </div>
  );
}
