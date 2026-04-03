import { useState, useRef, useEffect, useCallback, DragEvent, ClipboardEvent, KeyboardEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  X,
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
  Globe,
  ImageIcon,
  Volume2,
  Package,
  Sparkles,
  Zap,
  Send,
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

interface AssetLogEntry {
  type: "image" | "font" | "sound";
  label: string;
  value: string;
  source?: string;
}

interface ResolvedAssets {
  fonts: {
    heading: string;
    body: string;
    googleFontsUrl: string;
    cssVars: string;
    mood: string;
  };
  images: Record<string, string[]>;
  sounds: Record<string, Array<{ name: string; url: string; preview: string }>>;
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
  centerContent?: ReactNode;
  prefillInput?: string;
  onPrefillConsumed?: () => void;
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
  "Processando requisitos...",
  "Avaliando arquitetura...",
  "Gerando diagnóstico técnico...",
  "Estruturando plano...",
  "Finalizando análise...",
];

const BUILDER_STATUS = [
  "Inicializando Vibe Coding...",
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

REGRAS OBRIGATÓRIAS DE CÓDIGO:
- Sempre crie um index.html como arquivo principal de entrada
- Cada arquivo deve ser completo, funcional e bem estruturado
- Não use placeholders — escreva o código real e funcional

PADRÕES OBRIGATÓRIOS DE TECNOLOGIA:
- ESTILIZAÇÃO: Use Tailwind CSS via CDN como padrão. Inclua SEMPRE no <head>: <script src="https://cdn.tailwindcss.com"></script>. Evite criar arquivos style.css com CSS puro extensivo — prefira classes utilitárias do Tailwind.
- ÍCONES: Use Lucide Icons via CDN como padrão. Inclua SEMPRE no <head>: <script src="https://unpkg.com/lucide@latest"></script> e ative com <script>lucide.createIcons();</script> no final do body. NUNCA use emojis no código — apenas ícones Lucide ou Iconify.
- DESIGN: Layouts responsivos com Tailwind (grid, flex, container). Cores escuras modernas como padrão (bg-slate-900, bg-gray-900). Acentos em teal/emerald/violet.

REGRAS OBRIGATÓRIAS DE ASSETS:
- TIPOGRAFIA: Se o contexto incluir [ASSETS] com googleFontsUrl, SEMPRE injete o link do Google Fonts no <head> do HTML e aplique as variáveis CSS --font-heading e --font-body no :root e em h1,h2,h3,body.
- IMAGENS: Se o contexto incluir [ASSETS] com URLs de imagens, use-as diretamente no código (como src de <img> ou background-image).
- SONS: Se o contexto incluir [ASSETS] com URLs de som (preview MP3), use <audio> elements com src apontando para as URLs fornecidas.
- Iconify CDN alternativo para ícones: <span class="iconify" data-icon="mdi:home"></span> com <script src="https://code.iconify.design/2/2.2.1/iconify.min.js"></script>
`;

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

function stripCodeFences(content: string): string {
  const trimmed = content.trim();
  const fullMatch = trimmed.match(/^```[\w]*\n([\s\S]*?)```\s*$/);
  if (fullMatch) return fullMatch[1];
  return trimmed
    .replace(/^```[\w]*\n?/, "")
    .replace(/\n?```\s*$/, "");
}

function AnalysisCodeBlock({ content, lang }: { content: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg overflow-hidden border border-green-200 bg-green-50 my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-green-100 border-b border-green-200">
        <span className="text-green-700 text-[10px] font-mono uppercase tracking-wider">{lang || "código"}</span>
        <button onClick={copy} className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors text-[10px] font-mono">
          {copied ? <><Check className="h-3 w-3" /><span>Copiado</span></> : <><Copy className="h-3 w-3" /><span>Copiar</span></>}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed text-[11px] text-green-900 font-mono">{content}</pre>
    </div>
  );
}

function VibeCodeBlock({ content, lang }: { content: string; lang: string }) {
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
        <button onClick={copy} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-mono">
          {copied ? <><Check className="h-3 w-3 text-teal-400" /><span className="text-teal-400">Copiado</span></> : <><Copy className="h-3 w-3" /><span>Copiar</span></>}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed text-[11px] text-foreground/90 font-mono">{content}</pre>
    </div>
  );
}

function VibeFilesProgress({ files }: { files: VibeFile[] }) {
  if (files.length === 0) return null;
  return (
    <div className="mx-2 mb-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,107,53,0.2)", background: "rgba(255,107,53,0.05)" }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "rgba(255,107,53,0.15)" }}>
        <FolderOpen className="h-3.5 w-3.5" style={{ color: "#FF6B35" }} />
        <span className="text-[11px] font-mono font-medium" style={{ color: "#FF6B35" }}>Motor de Arquivos</span>
      </div>
      <div className="p-2 space-y-1">
        {files.map((f) => (
          <div key={f.name} className="flex items-center gap-2 px-2 py-1 rounded-lg">
            {f.status === "done" ? (
              <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: "#00897B" }} />
            ) : f.status === "writing" ? (
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" style={{ color: "#FF6B35" }} />
            ) : (
              <div className="h-3 w-3 rounded-full border flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
            )}
            <span className="text-[10px] font-mono flex-1 truncate" style={{ color: f.status === "done" ? "#00897B" : f.status === "writing" ? "#FF6B35" : "rgba(255,255,255,0.3)" }}>
              {f.name}
            </span>
            {f.status === "done" && <span className="text-[9px] font-mono" style={{ color: "rgba(0,137,123,0.7)" }}>salvo</span>}
            {f.status === "writing" && <span className="text-[9px] font-mono animate-pulse" style={{ color: "rgba(255,107,53,0.7)" }}>escrevendo...</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetLogPanel({ entries }: { entries: AssetLogEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="mx-2 mb-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,0,204,0.15)", background: "rgba(255,0,204,0.04)" }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "rgba(255,0,204,0.12)" }}>
        <Package className="h-3.5 w-3.5" style={{ color: "#FF00CC" }} />
        <span className="text-[11px] font-mono font-medium" style={{ color: "#FF00CC" }}>Log de Ativos</span>
      </div>
      <div className="p-2 space-y-1 max-h-36 overflow-y-auto">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg">
            {entry.type === "image" && <ImageIcon className="h-3 w-3 text-blue-400 flex-shrink-0" />}
            {entry.type === "font" && <Globe className="h-3 w-3 flex-shrink-0" style={{ color: "#FF6B35" }} />}
            {entry.type === "sound" && <Volume2 className="h-3 w-3 flex-shrink-0" style={{ color: "#00897B" }} />}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono mr-1" style={{ color: "rgba(255,255,255,0.4)" }}>{entry.label}:</span>
              <span className="text-[10px] font-mono truncate block" style={{ color: "rgba(255,255,255,0.7)" }}>{entry.value}</span>
            </div>
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
  prefillInput,
  onPrefillConsumed,
  centerContent,
}: VibeChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [analyzeInput, setAnalyzeInput] = useState("");
  const [vibeInput, setVibeInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"analise" | "construcao">("construcao");
  const [statusText, setStatusText] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);
  const [showAnalyzeCommands, setShowAnalyzeCommands] = useState(false);
  const [showVibeCommands, setShowVibeCommands] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [vibeFiles, setVibeFiles] = useState<VibeFile[]>([]);
  const [providerSwitchMsg, setProviderSwitchMsg] = useState("");
  const [analysisContext, setAnalysisContext] = useState<string>("");
  const [assetLog, setAssetLog] = useState<AssetLogEntry[]>([]);
  const [isFetchingAssets, setIsFetchingAssets] = useState(false);

  const analyzeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const vibeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const analyzeScrollRef = useRef<HTMLDivElement>(null);
  const vibeScrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastParentMessagesRef = useRef<ChatMessage[]>(initialMessages);
  const processedFilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (prefillInput && prefillInput.trim()) {
      setAnalyzeInput(prefillInput);
      setVibeInput(prefillInput);
      onPrefillConsumed?.();
    }
  }, [prefillInput]);

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
    if (analyzeScrollRef.current) {
      analyzeScrollRef.current.scrollTop = analyzeScrollRef.current.scrollHeight;
    }
    if (vibeScrollRef.current) {
      vibeScrollRef.current.scrollTop = vibeScrollRef.current.scrollHeight;
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
    return () => { if (statusTimerRef.current) clearInterval(statusTimerRef.current); };
  }, [isStreaming, activeAgent]);

  useEffect(() => {
    const statusList = activeAgent === "analise" ? ANALYST_STATUS : BUILDER_STATUS;
    if (isStreaming) setStatusText(statusList[statusIndex]);
  }, [statusIndex, isStreaming, activeAgent]);

  const autoResizeAnalyze = () => {
    const ta = analyzeTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const autoResizeVibe = () => {
    const ta = vibeTextareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const addAttachment = useCallback((att: Omit<Attachment, "id">) => {
    setAttachments((prev) => [...prev, { ...att, id: Math.random().toString(36).slice(2) }]);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((i) => i.type.startsWith("image/"));
    if (imageItem) {
      e.preventDefault();
      const blob = imageItem.getAsFile();
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = (ev) => addAttachment({ type: "image", preview: ev.target?.result as string, content: ev.target?.result as string });
      reader.readAsDataURL(blob);
      return;
    }
    const text = e.clipboardData.getData("text");
    if (text.length > 600) {
      e.preventDefault();
      addAttachment({ type: "snippet", preview: text.slice(0, 60) + "…", content: text });
    }
  }, [addAttachment]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => addAttachment({ type: "image", preview: ev.target?.result as string, content: ev.target?.result as string });
        reader.readAsDataURL(file);
      }
    });
  }, [addAttachment]);

  const buildUserContent = (inputText: string): string | Array<unknown> => {
    const imageAttachments = attachments.filter((a) => a.type === "image");
    const snippetAttachments = attachments.filter((a) => a.type === "snippet");
    const textParts = [inputText.trim()];
    snippetAttachments.forEach((s, i) => { textParts.push(`\n\n[Documento ${i + 1}]:\n${s.content}`); });
    const fullText = textParts.join("");
    if (imageAttachments.length === 0) return fullText;
    return [{ type: "text", text: fullText }, ...imageAttachments.map((a) => ({ type: "image_url", image_url: { url: a.content } }))];
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
        onFileWrite(filename, stripCodeFences(content));
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
    const inProgressRegex = /===FILE: ([^\n=]+)===\n((?!===END_FILE===)[\s\S]*)$/;
    const inProgressMatch = inProgressRegex.exec(text);
    if (inProgressMatch) {
      const name = inProgressMatch[1].trim();
      setVibeFiles((prev) => {
        if (prev.some((f) => f.name === name)) {
          return prev.map((f) => f.name === name && f.status !== "done" ? { ...f, status: "writing" } : f);
        }
        return [...prev, { name, status: "writing" }];
      });
    }
  }

  async function fetchAssets(userText: string, resolvedAssets: ResolvedAssets) {
    const keywords = userText.toLowerCase();
    const needsImages = /imagem|foto|background|hero|banner|ilustra|picture|photo/i.test(keywords);
    const newLog: AssetLogEntry[] = [];
    if (resolvedAssets.fonts?.googleFontsUrl) {
      newLog.push({ type: "font", label: "Fonte", value: `${resolvedAssets.fonts.heading} + ${resolvedAssets.fonts.body}`, source: "Google Fonts" });
    }
    if (needsImages) {
      const categories = Object.keys(resolvedAssets.images ?? {});
      for (const cat of categories) {
        const urls = resolvedAssets.images[cat] ?? [];
        urls.slice(0, 3).forEach((url) => {
          newLog.push({ type: "image", label: cat, value: url.split("/").pop() ?? url, source: "Unsplash" });
        });
      }
    }
    setAssetLog(newLog);
  }

  async function streamFromAPI(
    inputText: string,
    isAnalysisMode: boolean,
    customSystemPrompt?: string,
  ) {
    if ((!inputText.trim() && attachments.length === 0) || isAnalyzing) return;
    const agentType = isAnalysisMode ? "analise" : "construcao";
    setActiveAgent(agentType);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    processedFilesRef.current = new Set();

    const userContent = buildUserContent(inputText);
    const userMsg: ChatMessage = {
      role: "user",
      content: typeof userContent === "string" ? userContent : (userContent[0] as { text: string }).text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const updatedMessages = [...messages, userMsg];
    const assistantMsg: ChatMessage = { role: "assistant", content: "", agentType, isStreaming: true };
    setMessages([...updatedMessages, assistantMsg]);
    setIsStreaming(true);
    if (isAnalysisMode) setAnalyzeInput(""); else setVibeInput("");
    setAttachments([]);
    setVibeFiles([]);
    setAssetLog([]);

    let resolvedAssets: ResolvedAssets | null = null;
    let assetsContext = "";

    const authToken = localStorage.getItem("token");
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    if (!isAnalysisMode && vibeMode) {
      setIsFetchingAssets(true);
      try {
        const assetsRes = await fetch("/api/ai/resolve-assets", {
          method: "POST",
          headers: authHeaders,
          signal: abortRef.current.signal,
          body: JSON.stringify({ projectDescription: inputText }),
        });
        if (assetsRes.ok) {
          resolvedAssets = await assetsRes.json() as ResolvedAssets;
          if (resolvedAssets) {
            await fetchAssets(inputText, resolvedAssets);
            const fontsCtx = resolvedAssets.fonts?.googleFontsUrl
              ? `[ASSETS]\nTipografia: heading=${resolvedAssets.fonts.heading}, body=${resolvedAssets.fonts.body}\nGoogle Fonts URL: ${resolvedAssets.fonts.googleFontsUrl}\nCSS vars: ${resolvedAssets.fonts.cssVars}\n`
              : "";
            const imgUrls = Object.values(resolvedAssets.images ?? {}).flat().slice(0, 6);
            const imgsCtx = imgUrls.length > 0 ? `Imagens disponíveis:\n${imgUrls.join("\n")}\n` : "";
            const soundUrls = Object.values(resolvedAssets.sounds ?? {}).flat().map((s) => s.preview).slice(0, 4);
            const soundsCtx = soundUrls.length > 0 ? `Sons disponíveis (MP3 preview):\n${soundUrls.join("\n")}\n` : "";
            assetsContext = fontsCtx + imgsCtx + soundsCtx;
          }
        }
      } catch { /* silent */ }
      setIsFetchingAssets(false);
    }

    const systemExtra = isAnalysisMode
      ? (analysisContext ? `\n[CONTEXTO DE ANÁLISE ANTERIOR]\n${analysisContext}\n` : "")
      : (vibeMode ? VIBE_SYSTEM_PROMPT : "") + (customSystemPrompt ?? "") + (analysisContext ? `\n[PLANO DE ANÁLISE]\n${analysisContext}\n` : "") + (assetsContext ? `\n${assetsContext}` : "");

    const hasImages = attachments.some((a) => a.type === "image");
    const model = hasImages ? "meta-llama/llama-4-scout-17b-16e-instruct" : undefined;

    const messagesForAPI = updatedMessages.map((m) => ({
      role: m.role,
      content: m.role === "user" && m.attachments?.some((a) => a.type === "image")
        ? [{ type: "text", text: m.content }, ...m.attachments.filter((a) => a.type === "image").map((a) => ({ type: "image_url", image_url: { url: a.content } }))]
        : m.content,
    }));
    if (typeof userContent !== "string") {
      messagesForAPI[messagesForAPI.length - 1].content = userContent;
    }

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: authHeaders,
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: messagesForAPI,
          systemPrompt: systemExtra,
          taskType: agentType,
          language,
          projectContext: projectName,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let sseBuffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (!data) continue;
            try {
              const parsed = JSON.parse(data) as Record<string, unknown>;

              if (currentEvent === "token" || parsed.token !== undefined) {
                const token = (parsed.token as string) ?? "";
                accumulated += token;
                const displayContent = vibeMode ? stripVibeMarkers(accumulated) : accumulated;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: displayContent };
                  return copy;
                });
                if (!isAnalysisMode) {
                  processVibeStream(accumulated);
                  const codeBlocks = extractAllCodeBlocks(accumulated);
                  if (codeBlocks.length > 0) {
                    const lastBlock = codeBlocks[codeBlocks.length - 1];
                    onLiveCodeUpdate(lastBlock.code, lastBlock.lang);
                  }
                }
              } else if (currentEvent === "provider_switch") {
                const msg = (parsed.message as string) ?? "Alternando provedor...";
                setProviderSwitchMsg(`Fallback: ${msg}`);
              } else if (currentEvent === "error") {
                const msg = (parsed.message as string) ?? "Erro ao processar resposta.";
                throw new Error(msg);
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
          if (line === "") currentEvent = "";
        }
      }

      if (isAnalysisMode) {
        setAnalysisContext((prev) => prev ? `${prev}\n\n${accumulated}` : accumulated);
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.isStreaming) {
          const displayContent = vibeMode ? stripVibeMarkers(accumulated) : accumulated;
          copy[copy.length - 1] = { ...last, content: displayContent, isStreaming: false };
        }
        return copy;
      });
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.isStreaming) copy[copy.length - 1] = { ...last, content: "Erro ao conectar com a IA. Tente novamente.", isStreaming: false };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleAnalystRequest() {
    if (stackDecision?.systemPrompt) {
      streamFromAPI(analyzeInput, true, stackDecision.systemPrompt);
    } else {
      streamFromAPI(analyzeInput, true);
    }
  }

  function handleBuilderRequest() {
    if (stackDecision?.systemPrompt) {
      streamFromAPI(vibeInput, false, stackDecision.systemPrompt);
    } else {
      streamFromAPI(vibeInput, false);
    }
  }

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

  const analysisMessages = messages.filter((m) => m.role === "user" || m.agentType === "analise" || m.isDecision);
  const vibeMessages = messages.filter((m) => m.role === "user" || m.agentType === "construcao");

  const resizeHandleInner = "w-[4px] bg-border/30 hover:bg-white/40 data-[resize-handle-active=pointer]:bg-white/60 transition-colors cursor-col-resize flex-shrink-0 z-10";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative h-full w-full overflow-hidden"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none">
          <div className="text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-primary font-medium">Solte a imagem aqui</p>
          </div>
        </div>
      )}

      <PanelGroup direction="horizontal" autoSaveId="jadi-vibe-panels" className="h-full">
      <Panel id="analysis" order={1} defaultSize={25} minSize={12} maxSize={50}>
      <div className="h-full flex flex-col overflow-hidden border-r" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        {/* Header Analysis */}
        <div className="flex-shrink-0 px-3 py-2.5" style={{ background: "linear-gradient(135deg, #052e16 0%, #064e3b 100%)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <Search className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Análise</p>
                <p className="text-emerald-300 text-[9px] font-mono leading-none mt-0.5 tracking-wider">AQUI VOCÊ PROJETA</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isAutoMode && hasAnalyzed && (
                <button onClick={onReanalyze} title="Re-analisar" className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white transition-colors">
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
              <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded text-white/60 hover:text-white transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {isAutoMode && stackDecision && (
            <p className="text-emerald-200/70 text-[9px] font-mono truncate">
              Stack: {stackDecision.framework} · {stackDecision.language}
            </p>
          )}
        </div>

        {/* Analysis Messages */}
        <div ref={analyzeScrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scroll-smooth">
          {analysisMessages.length === 0 && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-2 py-8 text-center">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "rgba(5,46,22,0.08)", border: "1px solid #86efac" }}>
                <Sparkles className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-green-800 text-xs font-semibold mb-1">Planeje seu projeto</p>
                <p className="text-green-600 text-[11px] leading-relaxed">Descreva o que quer criar e o Analista escolhe a melhor arquitetura e stack tecnológica.</p>
              </div>
              <div className="w-full space-y-1 mt-2">
                {QUICK_COMMANDS.slice(0, 4).map((c) => (
                  <button key={c.cmd} onClick={() => { setAnalyzeInput(c.cmd + " "); analyzeTextareaRef.current?.focus(); }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono border transition-all text-left"
                    style={{ border: "1px solid #bbf7d0", background: "rgba(5,46,22,0.04)", color: "#166534" }}>
                    <span className="font-semibold min-w-[56px]">{c.cmd}</span>
                    <span className="text-green-500/80 truncate">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isAnalyzing && analysisMessages.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(5,46,22,0.1)", border: "1px solid #86efac" }}>
                <Loader2 className="h-5 w-5 text-green-700 animate-spin" />
              </div>
              <p className="text-green-700 text-xs text-center">Analisando stack tecnológica...</p>
            </div>
          )}

          {analysisMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "rounded-tr-sm text-white"
                  : "rounded-tl-sm border"
              }`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, #16a34a 0%, #052e16 100%)" }
                  : { background: "white", border: "1px solid #bbf7d0", color: "#052e16" }
                }
              >
                {msg.role === "assistant" ? (
                  <div>
                    {formatMessage(msg.content).parts.map((part, pi) =>
                      part.type === "code"
                        ? <AnalysisCodeBlock key={pi} content={part.content} lang={part.lang || ""} />
                        : <span key={pi} className="whitespace-pre-wrap">{part.content}</span>
                    )}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse rounded-sm align-middle bg-green-600" />
                    )}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {isStreaming && activeAgent === "analise" && statusText && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-green-600" style={{ animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <span className="text-[10px] font-mono text-green-700">{statusText}</span>
            </div>
          )}
        </div>

        {/* Analysis Input */}
        <div className="p-2 flex-shrink-0 border-t" style={{ borderColor: "#bbf7d0", background: "white" }}>
          {showAnalyzeCommands && (
            <div className="mb-1.5 rounded-xl border overflow-hidden" style={{ borderColor: "#bbf7d0", background: "white" }}>
              {QUICK_COMMANDS.filter((c) => c.cmd.startsWith(analyzeInput.toLowerCase())).map((c) => (
                <button key={c.cmd} onClick={() => { setAnalyzeInput(c.cmd + " "); setShowAnalyzeCommands(false); analyzeTextareaRef.current?.focus(); }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-green-50 transition-colors border-b last:border-0" style={{ borderColor: "#bbf7d0" }}>
                  <span className="text-[10px] font-mono text-green-700 font-semibold">{c.cmd}</span>
                  <span className="text-[10px] text-green-500">{c.desc}</span>
                </button>
              ))}
            </div>
          )}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#86efac", background: "#f0fdf4" }}>
            <textarea
              ref={analyzeTextareaRef}
              value={analyzeInput}
              onChange={(e) => {
                setAnalyzeInput(e.target.value);
                autoResizeAnalyze();
                setShowAnalyzeCommands(e.target.value.startsWith("/") && e.target.value.length <= 20);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAnalystRequest(); }
                if (e.key === "Escape") setShowAnalyzeCommands(false);
              }}
              onPaste={handlePaste}
              placeholder={isAnalyzing ? "Aguarde..." : isStreaming && activeAgent === "analise" ? "Aguarde a resposta..." : "Descreva o que quer projetar..."}
              disabled={isAnalyzing || (isStreaming && activeAgent === "analise")}
              rows={1}
              className="w-full bg-transparent px-3 pt-2 pb-1 text-[11px] font-mono resize-none outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: "100px", color: "#052e16" }}
            />
            <div className="px-2 pb-2">
              {isStreaming && activeAgent === "analise" ? (
                <button onClick={stopStream}
                  className="w-full h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border"
                  style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                  <X className="h-3 w-3" /> Parar
                </button>
              ) : (
                <button onClick={handleAnalystRequest}
                  disabled={!analyzeInput.trim() || isAnalyzing}
                  className="w-full h-8 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #052e16 0%, #064e3b 100%)", color: "white" }}>
                  <Search className="h-3 w-3" />
                  Solicitar Análise
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </Panel>

      <PanelResizeHandle className={resizeHandleInner} />

      {/* ── PREVIEW SLOT — entre Análise e Vibe ── */}
      {centerContent && (
        <Panel id="preview-center" order={2} defaultSize={30} minSize={15}>
          {centerContent}
        </Panel>
      )}
      {centerContent && <PanelResizeHandle className={resizeHandleInner} />}

      {/* ═══════════════════════════════ VIBE PANEL (HOME GRADIENT) ═══════════════════════════════ */}
      <Panel id="vibe" order={3} minSize={20}>
      <div className="h-full flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg, #011a12 0%, #150700 50%, #140016 100%)" }}>
        {/* Header Vibe */}
        <div className="flex-shrink-0 px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,107,53,0.15)", background: "linear-gradient(135deg, #00897B 0%, #FF6B35 55%, #FF00CC 100%)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}>
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-white text-xs font-black leading-none tracking-tight drop-shadow">Vibe Coding</p>
                <p className="text-[9px] font-mono leading-none mt-0.5 tracking-widest text-white/70">AQUI VOCÊ REALIZA</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {vibeMode && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border" style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.9)", borderColor: "rgba(255,255,255,0.25)" }}>
                  multi-arquivo
                </span>
              )}
              <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border" style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.2)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse inline-block" />
                ao vivo
              </span>
            </div>
          </div>
        </div>

        {/* Vibe Messages */}
        <div ref={vibeScrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scroll-smooth">
          {vibeMessages.length === 0 && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-2 py-8 text-center">
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00897B22 0%, #FF00CC18 100%)", border: "1px solid rgba(255,107,53,0.3)" }}>
                <Zap className="h-5 w-5" style={{ color: "#FF6B35" }} />
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ background: "linear-gradient(135deg, #00897B 0%, #FF6B35 50%, #FF00CC 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Pronto para criar
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>Use a análise do painel ao lado ou descreva diretamente o que quer construir.</p>
              </div>
              <div className="w-full space-y-1 mt-2">
                {QUICK_COMMANDS.map((c) => (
                  <button key={c.cmd} onClick={() => { setVibeInput(c.cmd + " "); vibeTextareaRef.current?.focus(); }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all text-left"
                    style={{ border: "1px solid rgba(255,107,53,0.12)", background: "rgba(255,107,53,0.04)", color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,107,53,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,107,53,0.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = "1px solid rgba(255,107,53,0.12)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,107,53,0.04)"; }}
                  >
                    <span className="font-semibold min-w-[56px]" style={{ color: "#FF6B35" }}>{c.cmd}</span>
                    <span className="truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {vibeMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
              }`}
                style={msg.role === "user"
                  ? { background: "linear-gradient(135deg, #00897B 0%, #FF6B35 55%, #FF00CC 100%)", color: "white" }
                  : msg.isDecision
                    ? { background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", color: "rgba(255,255,255,0.85)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                }
              >
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/10">
                        {att.type === "image" ? (
                          <><Image className="h-3 w-3 text-blue-400" /><img src={att.preview} alt="" className="h-6 w-6 rounded object-cover" /></>
                        ) : (
                          <><FileText className="h-3 w-3 text-yellow-400" /><span className="text-[10px] text-muted-foreground font-mono">{att.preview}</span></>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" ? (
                  <div>
                    {formatMessage(msg.content).parts.map((part, pi) =>
                      part.type === "code"
                        ? <VibeCodeBlock key={pi} content={part.content} lang={part.lang || ""} />
                        : <span key={pi} className="whitespace-pre-wrap">{part.content}</span>
                    )}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 ml-0.5 animate-pulse rounded-sm align-middle" style={{ background: "#FF6B35" }} />
                    )}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {isStreaming && activeAgent === "construcao" && statusText && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: j === 0 ? "#00897B" : j === 1 ? "#FF6B35" : "#FF00CC", animation: `pulse 1.2s ${j * 0.2}s infinite` }} />
                ))}
              </div>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{statusText}</span>
            </div>
          )}
        </div>

        <VibeFilesProgress files={vibeFiles} />

        {isFetchingAssets && (
          <div className="mx-2 mb-2 px-3 py-2 rounded-xl flex items-center gap-2" style={{ border: "1px solid rgba(255,107,53,0.2)", background: "rgba(255,107,53,0.07)" }}>
            <Loader2 className="h-3 w-3 animate-spin" style={{ color: "#FF6B35" }} />
            <span className="text-[10px] font-mono" style={{ color: "#FF6B35" }}>Buscando assets...</span>
          </div>
        )}

        <AssetLogPanel entries={assetLog} />

        {providerSwitchMsg && !isStreaming && (
          <div className="px-3 py-1.5 flex-shrink-0">
            <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              {providerSwitchMsg}
            </div>
          </div>
        )}

        {/* Vibe Input */}
        <div className="p-2 flex-shrink-0 border-t" style={{ borderColor: "rgba(255,107,53,0.15)" }}>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {attachments.map((att) => (
                <div key={att.id} className="relative flex items-center gap-1.5 rounded-lg px-2 py-1 group" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {att.type === "image" ? (
                    <><Image className="h-3 w-3 text-blue-400 flex-shrink-0" /><img src={att.preview} alt="" className="h-5 w-5 rounded object-cover" /><span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>imagem</span></>
                  ) : (
                    <><FileText className="h-3 w-3 text-yellow-400 flex-shrink-0" /><span className="text-[10px] font-mono max-w-[100px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{att.preview}</span></>
                  )}
                  <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="opacity-0 group-hover:opacity-100 transition-all ml-1" style={{ color: "rgba(255,100,100,0.7)" }}>
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showVibeCommands && (
            <div className="mb-1.5 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,107,53,0.2)", background: "linear-gradient(160deg, #011a12 0%, #150700 80%, #140016 100%)" }}>
              {QUICK_COMMANDS.filter((c) => c.cmd.startsWith(vibeInput.toLowerCase())).map((c) => (
                <button key={c.cmd} onClick={() => { setVibeInput(c.cmd + " "); setShowVibeCommands(false); vibeTextareaRef.current?.focus(); }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors border-b last:border-0" style={{ borderColor: "rgba(255,107,53,0.1)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,107,53,0.08)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <span className="text-[10px] font-mono" style={{ color: "#FF6B35" }}>{c.cmd}</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{c.desc}</span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,107,53,0.2)", background: "rgba(255,255,255,0.04)" }}>
            <textarea
              ref={vibeTextareaRef}
              value={vibeInput}
              onChange={(e) => {
                setVibeInput(e.target.value);
                autoResizeVibe();
                setShowVibeCommands(e.target.value.startsWith("/") && e.target.value.length <= 20);
              }}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleBuilderRequest(); }
                if (e.key === "Escape") setShowVibeCommands(false);
              }}
              onPaste={handlePaste}
              placeholder={isStreaming && activeAgent === "construcao" ? "Aguarde a resposta..." : vibeMode ? "Descreva o sistema que quer criar..." : "Descreva o que quer construir... (/ para comandos)"}
              disabled={isStreaming && activeAgent === "construcao"}
              rows={1}
              className="w-full bg-transparent px-3 pt-2.5 pb-1 text-[11px] font-mono resize-none outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: "120px", color: "rgba(255,255,255,0.85)" }}
            />
            <div className="px-2 pb-2 pt-1">
              {isStreaming && activeAgent === "construcao" ? (
                <button onClick={stopStream}
                  className="w-full h-9 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  style={{ border: "1px solid rgba(255,100,100,0.3)", background: "rgba(255,100,100,0.1)", color: "rgba(255,120,120,0.9)" }}>
                  <X className="h-3 w-3" /> Parar geração
                </button>
              ) : (
                <button onClick={handleBuilderRequest}
                  disabled={!vibeInput.trim() || (isStreaming && activeAgent === "analise")}
                  className="w-full h-9 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #00897B 0%, #FF6B35 55%, #FF00CC 100%)", color: "white", boxShadow: "0 2px 14px rgba(255,107,53,0.3)" }}>
                  <Zap className="h-3.5 w-3.5" />
                  {vibeMode ? "Iniciar Vibe Coding" : "Construir"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      </Panel>
      </PanelGroup>
    </motion.div>
  );
}
