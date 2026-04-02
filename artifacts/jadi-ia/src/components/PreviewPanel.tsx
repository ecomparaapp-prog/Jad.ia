import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Globe,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface PreviewPanelProps {
  projectId: number;
  token: string | null;
  revisionId: number;
  currentFileName?: string;
}

type PreviewStatus = "loading" | "live" | "error" | "no-html" | "no-project";

function buildPreviewUrl(projectId: number, token: string, revision: number): string {
  return `/api/projects/${projectId}/preview?token=${encodeURIComponent(token)}&t=${revision}`;
}

export default function PreviewPanel({
  projectId,
  token,
  revisionId,
  currentFileName,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localRevision, setLocalRevision] = useState(revisionId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (revisionId !== localRevision) {
      setLocalRevision(revisionId);
      setStatus("loading");
      setIsRefreshing(true);
    }
  }, [revisionId]);

  const handleLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && doc.body) {
        const bodyText = doc.body.innerText?.trim() ?? "";
        if (
          doc.title === "" &&
          bodyText.startsWith("Token")
        ) {
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
    setLocalRevision((r) => r + 1);
  }

  const previewUrl =
    token && projectId
      ? buildPreviewUrl(projectId, token, localRevision)
      : null;

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
      <div
        className="flex items-center justify-between px-3 h-9 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.025)" }}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="h-3.5 w-3.5 text-teal-400/70 flex-shrink-0" />
          <StatusDot />
        </div>

        <div className="flex items-center gap-1">
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

      <div className="flex-1 overflow-hidden relative">
        {!token ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground px-6 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-400/50" />
            <p className="text-xs">Faça login para ver o preview.</p>
          </div>
        ) : (
          <>
            {status === "error" && (
              <AnimatePresence>
                <motion.div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
                  style={{ background: "#090912" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/80 mb-1">
                      Erro ao renderizar preview
                    </p>
                    {errorMsg && (
                      <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
                    )}
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors border border-teal-400/30 hover:border-teal-400/60 px-3 py-1.5 rounded-md"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Tentar novamente
                  </button>
                </motion.div>
              </AnimatePresence>
            )}

            {status === "loading" && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ background: "#090912" }}
              >
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
                  </div>
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
          </>
        )}
      </div>

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
