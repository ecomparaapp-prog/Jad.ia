import { useState, useRef, useEffect, useCallback, DragEvent, ClipboardEvent, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  RefreshCw,
  Image,
  FileText,
  Trash2,
  Zap,
  Copy,
  Check,
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
}

interface StackDecision {
  language: string;
  framework: string;
  projectType: string;
  justification: string;
  systemPrompt: string;
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
}

const QUICK_COMMANDS = [
  { cmd: "/setup", desc: "Configura estrutura base do projeto" },
  { cmd: "/fix", desc: "Corrige bugs no código atual" },
  { cmd: "/style", desc: "Melhora o estilo visual" },
  { cmd: "/explain", desc: "Explica o que o código faz" },
  { cmd: "/test", desc: "Escreve testes para o código" },
  { cmd: "/refactor", desc: "Refatora e melhora o código" },
];

const STATUS_MESSAGES = [
  "Jadi.ia está analisando sua ideia...",
  "Arquitetando os componentes...",
  "Escrevendo o código...",
  "Aplicando estrutura...",
  "Finalizando...",
];

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

function CodeBlock({ content, lang }: { content: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 my-2 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/10">
        <span className="text-muted-foreground text-[10px]">{lang || "code"}</span>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed text-[11px] text-foreground/90">{content}</pre>
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
}: VibeChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      setStatusIndex(0);
      statusTimerRef.current = setInterval(() => {
        setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
      }, 2500);
    } else {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      setStatusText("");
    }
    return () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) setStatusText(STATUS_MESSAGES[statusIndex]);
  }, [statusIndex, isStreaming]);

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
        addAttachment({
          type: "snippet",
          preview: text.slice(0, 60) + "…",
          content: text,
        });
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
      handleSend();
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isStreaming) return;

    const userContent = buildUserContent();
    const userMsg: ChatMessage = {
      role: "user",
      content: typeof userContent === "string" ? userContent : trimmed || "[imagem anexada]",
      attachments: [...attachments],
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
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
        content: m.role === "user" && m.attachments?.some((a) => a.type === "image")
          ? userContent
          : m.content,
      }));

    const effectiveLanguage =
      language === "auto"
        ? stackDecision
          ? `${stackDecision.framework} (${stackDecision.language})`
          : "auto"
        : language;

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
          systemPrompt: stackDecision?.systemPrompt ?? null,
        }),
        signal: ctrl.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream não disponível");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let lastCodeBlockCount = 0;

      const flush = () => {
        const blocks = extractAllCodeBlocks(accumulated);
        if (blocks.length > lastCodeBlockCount && blocks.length > 0) {
          lastCodeBlockCount = blocks.length;
          const last = blocks[blocks.length - 1];
          onLiveCodeUpdate(last.code, last.lang);
        }
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.isStreaming) {
            copy[copy.length - 1] = { ...last, content: accumulated };
          }
          return copy;
        });
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
            const evt = JSON.parse(payload) as { token?: string };
            if (evt.token) {
              accumulated += evt.token;
              flush();
            }
          } catch {
            if (payload === "done" || payload === '{}') break;
          }
        }
      }

      const finalBlocks = extractAllCodeBlocks(accumulated);
      if (finalBlocks.length > 0) {
        const last = finalBlocks[finalBlocks.length - 1];
        onLiveCodeUpdate(last.code, last.lang);
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.isStreaming) {
          copy[copy.length - 1] = { ...last, content: accumulated, isStreaming: false };
        }
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

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.isStreaming) {
        copy[copy.length - 1] = { ...last, isStreaming: false };
      }
      return copy;
    });
  };

  const isAutoMode = language === "auto";

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 360, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden"
      style={{
        background: "rgba(10, 10, 20, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
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
        className="flex-shrink-0 border-b border-white/10 px-4 py-3"
        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(10,10,20,0) 80%)" }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
              <Zap className="h-4.5 w-4.5 text-primary" style={{ height: "1.1rem", width: "1.1rem" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground leading-none">Vibe Coding</span>
                <span className="flex items-center gap-1 text-[10px] font-mono bg-green-500/15 text-green-400 border border-green-500/25 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  ao vivo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                {isAutoMode && stackDecision
                  ? `Stack: ${stackDecision.framework} · ${stackDecision.language}`
                  : "Descreva, a IA constrói em tempo real"}
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
          <div className="flex flex-col items-center justify-center h-full gap-5 px-2 py-8 text-center">
            <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-4 text-left"
              style={{ boxShadow: "0 0 20px rgba(139,92,246,0.08) inset" }}
            >
              <p className="text-[11px] font-mono text-primary/80 mb-2 flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                Como usar
              </p>
              <p className="text-xs text-foreground/70 leading-relaxed">
                Digite sua ideia na <span className="text-foreground font-medium">caixa abaixo</span> e pressione{" "}
                <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 border border-white/20 font-mono">Enter</kbd>.
                O código vai aparecendo no editor enquanto a IA escreve.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-yellow-400" /> cole textos longos → vira snippet
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Image className="h-3 w-3 text-blue-400" /> cole imagens → visão IA
                </span>
              </div>
            </div>

            <div className="w-full space-y-1">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider text-left mb-2">
                Comandos rápidos
              </p>
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
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background border border-primary/40 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-mono text-foreground/70 mb-1">Agente Analista</p>
              <p className="text-xs text-muted-foreground">Selecionando a melhor stack tecnológica...</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} gap-2`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : msg.isDecision
                    ? "bg-primary/10 border border-primary/20 text-foreground rounded-tl-sm"
                    : "bg-white/8 border border-white/10 text-foreground/90 rounded-tl-sm"
              }`}
              style={msg.role === "assistant" && !msg.isDecision ? { background: "rgba(255,255,255,0.05)" } : {}}
            >
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {msg.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/10">
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
                      <span key={pi} className="whitespace-pre-wrap font-sans">{part.content}</span>
                    ),
                  )}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {isStreaming && statusText && (
        <div className="px-3 py-1.5 flex-shrink-0 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1 w-1 rounded-full bg-primary/70"
                  style={{ animation: `pulse 1.2s ${i * 0.2}s infinite` }}
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
                  : "Descreva o que quer construir... (/ para comandos)"
            }
            disabled={isAnalyzing || isStreaming}
            rows={1}
            className="w-full bg-transparent px-3 pt-2.5 pb-1 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ maxHeight: "180px" }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono">
              <span>Enter ↵ envia</span>
              <span className="mx-1">·</span>
              <span>Shift+Enter quebra linha</span>
            </div>
            {isStreaming ? (
              <button
                onClick={stopStream}
                className="h-7 px-3 rounded-lg text-xs font-mono bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30 transition-colors flex items-center gap-1.5"
              >
                <X className="h-3 w-3" />
                Parar
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isAnalyzing}
                className="h-7 px-3 rounded-lg text-xs font-mono bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send className="h-3 w-3" />
                Enviar
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
