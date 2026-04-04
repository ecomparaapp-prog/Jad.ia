import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CONSOLE_CAPTURE_SCRIPT = `<script>
(function(){
  var _push = function(level, args) {
    try {
      var msg = Array.from(args).map(function(a){
        if(a instanceof Error) return a.message + (a.stack ? '\\n' + a.stack : '');
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch(e){ return String(a); }
      }).join(' ');
      window.parent.postMessage({type:'__jadia_console',level:level,message:msg},'*');
    } catch(e){}
  };
  var origError = console.error.bind(console);
  var origWarn = console.warn.bind(console);
  var origLog = console.log.bind(console);
  console.error = function(){ _push('error', arguments); origError.apply(console, arguments); };
  console.warn = function(){ _push('warn', arguments); origWarn.apply(console, arguments); };
  console.log = function(){ _push('log', arguments); origLog.apply(console, arguments); };
  window.addEventListener('error', function(e){
    _push('error', [e.message + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function(e){
    _push('error', ['Unhandled Promise: ' + (e.reason?.message || String(e.reason))]);
  });
})();
<\/script>`;

type ProjectFile = { name: string; content: string; language: string };

const CONFIG_FILES = new Set([
  "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
  "tsconfig.json", "tsconfig.node.json", "tsconfig.app.json",
  "next.config.js", "next.config.mjs", "next.config.ts",
  "vite.config.js", "vite.config.ts",
  "tailwind.config.js", "tailwind.config.ts",
  "postcss.config.js", "postcss.config.mjs",
  ".eslintrc", ".eslintrc.js", ".eslintrc.json",
  ".prettierrc", ".gitignore", ".env", ".env.local",
  "README.md", "readme.md",
]);

function detectFramework(files: ProjectFile[]): string | null {
  const names = files.map((f) => f.name);
  const pkgFile = files.find((f) => f.name === "package.json");
  const pkgContent = pkgFile?.content ?? "";

  if (names.some((n) => n.startsWith("next.config")) || pkgContent.includes('"next"')) return "Next.js";
  if (pkgContent.includes('"nuxt"')) return "Nuxt.js";
  if (pkgContent.includes('"@vue/core"') || pkgContent.includes('"vue"')) return "Vue.js";
  if (pkgContent.includes('"@angular/core"')) return "Angular";
  if (pkgContent.includes('"svelte"')) return "Svelte";
  if (names.some((n) => n.startsWith("vite.config")) || pkgContent.includes('"vite"')) {
    if (pkgContent.includes('"react"') || files.some((f) => f.name.endsWith(".tsx") || f.name.endsWith(".jsx"))) {
      return "React + Vite";
    }
    return "Vite";
  }
  if (files.some((f) => f.name.endsWith(".tsx") || f.name.endsWith(".jsx"))) return "React";
  if (files.some((f) => f.name.endsWith(".ts") && !f.name.endsWith(".d.ts") && f.content.includes("import"))) {
    if (pkgContent.includes('"react"') || files.some((f) => f.content.includes("from 'react'") || f.content.includes('from "react"'))) {
      return "React";
    }
  }
  return null;
}

