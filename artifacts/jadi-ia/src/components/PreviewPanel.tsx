import { useRef, useState, useEffect } from "react";
import { Eye, Code2, RefreshCw, Globe, FileCode } from "lucide-react";

interface ProjectFile {
  name: string;
  content: string;
}

interface PreviewPanelProps {
  content: string;
  filename: string;
  projectFiles?: ProjectFile[];
}

function buildSrcDoc(filename: string, content: string, projectFiles: ProjectFile[]): string {
  if (!filename.endsWith(".html") && !filename.endsWith(".htm")) return "";

  let html = content;

  const cssFiles = projectFiles.filter((f) => f.name.endsWith(".css") && f.name !== filename);
  const jsFiles = projectFiles.filter(
    (f) => f.name.endsWith(".js") && !f.name.endsWith(".min.js") && f.name !== filename,
  );

  const cssBlock = cssFiles
    .map((f) => `<style>/* ${f.name} */\n${f.content}\n</style>`)
    .join("\n");

  const jsBlock = jsFiles
    .map((f) => `<script>/* ${f.name} */\n${f.content}\n</script>`)
    .join("\n");

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${cssBlock}\n</head>`);
  } else {
    html = cssBlock + "\n" + html;
  }

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${jsBlock}\n</body>`);
  } else {
    html = html + "\n" + jsBlock;
  }

  return html;
}

function getLanguageLabel(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "HTML",
    htm: "HTML",
    css: "CSS",
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "JSX",
    tsx: "TSX",
    py: "Python",
    json: "JSON",
    md: "Markdown",
    sql: "SQL",
  };
  return map[ext] ?? ext.toUpperCase();
}

export default function PreviewPanel({ content, filename, projectFiles = [] }: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<"preview" | "code">("preview");
  const [reloadKey, setReloadKey] = useState(0);

  const isHtml = filename.endsWith(".html") || filename.endsWith(".htm");

  useEffect(() => {
    if (isHtml && mode === "preview") {
      setReloadKey((k) => k + 1);
    }
  }, [content, projectFiles]);

  const srcDoc = isHtml ? buildSrcDoc(filename, content, projectFiles) : "";
  const langLabel = getLanguageLabel(filename);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div
        className="flex items-center justify-between px-3 h-8 border-b border-white/8 flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="flex items-center gap-2">
          {isHtml && mode === "preview" ? (
            <Globe className="h-3 w-3 text-teal-400" />
          ) : (
            <FileCode className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-[11px] text-muted-foreground font-mono">
            {isHtml && mode === "preview" ? "Preview ao vivo" : langLabel} · {filename}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isHtml && (
            <>
              <button
                onClick={() => setMode("preview")}
                className={`h-5 px-2 text-[10px] rounded-md font-mono transition-colors flex items-center gap-1 ${
                  mode === "preview"
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-2.5 w-2.5" />
                Preview
              </button>
              <button
                onClick={() => setMode("code")}
                className={`h-5 px-2 text-[10px] rounded-md font-mono transition-colors flex items-center gap-1 ${
                  mode === "code"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 className="h-2.5 w-2.5" />
                Código
              </button>
            </>
          )}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isHtml && mode === "preview" ? (
          srcDoc ? (
            <iframe
              key={reloadKey}
              ref={iframeRef}
              srcDoc={srcDoc}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms"
              title="Preview do projeto"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground font-mono">
              Sem conteúdo para exibir
            </div>
          )
        ) : (
          <pre className="p-3 text-[11px] font-mono leading-relaxed text-foreground/75 overflow-auto h-full whitespace-pre-wrap break-words">
            {content || <span className="text-muted-foreground/40 italic">Arquivo vazio</span>}
          </pre>
        )}
      </div>
    </div>
  );
}
