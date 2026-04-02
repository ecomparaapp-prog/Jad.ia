import { useState, useRef, useEffect, useCallback, DragEvent, ClipboardEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  RefreshCw,
  Image,
  FileText,
  Trash2,
  Copy,
  Check,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Search,
  Terminal,
  AlertCircle,
} from "lucide-react";

interface Attachment {
  id: string;
  type: "image" | "snippet";
  preview: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
  isDecision?: boolean;
  agentType?: "analise" | "construcao";
}

interface StackDecision {
  language: string;
  framework: string;
  projectType: string;
  justification: string;
  systemPrompt: string;
}

interface VibeFile {
  name: string;
  status: "writing" | "done" | "queued";
}

interface VibeChatPanelProps {
  projectName: string;
  currentFileName?: string;
  language?: string;
  stackDecision: StackDecision | null;
  hasAnalyzed: boolean;
  isAnalyzing: boolean;
  initialMessages: ChatMessage[];
  onMessagesChange: (msgs: ChatMessage[]) => void;
  onLiveCodeUpdate: (code: string, lang: string) => void;
  onClose: () => void;
  onReanalyze: () => void;
  vibeMode?: boolean;
  onFileWrite?: (filename: string, content: string) => void;
}

const QUICK_COMMANDS = [
  { cmd: "/setup", desc: "Configura estrutura base do projeto" },
  { cmd: "/fix", desc: "Corrige bugs no código atual" },
  { cmd: "/style", desc: "Melhora o estilo visual" },
  { cmd: "/explain", desc: "Explica o que o código faz" },
  { cmd: "/test", desc: "Escreve testes para o código" },
  { cmd: "/refactor", desc: "Refatora e melhora o código" },
  { cmd: "/vibe", desc: "Cria um projeto completo com múltiplos arquivos" },
];

const ANALYST_STATUS = [
  "SISTEMA ANALISTA — Processando requisitos...",
  "Avaliando arquitetura de software...",
  "Gerando diagnóstico técnico...",
  "Estruturando plano de implementação...",
  "Finalizando análise...",
];

const BUILDER_STATUS = [
  "SISTEMA CONSTRUTOR — Inicializando...",
  "Arquitetando componentes...",
  "Escrevendo código-fonte...",
  "Aplicando estrutura de arquivos...",
  "Compilando saída...",
];

const VIBE_SYSTEM_PROMPT = `
MODO VIBE CODING ATIVO — CRIAÇÃO AUTOMÁTICA DE ARQUIVOS:
Quando solicitado a criar um sistema, app ou projeto completo, siga SEMPRE este processo:

1. Primeiro, descreva brevemente (1-2 frases) o que vai construir.
2. Liste os arquivos: "Arquivos: index.html, style.css, app.js"
3. Para CADA arquivo, use EXATAMENTE este formato (sem variações):

===FILE: nome_do_arquivo.extensao===
[conteúdo completo e funcional do arquivo aqui]
===END_FILE===

REGRAS OBRIGATÓRIAS:
- Use apenas HTML, CSS e JavaScript puro (sem npm, sem frameworks externos)
- Sempre crie um index.html como arquivo principal de entrada
- Cada arquivo deve ser completo, funcional e bem estruturado
- Use design moderno com cores escuras e acentos em teal/verde
- Para CSS, use variáveis CSS e design responsivo
- Para JS, use código limpo e comentado
- Não use placeholders — escreva o código real e funcional
`;

const OLIVE_GREEN = "#414833";
const TERRACOTTA = "#582f0e";
const OLIVE_LIGHT = "rgba(65,72,51,0.15)";
const TERRACOTTA_LIGHT = "rgba(88,47,14,0.15)";
const BEIGE = "#f5f0e8";

function extractAllCodeBlocks(text: string): Array<{ code: string; lang: string }> {
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ code: string; lang: string }> = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({ lang: match[1] || "", code: match[2].trim() });
  }
  return blocks;
}

function formatMessage(content: string): { parts: Array<{ type: "text" | "code"; content: string; lang?: string }> } {
  const parts: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", content: match[2].trim(), lang: match[1] || "text" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }
  return { parts };
}

