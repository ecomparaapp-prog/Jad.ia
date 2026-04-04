import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface MobilePanelProps {
  projectId: number;
}

type MobileStatus = "stopped" | "installing" | "starting" | "ready" | "error";

interface SSEEvent {
  type: "status" | "log" | "sync";
  status?: MobileStatus;
  tunnelUrl?: string | null;
  line?: string;
  fileName?: string;
  message?: string;
}

const STATUS_LABEL: Record<MobileStatus, string> = {
  stopped: "Desconectado",
  installing: "Instalando pacotes…",
  starting: "Iniciando túnel…",
  ready: "Live",
  error: "Erro",
};

const STATUS_COLOR: Record<MobileStatus, string> = {
  stopped: "bg-muted text-muted-foreground",
  installing: "bg-yellow-500/20 text-yellow-400",
  starting: "bg-blue-500/20 text-blue-400",
  ready: "bg-green-500/20 text-green-400",
  error: "bg-destructive/20 text-destructive",
};

const PULSE: Record<MobileStatus, boolean> = {
  stopped: false,
  installing: true,
  starting: true,
  ready: true,
  error: false,
};

export default function MobilePanel({ projectId }: MobilePanelProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<MobileStatus>("stopped");
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const apiBase = "/api";

  const connectSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
    }
    const url = `${apiBase}/projects/${projectId}/mobile/status?token=${encodeURIComponent(token ?? "")}`;
    const es = new EventSource(url);

    es.onmessage = (e: MessageEvent) => {
      try {
        const data: SSEEvent = JSON.parse(e.data as string);
        if (data.type === "status" && data.status) {
          setStatus(data.status);
          setTunnelUrl(data.tunnelUrl ?? null);
        } else if (data.type === "log" && data.line) {
          setLogs((prev) => {
            const next = [...prev, data.line!];
            return next.length > 150 ? next.slice(-150) : next;
          });
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setTimeout(connectSSE, 5000);
    };

    sseRef.current = es;
  }, [projectId, token]);

  useEffect(() => {
    void fetch(`${apiBase}/projects/${projectId}/mobile/state`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d: { status: MobileStatus; tunnelUrl: string | null }) => {
        setStatus(d.status ?? "stopped");
        setTunnelUrl(d.tunnelUrl ?? null);
      })
      .catch(() => {});

    connectSSE();
    return () => {
      sseRef.current?.close();
    };
  }, [projectId, connectSSE, token]);

  useEffect(() => {
    if (showLogs) logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, showLogs]);

  const startPreview = async () => {
    setLoading(true);
    setLogs([]);
    try {
      await fetch(`${apiBase}/projects/${projectId}/mobile/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setStatus("installing");
      connectSSE();
    } catch {
      toast({ title: "Erro ao iniciar preview mobile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stopPreview = async () => {
    setLoading(true);
    try {
      await fetch(`${apiBase}/projects/${projectId}/mobile/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setStatus("stopped");
      setTunnelUrl(null);
    } catch {
      toast({ title: "Erro ao parar preview mobile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    setLoading(true);
    setLogs([]);
    try {
      await fetch(`${apiBase}/projects/${projectId}/mobile/clear-cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      toast({ title: "Cache limpo! Reiniciando…" });
      setStatus("starting");
      setTunnelUrl(null);
    } catch {
      toast({ title: "Erro ao limpar cache", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!tunnelUrl) return;
    await navigator.clipboard.writeText(tunnelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = status !== "stopped" && status !== "error";

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-violet-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground">Conexão Mobile</span>
        <div className="ml-auto flex items-center gap-1.5">
          {PULSE[status] && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
          )}
          <Badge className={`text-[10px] px-1.5 py-0 h-4 ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>
      </div>

      {/* Instructions */}
      {status === "stopped" && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gere um app mobile com o Construtor e clique em <strong>Iniciar Preview</strong> para ver seu app em tempo real no celular.
          </p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Instale o <strong>Expo Go</strong> no seu celular</li>
            <li>Clique em Iniciar Preview abaixo</li>
            <li>Escaneie o QR Code que aparecer</li>
          </ol>
        </div>
      )}

      {/* QR Code */}
      {status === "ready" && tunnelUrl && (
        <div className="flex flex-col items-center gap-2">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <QRCode
              value={tunnelUrl}
              size={160}
              bgColor="#ffffff"
              fgColor="#0f0f1a"
              level="M"
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Abra o Expo Go e escaneie
          </p>
          <div className="w-full flex items-center gap-1 bg-muted/40 rounded px-2 py-1">
            <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
              {tunnelUrl}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 flex-shrink-0"
              onClick={copyUrl}
              title="Copiar URL"
            >
              {copied ? <CheckCheck className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {/* Loading / Starting states */}
      {(status === "installing" || status === "starting") && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-violet-500/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-foreground">
              {status === "installing" ? "Instalando dependências…" : "Criando túnel seguro…"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {status === "installing"
                ? "Primeira vez pode levar 2-3 minutos"
                : "Aguarde o Expo conectar via ngrok"}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">
              Erro ao iniciar o preview. Tente limpar o cache.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-auto">
        {!isActive ? (
          <Button
            size="sm"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 gap-1.5"
            onClick={startPreview}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Iniciar Preview
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 text-xs h-8 gap-1.5"
              onClick={stopPreview}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
              Parar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 gap-1.5"
              onClick={clearCache}
              disabled={loading}
              title="Limpar cache e reiniciar"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Cache
            </Button>
          </div>
        )}

        {status === "ready" && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs h-7 gap-1.5 text-muted-foreground"
            onClick={connectSSE}
          >
            <RefreshCw className="h-3 w-3" />
            Reconectar
          </Button>
        )}
      </div>

      {/* Logs accordion */}
      {logs.length > 0 && (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground hover:bg-muted/30 transition-colors"
            onClick={() => setShowLogs((v) => !v)}
          >
            <span className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3" />
              Logs do Expo ({logs.length})
            </span>
            {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showLogs && (
            <ScrollArea className="h-40 bg-black/30">
              <div className="p-2 space-y-0.5 font-mono">
                {logs.map((log, i) => (
                  <p key={i} className="text-[9px] text-green-400/80 leading-relaxed break-all">
                    {log}
                  </p>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Info footer */}
      <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
        Requer <strong>Expo Go</strong> no celular •{" "}
        <a
          href="https://expo.dev/go"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          expo.dev/go
        </a>
      </p>
    </div>
  );
}