function frameworkPreviewHtml(framework: string, files: ProjectFile[]): string {
  const fileList = files
    .map((f) => {
      const ext = f.name.split(".").pop() ?? "";
      const colorMap: Record<string, string> = {
        ts: "#60a5fa", tsx: "#38bdf8", js: "#facc15", jsx: "#fb923c",
        css: "#a78bfa", html: "#f87171", json: "#86efac", md: "#94a3b8",
      };
      const color = colorMap[ext] ?? "#94a3b8";
      const icon = ext === "tsx" || ext === "jsx" ? "⚛" : ext === "ts" || ext === "js" ? "📄" : ext === "css" ? "🎨" : ext === "html" ? "🌐" : "📁";
      return `<div class="file-row"><span class="file-icon">${icon}</span><span class="file-name" style="color:${color}">${f.name}</span><span class="file-lines">${f.content.split("\n").length} linhas</span></div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Preview — ${framework}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080810;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      width: 100%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(20,184,166,0.12);
      border: 1px solid rgba(20,184,166,0.3);
      color: #2dd4bf;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 16px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge::before { content: '⚙'; font-size: 12px; }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .tip {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
      color: #a5b4fc;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .tip strong { color: #c7d2fe; }
    .files-header {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }
    .files-list {
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      overflow: hidden;
      max-height: 220px;
      overflow-y: auto;
    }
    .file-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    .file-row:last-child { border-bottom: none; }
    .file-icon { font-size: 11px; }
    .file-name { flex: 1; }
    .file-lines { color: #475569; font-size: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${framework}</div>
    <h2>Compilação necessária</h2>
    <p>Este projeto usa <strong>${framework}</strong>, que precisa ser compilado antes de rodar. O preview ao vivo funciona com projetos HTML/CSS/JS puros.</p>
    <div class="tip">
      💡 <strong>Dica:</strong> Para ver o resultado visual, peça ao Vibe Coding para gerar uma versão em <strong>HTML + Tailwind CSS (CDN)</strong> — ela roda direto no preview sem precisar de compilação.
    </div>
    <div class="files-header">Arquivos do projeto (${files.length})</div>
    <div class="files-list">${fileList}</div>
  </div>
</body>
</html>`;
}

function sniffFileType(file: ProjectFile): "html" | "css" | "js" | "other" {
  const c = file.content.trim();
  if (c.startsWith("<!DOCTYPE") || c.startsWith("<html") || c.includes("<body") || c.includes("<head>")) return "html";
  if (c.startsWith("/*") || c.startsWith("@media") || c.startsWith("@charset") || c.startsWith(":root") || /^[a-z*\.\#\[]/i.test(c)) {
    if (c.includes("{") && c.includes("}") && !c.includes("function")) return "css";
  }
  if (c.startsWith("function") || c.startsWith("const ") || c.startsWith("var ") || c.startsWith("let ") || c.startsWith("import ") || c.startsWith("//") || c.startsWith("/*")) return "js";
  return "other";
}

function buildPreviewHtml(files: ProjectFile[]): string {
  if (files.length === 0) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${CONSOLE_CAPTURE_SCRIPT}</head><body style="margin:0;background:#080810;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace"><p style="color:#475569;font-size:13px">Nenhum arquivo no projeto.</p></body></html>`;
  }

  const framework = detectFramework(files);
  if (framework) {
    return frameworkPreviewHtml(framework, files);
  }

  const normalizedFiles: ProjectFile[] = files.map((f) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (["txt", "text"].includes(ext) && f.content.trim().length > 20) {
      const sniffed = sniffFileType(f);
      if (sniffed === "html") return { ...f, name: f.name.replace(/\.(txt|text)$/, ".html") };
      if (sniffed === "css") return { ...f, name: f.name.replace(/\.(txt|text)$/, ".css") };
      if (sniffed === "js") return { ...f, name: f.name.replace(/\.(txt|text)$/, ".js") };
    }
    return f;
  });

  const htmlFile =
    normalizedFiles.find((f) => f.name === "index.html") ??
    normalizedFiles.find((f) => f.name.endsWith(".html") || f.name.endsWith(".htm"));

  const cssFiles = files.filter((f) => f.name.endsWith(".css"));
  const jsFiles = files.filter(
    (f) => f.name.endsWith(".js") && !f.name.endsWith(".min.js"),
  );

  if (!htmlFile) {
    const appFiles = files.filter((f) => !CONFIG_FILES.has(f.name));
    const jsApp = appFiles.find((f) => f.name.endsWith(".js"));
    const cssApp = appFiles.find((f) => f.name.endsWith(".css"));

    if (jsApp) {
      const extraCss = cssApp ? `<style>${cssApp.content}</style>` : "";
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${CONSOLE_CAPTURE_SCRIPT}${extraCss}<style>body{margin:0;background:#fff}</style></head><body><script type="module">${jsApp.content}<\/script></body></html>`;
    }
    if (cssApp) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8">${CONSOLE_CAPTURE_SCRIPT}<style>body{margin:0}${cssApp.content}</style></head><body style="padding:2rem;font-family:sans-serif;color:#333"><p style="color:#888;font-size:13px;font-family:monospace">CSS aplicado à página.</p></body></html>`;
    }

    const nonConfig = appFiles[0];
    if (nonConfig) {
      const isMarkdown = nonConfig.name.endsWith(".md");
      const content = nonConfig.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      if (isMarkdown) {
        return `<!DOCTYPE html><html><head><meta charset="utf-8">${CONSOLE_CAPTURE_SCRIPT}<style>body{margin:0;padding:2rem;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;line-height:1.6;max-width:800px}pre{background:#f1f5f9;padding:1rem;border-radius:6px;overflow-x:auto;font-size:13px}</style></head><body><pre>${content}</pre></body></html>`;
      }
      return `<!DOCTYPE html><html><head><meta charset="utf-8">${CONSOLE_CAPTURE_SCRIPT}<style>body{margin:0;background:#080810;color:#e2e8f0;font-family:monospace;font-size:13px;padding:2rem;line-height:1.6}pre{white-space:pre-wrap;word-break:break-all}</style></head><body><pre>${content}</pre></body></html>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8">${CONSOLE_CAPTURE_SCRIPT}</head><body style="margin:0;background:#080810;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace"><p style="color:#475569;font-size:13px">Nenhum arquivo renderizável encontrado.</p></body></html>`;
  }

  let html = htmlFile.content;

  const existingLinkHrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map((m) => m[1]);
  const existingSrcSrcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);

  const cssToInject = cssFiles
    .filter((f) => f.name !== htmlFile.name && !existingLinkHrefs.includes(f.name) && !existingLinkHrefs.includes(`./${f.name}`))
    .map((f) => `<style>/* ${f.name} */\n${f.content}</style>`)
    .join("\n");

  const jsToInject = jsFiles
    .filter((f) => f.name !== htmlFile.name && !existingSrcSrcs.includes(f.name) && !existingSrcSrcs.includes(`./${f.name}`))
    .map((f) => `<script>/* ${f.name} */\n${f.content}<\/script>`)
    .join("\n");

  const localLinkRe = /(<link[^>]+href=")(?!https?:\/\/|\/\/|data:)([^"]+\.css)("[^>]*>)/g;
  html = html.replace(localLinkRe, (_match, before, href, after) => {
    const cssFile = cssFiles.find((f) => f.name === href || f.name === href.replace("./", ""));
    if (cssFile) return `<style>/* ${cssFile.name} */\n${cssFile.content}</style>`;
    return before + href + after;
  });

  const localScriptRe = /(<script[^>]+src=")(?!https?:\/\/|\/\/|data:)([^"]+\.js)("[^>]*><\/script>)/g;
  html = html.replace(localScriptRe, (_match, before, src, after) => {
    const jsFile = jsFiles.find((f) => f.name === src || f.name === src.replace("./", ""));
    if (jsFile) return `<script>/* ${jsFile.name} */\n${jsFile.content}<\/script>`;
    return before + src + after;
  });

  if (html.includes("<head>")) {
    html = html.replace("<head>", `<head>${CONSOLE_CAPTURE_SCRIPT}`);
  } else if (html.includes("<html>")) {
    html = html.replace("<html>", `<html><head>${CONSOLE_CAPTURE_SCRIPT}</head>`);
  } else {
    html = CONSOLE_CAPTURE_SCRIPT + html;
  }

  if (cssToInject) {
    html = html.includes("</head>")
      ? html.replace("</head>", `${cssToInject}\n</head>`)
      : cssToInject + "\n" + html;
  }

  if (jsToInject) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsToInject}\n</body>`)
      : html + "\n" + jsToInject;
  }

  return html;
}

router.get("/projects/:id/preview", async (req, res): Promise<void> => {
  const token = req.query["token"] as string | undefined;
  if (!token) {
    res.status(401).send("<html><body><p>Token de autenticação necessário.</p></body></html>");
    return;
  }

  const userId = await getSession(token);
  if (!userId) {
    res.status(401).send("<html><body><p>Token inválido ou expirado.</p></body></html>");
    return;
  }

  const projectId = Number(req.params.id);
  if (Number.isNaN(projectId)) {
    res.status(400).send("<html><body><p>ID de projeto inválido.</p></body></html>");
    return;
  }

  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, userId)));

    if (!project) {
      res.status(404).send("<html><body><p>Projeto não encontrado.</p></body></html>");
      return;
    }

    const files = await db
      .select()
      .from(projectFilesTable)
      .where(eq(projectFilesTable.projectId, projectId));

    const html = buildPreviewHtml(files);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.send(html);
  } catch (error) {
    logger.error({ error }, "Erro ao gerar preview do projeto");
    res.status(500).send("<html><body><p>Erro ao gerar preview.</p></body></html>");
  }
});

export default router;
