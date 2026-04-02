import { Router, type IRouter } from "express";
import { db, projectFilesTable, projectsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function buildPreviewHtml(
  files: Array<{ name: string; content: string; language: string }>,
): string {
  const htmlFile =
    files.find((f) => f.name === "index.html") ??
    files.find((f) => f.name.endsWith(".html") || f.name.endsWith(".htm"));

  const cssFiles = files.filter((f) => f.name.endsWith(".css"));
  const jsFiles = files.filter(
    (f) => f.name.endsWith(".js") && !f.name.endsWith(".min.js"),
  );

  if (!htmlFile) {
    const singleFile = files[0];
    if (!singleFile) {
      return `<!DOCTYPE html><html><body><p style="font-family:monospace;color:#888;padding:2rem">Nenhum arquivo no projeto.</p></body></html>`;
    }
    const isJs = singleFile.name.endsWith(".js") || singleFile.name.endsWith(".ts");
    const isCss = singleFile.name.endsWith(".css");

    if (isJs) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:#0a0a0f;color:#e0e0e0;font-family:monospace}</style></head><body><script type="module">${singleFile.content}<\/script></body></html>`;
    }
    if (isCss) {
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${singleFile.content}</style></head><body><div style="padding:2rem;font-family:monospace;color:#888">CSS aplicado à página.</div></body></html>`;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${singleFile.content}</body></html>`;
  }

  let html = htmlFile.content;

  const cssBlock = cssFiles
    .filter((f) => f.name !== htmlFile.name)
    .map((f) => `<style>/* ${f.name} */\n${f.content}</style>`)
    .join("\n");

  const jsBlock = jsFiles
    .filter((f) => f.name !== htmlFile.name)
    .map((f) => `<script>/* ${f.name} */\n${f.content}<\/script>`)
    .join("\n");

  if (cssBlock) {
    html = html.includes("</head>")
      ? html.replace("</head>", `${cssBlock}\n</head>`)
      : cssBlock + "\n" + html;
  }

  if (jsBlock) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${jsBlock}\n</body>`)
      : html + "\n" + jsBlock;
  }

  return html;
}

router.get("/projects/:id/preview", async (req, res): Promise<void> => {
  const token = req.query["token"] as string | undefined;
  if (!token) {
    res.status(401).send("<html><body><p>Token de autenticação necessário.</p></body></html>");
    return;
  }

  const userId = getSession(token);
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
