import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Globe,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface PreviewPanelProps {
  projectId: number;
  token: string | null;
  revisionId: number;
  currentFileName?: string;
  projectLanguage?: string;
}

type PreviewStatus = "loading" | "live" | "error" | "no-html" | "no-project";

function isMobileProject(lang?: string): boolean {
  if (!lang) return false;
  const lower = lang.toLowerCase();
  return lower.includes("react native") || lower.includes("mobile") || lower.includes("expo") || lower.includes("flutter");
}

interface ConsoleEntry {
  id: string;
  level: "error" | "warn" | "log";
  message: string;
  timestamp: string;
}

function buildPreviewUrl(projectId: number, token: string, revision: number): string {
  return `/api/projects/${projectId}/preview?token=${encodeURIComponent(token)}&t=${revision}`;
}

export default function PreviewPanel({
  projectId,
  token,
  revisionId,
  currentFileName,
  projectLanguage,
}: PreviewPanelProps) {
  const isMobile = isMobileProject(projectLanguage);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localRevision, setLocalRevision] = useState(revisionId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    if (revisionId !== localRevision) {
      setLocalRevision(revisionId);
      setStatus("loading");
      setIsRefreshing(true);
      setConsoleEntries([]);
    }
  }, [revisionId]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== "__jadia_console") return;
      const entry: ConsoleEntry = {
        id: Math.random().toString(36).slice(2),
        level: e.data.level as "error" | "warn" | "log",
        message: String(e.data.message),
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      };
      setConsoleEntries((prev) => [...prev.slice(-49), entry]);
      if (entry.level === "error") setShowConsole(true);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.body) {
        const bodyText = doc.body.innerText?.trim() ?? "";
        if (doc.title === "" && bodyText.startsWith("Token")) {
          setStatus("error");
          setErrorMsg("Token inválido — faça login novamente.");
        } else {
          setStatus("live");
          setErrorMsg(null);
        }
      } else {
        setStatus("live");
        setErrorMsg(null);
      }
    } catch {
      setStatus("live");
      setErrorMsg(null);
    }
    setIsRefreshing(false);
  }, []);

  const handleError = useCallback(() => {
    setStatus("error");
    setErrorMsg("Não foi possível carregar o preview.");
    setIsRefreshing(false);
  }, []);

  function handleRefresh() {
    setStatus("loading");
    setIsRefreshing(true);
    setConsoleEntries([]);
    setLocalRevision((r) => r + 1);
  }

  const previewUrl =
    token && projectId
      ? buildPreviewUrl(projectId, token, localRevision)
      : null;

  const errorCount = consoleEntries.filter((e) => e.level === "error").length;
  const warnCount = consoleEntries.filter((e) => e.level === "warn").length;

  const StatusDot = () => {
    if (status === "loading") {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-yellow-400/80">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando...
        </span>
      );
    }
    if (status === "live") {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-teal-400">
          <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
          Preview ativo
        </span>
      );
    }
    if (status === "error") {
      return (
        <span className="flex items-center gap-1.5 text-[11px] font-mono text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Erro de renderização
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
        Sem preview
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#090912" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 h-9 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
      >
        <div className="flex items-center gap-2.5">
          {isMobile ? (
            <svg className="h-3.5 w-3.5 text-teal-400/70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          ) : (
            <Globe className="h-3.5 w-3.5 text-teal-400/70 flex-shrink-0" />
          )}
          <StatusDot />
          {isMobile && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.25)" }}>
              mobile
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {consoleEntries.length > 0 && (
            <button
              onClick={() => setShowConsole((v) => !v)}
              className={`flex items-center gap-1 h-6 px-2 rounded text-[10px] font-mono transition-colors ${
                errorCount > 0
                  ? "text-red-400 hover:bg-red-500/10"
                  : warnCount > 0
                  ? "text-yellow-400 hover:bg-yellow-500/10"
                  : "text-muted-foreground hover:bg-white/5"
              }`}
              title="Terminal de erros"
            >
              <Terminal className="h-3 w-3" />
              {errorCount > 0 && <span className="text-red-400">{errorCount}e</span>}
              {warnCount > 0 && <span className="text-yellow-400 ml-0.5">{warnCount}w</span>}
              {showConsole ? <ChevronDown className="h-3 w-3 ml-0.5" /> : <ChevronUp className="h-3 w-3 ml-0.5" />}
            </button>
          )}
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={handleRefresh}
            className={`h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors ${isRefreshing ? "text-teal-400" : ""}`}
            title="Recarregar preview"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Preview content area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center" style={{ background: isMobile ? "#0d0d14" : "#090912" }}>
        {!token ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400/50" />
            <p className="text-xs">Faça login para ver o preview.</p>
          </div>
        ) : isMobile ? (
          /* ─── MOBILE PHONE FRAME ─── */
          <div className="flex items-center justify-center h-full w-full py-4 px-3">
            <div className="relative flex-shrink-0" style={{ width: 220, height: "100%", maxHeight: 420 }}>
              {/* Phone shell */}
              <div className="absolute inset-0 rounded-[32px] border-4 pointer-events-none z-10"
                style={{ borderColor: "#1e293b", background: "transparent", boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full" style={{ background: "#0f172a" }} />
                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
              </div>

              {/* Iframe inside phone */}
              <div className="absolute inset-[4px] rounded-[28px] overflow-hidden" style={{ background: "#fff" }}>
                {status === "error" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center" style={{ background: "#090912" }}>
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                    <p className="text-[10px] text-foreground/70">Erro ao renderizar</p>
                    <button onClick={handleRefresh} className="text-[10px] text-teal-400 border border-teal-400/30 px-2 py-1 rounded">
                      Tentar novamente
                    </button>
                  </div>
                )}
                {status === "loading" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "#090912" }}>
                    <div className="h-6 w-6 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
                  </div>
                )}
                {previewUrl && (
                  <iframe
                    key={`preview-${localRevision}`}
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    style={{ display: status === "error" ? "none" : "block", background: "white" }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    title="Preview mobile"
                    onLoad={handleLoad}
                    onError={handleError}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ─── BROWSER FRAME ─── */
          <div className="flex flex-col h-full w-full">
            {/* Browser chrome bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 h-8 border-b" style={{ background: "#0e1117", borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex items-center gap-2 h-5 rounded-md px-2 text-[10px] font-mono text-muted-foreground/50 truncate" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Globe className="h-2.5 w-2.5 flex-shrink-0" />
                <span>preview.jad.ia</span>
              </div>
              <button onClick={handleRefresh} className={`h-5 w-5 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors ${isRefreshing ? "text-teal-400" : ""}`}>
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Iframe area */}
            <div className="flex-1 relative overflow-hidden">
              {status === "error" && (
                <AnimatePresence>
                  <motion.div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
                    style={{ background: "#090912" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/80 mb-1">Erro ao renderizar preview</p>
                      {errorMsg && <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>}
                    </div>
                    <button onClick={handleRefresh} className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors border border-teal-400/30 hover:border-teal-400/60 px-3 py-1.5 rounded-md">
                      <RefreshCw className="h-3 w-3" />
                      Tentar novamente
                    </button>
                  </motion.div>
                </AnimatePresence>
              )}
              {status === "loading" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: "#090912" }}>
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
                    <p className="text-xs font-mono">Renderizando...</p>
                  </div>
                </div>
              )}
              {previewUrl && (
                <iframe
                  key={`preview-${localRevision}`}
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="Preview do projeto"
                  onLoad={handleLoad}
                  onError={handleError}
                  style={{ display: status === "error" ? "none" : "block" }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConsole && consoleEntries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 140, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-t overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.6)" }}
          >
            <div
              className="flex items-center justify-between px-3 py-1 border-b"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Terminal</span>
                {errorCount > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{errorCount} erro{errorCount !== 1 ? "s" : ""}</span>
                )}
              </div>
              <button
                onClick={() => setConsoleEntries([])}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                title="Limpar terminal"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-y-auto h-[108px] p-1.5 space-y-0.5 font-mono">
              {consoleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 px-2 py-1 rounded text-[10px] ${
                    entry.level === "error"
                      ? "bg-red-500/8 text-red-300"
                      : entry.level === "warn"
                      ? "bg-yellow-500/8 text-yellow-300"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {entry.level === "error" && <AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />}
                  {entry.level === "warn" && <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />}
                  {entry.level === "log" && <span className="h-3 w-3 flex-shrink-0 text-center text-[8px] text-muted-foreground/40 mt-0.5">›</span>}
                  <span className="text-muted-foreground/30 flex-shrink-0">{entry.timestamp}</span>
                  <span className="flex-1 break-all leading-relaxed">{entry.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentFileName && (
        <div
          className="flex items-center gap-1.5 px-3 h-6 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}
        >
          <FileCode className="h-2.5 w-2.5 text-muted-foreground/50" />
          <span className="text-[10px] font-mono text-muted-foreground/50 truncate">
            {currentFileName}
          </span>
        </div>
      )}
    </div>
  );
}