function stripVibeMarkers(content: string): string {
  return content
    .replace(/===FILE: [^\n]+===\n?/g, "")
    .replace(/===END_FILE===/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function CodeBlock({ content, lang }: { content: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-muted-foreground text-[10px] font-mono uppercase tracking-wider">{lang || "código"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-mono"
          title="Copiar código"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed text-[11px] text-foreground/90 font-mono">{content}</pre>
    </div>
  );
}

function AgentBadge({ type }: { type: "analise" | "construcao" }) {
  if (type === "analise") {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-widest mb-1.5"
        style={{ background: OLIVE_LIGHT, color: OLIVE_GREEN, border: `1px solid ${OLIVE_GREEN}40` }}
      >
        <Search className="h-2.5 w-2.5" />
        SISTEMA ANALISTA
      </div>
    );
  }
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-widest mb-1.5"
      style={{ background: TERRACOTTA_LIGHT, color: TERRACOTTA, border: `1px solid ${TERRACOTTA}40` }}
    >
      <Terminal className="h-2.5 w-2.5" />
      SISTEMA CONSTRUTOR
    </div>
  );
}

function VibeFilesProgress({ files }: { files: VibeFile[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mx-3 mb-2 rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(0,137,123,0.06)" }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
        <FolderOpen className="h-3.5 w-3.5 text-teal-400" />
        <span className="text-[11px] font-mono text-teal-400 font-medium">Motor de Escrita de Arquivos</span>
      </div>
      <div className="p-2 space-y-1">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-2 px-2 py-1 rounded-lg">
            {f.status === "done" ? (
              <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
            ) : f.status === "writing" ? (
              <Loader2 className="h-3 w-3 text-teal-400 animate-spin flex-shrink-0" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-white/20 flex-shrink-0" />
            )}
            <span
              className={`text-[10px] font-mono flex-1 truncate ${
                f.status === "done"
                  ? "text-green-400"
                  : f.status === "writing"
                    ? "text-teal-300"
                    : "text-muted-foreground/60"
              }`}
            >
              {f.name}
            </span>
            {f.status === "done" && <span className="text-[9px] font-mono text-green-500/70">salvo</span>}
            {f.status === "writing" && <span className="text-[9px] font-mono text-teal-400/70 animate-pulse">escrevendo...</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VibeChatPanel({
  projectName,
  currentFileName,
  language,
  stackDecision,
  hasAnalyzed,
  isAnalyzing,
  initialMessages,
  onMessagesChange,
  onLiveCodeUpdate,
  onClose,
  onReanalyze,
  vibeMode = false,
  onFileWrite,
}: VibeChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [vibeFiles, setVibeFiles] = useState<VibeFile[]>([]);
  const [activeAgent, setActiveAgent] = useState<"analise" | "construcao">("construcao");
  const [providerSwitchMsg, setProviderSwitchMsg] = useState("");
  const [analysisContext, setAnalysisContext] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastParentMessagesRef = useRef<ChatMessage[]>(initialMessages);
  const processedFilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isStreaming) return;
    lastParentMessagesRef.current = initialMessages;
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (isStreaming) return;
    if (messages === lastParentMessagesRef.current) return;
    onMessagesChange(messages);
  }, [messages, isStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, vibeFiles]);

  useEffect(() => {
    const statusList = activeAgent === "analise" ? ANALYST_STATUS : BUILDER_STATUS;
    if (isStreaming) {
      setStatusIndex(0);
      statusTimerRef.current = setInterval(() => {
        setStatusIndex((i) => (i + 1) % statusList.length);
      }, 2500);
    } else {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      setStatusText("");
    }
    return () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  }, [isStreaming, activeAgent]);

  useEffect(() => {
    const statusList = activeAgent === "analise" ? ANALYST_STATUS : BUILDER_STATUS;
    if (isStreaming) setStatusText(statusList[statusIndex]);
  }, [statusIndex, isStreaming, activeAgent]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  };

  const addAttachment = useCallback((att: Omit<Attachment, "id">) => {
    setAttachments((prev) => [...prev, { ...att, id: Math.random().toString(36).slice(2) }]);
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const blob = imageItem.getAsFile();
        if (!blob) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          addAttachment({ type: "image", preview: url, content: url });
        };
        reader.readAsDataURL(blob);
        return;
      }
      const text = e.clipboardData.getData("text");
      if (text.length > 600) {
        e.preventDefault();
        addAttachment({ type: "snippet", preview: text.slice(0, 60) + "…", content: text });
      }
    },
    [addAttachment],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const url = ev.target?.result as string;
            addAttachment({ type: "image", preview: url, content: url });
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [addAttachment],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    autoResize();
    setShowCommands(val.startsWith("/") && val.length <= 20 && !val.includes(" "));
  };

  const applyCommand = (cmd: string) => {
    setInput(cmd + " ");
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(activeAgent);
    }
    if (e.key === "Escape") setShowCommands(false);
  };

  const buildUserContent = (): string | Array<unknown> => {
    const imageAttachments = attachments.filter((a) => a.type === "image");
    const snippetAttachments = attachments.filter((a) => a.type === "snippet");

    const textParts = [input.trim()];
    snippetAttachments.forEach((s, i) => {
      textParts.push(`\n\n[Documento ${i + 1}]:\n${s.content}`);
    });
    const fullText = textParts.join("");

    if (imageAttachments.length === 0) return fullText;

    return [
      { type: "text", text: fullText },
      ...imageAttachments.map((a) => ({
        type: "image_url",
        image_url: { url: a.content },
      })),
    ];
  };

  function processVibeStream(text: string) {
    if (!vibeMode || !onFileWrite) return;

    const completedRegex = /===FILE: ([^\n=]+)===\n([\s\S]*?)===END_FILE===/g;
    let match;
    const newlyCompleted: string[] = [];

    while ((match = completedRegex.exec(text)) !== null) {
      const filename = match[1].trim();
      const content = match[2];
      if (!processedFilesRef.current.has(filename)) {
        processedFilesRef.current.add(filename);
        newlyCompleted.push(filename);
        onFileWrite(filename, content);
      }
    }

    if (newlyCompleted.length > 0) {
      setVibeFiles((prev) => {
        const updated = [...prev];
        for (const name of newlyCompleted) {
          const idx = updated.findIndex((f) => f.name === name);
          if (idx >= 0) updated[idx] = { ...updated[idx], status: "done" };
          else updated.push({ name, status: "done" });
        }
        return updated;
      });
    }

    const fileStartRegex = /===FILE: ([^\n=]+)===/g;
    let lastFileMatch: RegExpExecArray | null = null;
    let m: RegExpExecArray | null;
    while ((m = fileStartRegex.exec(text)) !== null) lastFileMatch = m;

    if (lastFileMatch) {
      const filename = lastFileMatch[1].trim();
      if (!processedFilesRef.current.has(filename)) {
        const markerFull = `===FILE: ${filename}===`;
        const markerPos = text.lastIndexOf(markerFull);
        if (markerPos >= 0) {
          const contentStart = markerPos + markerFull.length;
          const afterContent = text.slice(contentStart);
          const endMarkerPos = afterContent.indexOf("===END_FILE===");
          const currentContent = endMarkerPos >= 0 ? afterContent.slice(0, endMarkerPos) : afterContent;
          const ext = filename.split(".").pop() || "";
          onLiveCodeUpdate(currentContent.replace(/^\n/, ""), ext);

          setVibeFiles((prev) => {
            if (!prev.find((f) => f.name === filename)) return [...prev, { name: filename, status: "writing" }];
            return prev.map((f) => (f.name === filename ? { ...f, status: "writing" } : f));
          });

          setStatusText(`Escrevendo ${filename}...`);
        }
      }
    }
  }

  const handleSend = async (taskType: "analise" | "construcao" = "construcao", overrideInput?: string) => {
    const trimmed = (overrideInput ?? input).trim();
    if (!trimmed && attachments.length === 0) return;
    if (isStreaming) return;

    setActiveAgent(taskType);
    setProviderSwitchMsg("");

    const userContent = buildUserContent();
    const userMsg: ChatMessage = {
      role: "user",
      content: typeof userContent === "string" ? userContent : trimmed || "[imagem anexada]",
      attachments: [...attachments],
    };

    let contextPrefix = "";
    if (taskType === "construcao" && analysisContext) {
      contextPrefix = `[Contexto do Analista]:\n${analysisContext}\n\n[Instrução do usuário]:\n`;
    }

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setVibeFiles([]);
    processedFilesRef.current = new Set();

    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
      agentType: taskType,
    };
    setMessages([...updatedMessages, assistantPlaceholder]);
    setIsStreaming(true);

    const token = localStorage.getItem("token");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const conversationHistory = updatedMessages
      .filter((m) => !m.isDecision)
      .map((m) => ({
        role: m.role,
        content:
          m.role === "user" && m.attachments?.some((a) => a.type === "image")
            ? userContent
            : contextPrefix && m === userMsg
              ? contextPrefix + m.content
              : m.content,
      }));

    const effectiveLanguage =
      language === "auto"
        ? stackDecision
          ? `${stackDecision.framework} (${stackDecision.language})`
          : "auto"
        : language;

    const extraSystemPrompt = vibeMode
      ? stackDecision?.systemPrompt
        ? `${stackDecision.systemPrompt}\n\n${VIBE_SYSTEM_PROMPT}`
        : VIBE_SYSTEM_PROMPT
      : stackDecision?.systemPrompt ?? null;

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          projectContext: `Projeto: ${projectName}${currentFileName ? `, Arquivo: ${currentFileName}` : ""}`,
          language: effectiveLanguage,
          systemPrompt: extraSystemPrompt,
          taskType,
        }),
        signal: ctrl.signal,
      });

      if (!response.ok || !response.body) throw new Error("Stream não disponível");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let lastCodeBlockCount = 0;

      const flush = () => {
        if (vibeMode) {
          processVibeStream(accumulated);
          const displayContent = stripVibeMarkers(accumulated);
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: displayContent };
            return copy;
          });
        } else {
          const blocks = extractAllCodeBlocks(accumulated);
          if (blocks.length > lastCodeBlockCount && blocks.length > 0) {
            lastCodeBlockCount = blocks.length;
            const last = blocks[blocks.length - 1];
            onLiveCodeUpdate(last.code, last.lang);
          }
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: accumulated };
            return copy;
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data: ")) continue;
          const payload = trimmedLine.slice(6);
          if (!payload) continue;

          try {
            const evt = JSON.parse(payload) as { token?: string; message?: string };
            if (evt.token) {
              accumulated += evt.token;
              flush();
            }
          } catch {
            if (payload === "done" || payload === "{}") break;
          }

          if (trimmedLine.startsWith("event: provider_switch")) {
            setProviderSwitchMsg("Alternando provedor por estabilidade...");
          }
        }
      }

      const finalContent = vibeMode ? stripVibeMarkers(accumulated) : accumulated;

      if (vibeMode) processVibeStream(accumulated);

      if (!vibeMode) {
        const finalBlocks = extractAllCodeBlocks(accumulated);
        if (finalBlocks.length > 0) {
          const last = finalBlocks[finalBlocks.length - 1];
          onLiveCodeUpdate(last.code, last.lang);
        }
      }

      if (taskType === "analise") {
        setAnalysisContext(accumulated);
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: finalContent, isStreaming: false };
        return copy;
      });
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.isStreaming) {
          copy[copy.length - 1] = {
            ...last,
            content: "Erro ao processar. Verifique a conexão e tente novamente.",
            isStreaming: false,
          };
        }
        return copy;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleAnalystRequest = () => {
    if (!input.trim() && attachments.length === 0) return;
    handleSend("analise");
  };

  const handleBuilderRequest = () => {
    if (!input.trim() && attachments.length === 0) return;
    handleSend("construcao");
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.isStreaming) copy[copy.length - 1] = { ...last, isStreaming: false };
      return copy;
    });
  };

  const isAutoMode = language === "auto";

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 380, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex-shrink-0 border-r border-border flex flex-col overflow-hidden"
      style={{
        background: "hsl(var(--sidebar))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none">
          <div className="text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-primary font-medium">Solte a imagem aqui</p>
          </div>
        </div>
      )}

      <div
        className="flex-shrink-0 border-b border-border/60 px-4 py-3"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, transparent 80%)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: OLIVE_LIGHT, border: `1px solid ${OLIVE_GREEN}50` }}
                title="Sistema Analista"
              >
                <Search className="h-4 w-4" style={{ color: OLIVE_GREEN }} />
              </div>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: TERRACOTTA_LIGHT, border: `1px solid ${TERRACOTTA}50` }}
                title="Sistema Construtor"
              >
                <Terminal className="h-4 w-4" style={{ color: TERRACOTTA }} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground leading-none">Jadi.ia</span>
                {vibeMode && (
                  <span className="text-[10px] font-mono bg-teal-500/15 text-teal-400 border border-teal-500/25 px-1.5 py-0.5 rounded-full">
                    multi-arquivo
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] font-mono bg-green-500/15 text-green-400 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  ao vivo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                {isAutoMode && stackDecision
                  ? `Stack: ${stackDecision.framework} · ${stackDecision.language}`
                  : "Analista (Gemini) + Construtor (Groq)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isAutoMode && hasAnalyzed && (
              <button
                onClick={onReanalyze}
                title="Trocar stack"
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
        {messages.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-2 py-8 text-center">
            <div className="w-full grid grid-cols-2 gap-2">
              <div
                className="rounded-xl p-3 text-left"
                style={{ background: OLIVE_LIGHT, border: `1px solid ${OLIVE_GREEN}40` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Search className="h-3.5 w-3.5" style={{ color: OLIVE_GREEN }} />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: OLIVE_GREEN }}>
                    Analista
                  </span>
                </div>
                <p className="text-[10px] text-foreground/60 leading-relaxed">Diagnóstico técnico e plano de arquitetura</p>
              </div>
              <div
                className="rounded-xl p-3 text-left"
                style={{ background: TERRACOTTA_LIGHT, border: `1px solid ${TERRACOTTA}40` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Terminal className="h-3.5 w-3.5" style={{ color: TERRACOTTA }} />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: TERRACOTTA }}>
                    Construtor
                  </span>
                </div>
                <p className="text-[10px] text-foreground/60 leading-relaxed">Executa o plano e escreve os arquivos</p>
              </div>
            </div>

            <div className="w-full space-y-1">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider text-left mb-2">Comandos rápidos</p>
              {QUICK_COMMANDS.map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => applyCommand(c.cmd)}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
                >
                  <span className="text-primary group-hover:text-primary font-semibold min-w-[70px]">{c.cmd}</span>
                  <span className="text-muted-foreground/70 group-hover:text-muted-foreground">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isAnalyzing && messages.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="relative">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ background: OLIVE_LIGHT, border: `1px solid ${OLIVE_GREEN}40` }}
              >
                <Search className="h-6 w-6" style={{ color: OLIVE_GREEN }} />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border border-primary/40 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider mb-1" style={{ color: OLIVE_GREEN }}>
                Sistema Analista
              </p>
              <p className="text-xs text-muted-foreground">Selecionando a melhor stack tecnológica...</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} gap-2`}>
            <div className={`max-w-[90%] ${msg.role === "user" ? "" : ""}`}>
              {msg.role === "assistant" && msg.agentType && <AgentBadge type={msg.agentType} />}
              <div
                className={`rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.isDecision
                      ? "bg-primary/10 border border-primary/20 text-foreground rounded-tl-sm"
                      : msg.agentType === "analise"
                        ? "rounded-tl-sm"
                        : "rounded-tl-sm"
                }`}
                style={
                  msg.role === "assistant"
                    ? msg.agentType === "analise"
                      ? { background: OLIVE_LIGHT, border: `1px solid ${OLIVE_GREEN}30` }
                      : { background: TERRACOTTA_LIGHT, border: `1px solid ${TERRACOTTA}30` }
                    : {}
                }
              >
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/10"
                      >
                        {att.type === "image" ? (
                          <>
                            <Image className="h-3 w-3 text-blue-400" />
                            <img src={att.preview} alt="" className="h-6 w-6 rounded object-cover" />
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3 text-yellow-400" />
                            <span className="text-[10px] text-muted-foreground font-mono">{att.preview}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" ? (
                  <div>
                    {formatMessage(msg.content).parts.map((part, pi) =>
                      part.type === "code" ? (
                        <CodeBlock key={pi} content={part.content} lang={part.lang || ""} />
                      ) : (
                        <span
                          key={pi}
                          className="whitespace-pre-wrap"
                          style={{
                            fontFamily: msg.agentType === "analise" ? "'Inter', 'system-ui', sans-serif" : undefined,
                          }}
                        >
                          {part.content}
                        </span>
                      ),
                    )}
                    {msg.isStreaming && (
                      <span
                        className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse rounded-sm align-middle"
                        style={{ background: msg.agentType === "analise" ? OLIVE_GREEN : TERRACOTTA }}
                      />
                    )}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <VibeFilesProgress files={vibeFiles} />

      {providerSwitchMsg && !isStreaming && (
        <div className="px-3 py-1.5 flex-shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <AlertCircle className="h-3 w-3 text-yellow-500" />
            {providerSwitchMsg}
          </div>
        </div>
      )}

      {isStreaming && statusText && (
        <div className="px-3 py-1.5 flex-shrink-0 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 w-1 rounded-full"
                  style={{
                    background: activeAgent === "analise" ? OLIVE_GREEN : TERRACOTTA,
                    animation: `pulse 1.2s ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{statusText}</span>
          </div>
        </div>
      )}

      {isAutoMode && hasAnalyzed && stackDecision && !isStreaming && messages.length > 0 && (
        <div className="px-3 pb-1 flex-shrink-0">
          <button
            onClick={onReanalyze}
            className="w-full text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors py-1.5 flex items-center justify-center gap-1.5 border border-dashed border-white/10 rounded-lg hover:border-primary/30 hover:bg-white/5"
          >
            <RefreshCw className="h-3 w-3" />
            Trocar stack / re-analisar
          </button>
        </div>
      )}

      <div className="border-t border-white/10 p-2.5 flex-shrink-0 space-y-2">
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5"
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1 group"
                >
                  {att.type === "image" ? (
                    <>
                      <Image className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      <img src={att.preview} alt="" className="h-5 w-5 rounded object-cover" />
                      <span className="text-[10px] text-muted-foreground font-mono">imagem</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-[10px] text-muted-foreground font-mono max-w-[120px] truncate">{att.preview}</span>
                    </>
                  )}
                  <button
                    onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all ml-1"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCommands && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="rounded-xl border border-white/10 overflow-hidden"
              style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(20px)" }}
            >
              {QUICK_COMMANDS.filter((c) => c.cmd.startsWith(input.toLowerCase())).map((c) => (
                <button
                  key={c.cmd}
                  onClick={() => applyCommand(c.cmd)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <span className="text-xs font-mono text-primary">{c.cmd}</span>
                  <span className="text-[10px] text-muted-foreground">{c.desc}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="rounded-xl border border-white/10 overflow-hidden transition-colors"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isAnalyzing
                ? "Aguarde a análise da stack..."
                : isStreaming
                  ? "Aguarde a resposta..."
                  : vibeMode
                    ? "Descreva o sistema que quer criar..."
                    : "Descreva o que quer construir... (/ para comandos)"
            }
            disabled={isAnalyzing || isStreaming}
            rows={1}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "180px" }}
          />
          <div className="px-2 pb-2 pt-1">
            {isStreaming ? (
              <button
                onClick={stopStream}
                className="w-full h-10 rounded-lg text-xs font-mono bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Parar geração
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleAnalystRequest}
                  disabled={(!input.trim() && attachments.length === 0) || isAnalyzing}
                  className="flex-1 h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: BEIGE,
                    color: OLIVE_GREEN,
                    border: `1.5px solid ${OLIVE_GREEN}60`,
                    boxShadow: `0 2px 8px ${OLIVE_GREEN}20`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${OLIVE_GREEN}35`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px ${OLIVE_GREEN}20`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  <Search className="h-3.5 w-3.5" />
                  Solicitar Análise
                </button>
                <button
                  onClick={handleBuilderRequest}
                  disabled={(!input.trim() && attachments.length === 0) || isAnalyzing}
                  className="flex-1 h-11 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: OLIVE_GREEN,
                    color: BEIGE,
                    border: `1.5px solid ${OLIVE_GREEN}`,
                    boxShadow: `0 2px 8px ${OLIVE_GREEN}30`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 16px ${OLIVE_GREEN}50`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px ${OLIVE_GREEN}30`;
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  {vibeMode ? "Iniciar Vibe Coding" : "Construir"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
