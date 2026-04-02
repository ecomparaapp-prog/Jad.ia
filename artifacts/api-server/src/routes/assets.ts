import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const PICSUM_BASE = "https://picsum.photos";

const FONT_PAIRS: Record<string, { heading: string; body: string; weights: string }> = {
  modern: { heading: "Inter", body: "Inter", weights: "400;500;600;700" },
  editorial: { heading: "Playfair+Display", body: "Source+Sans+3", weights: "400;600;700" },
  tech: { heading: "Space+Grotesk", body: "JetBrains+Mono", weights: "400;500;700" },
  elegant: { heading: "Cormorant+Garamond", body: "Lato", weights: "300;400;700" },
  bold: { heading: "Montserrat", body: "Open+Sans", weights: "400;600;800" },
  minimal: { heading: "DM+Sans", body: "DM+Sans", weights: "300;400;500;700" },
  creative: { heading: "Syne", body: "Nunito", weights: "400;600;700;800" },
  corporate: { heading: "Roboto", body: "Roboto", weights: "300;400;500;700" },
};

async function searchUnsplash(query: string, count = 3): Promise<string[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${apiKey}` } },
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<{ urls?: { regular?: string } }> };
    return (data.results ?? [])
      .map((r) => r.urls?.regular)
      .filter((u): u is string => !!u);
  } catch {
    return [];
  }
}

function getPicsumUrls(query: string, count = 3): string[] {
  const seed = query.toLowerCase().replace(/\s+/g, "-");
  return Array.from({ length: count }, (_, i) => `${PICSUM_BASE}/800/450?random=${seed}-${i}`);
}

async function searchFreeSound(query: string, count = 3): Promise<Array<{ name: string; url: string; preview: string }>> {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&page_size=${count}&fields=id,name,previews&token=${apiKey}`,
    );
    if (!res.ok) return [];
    const data = await res.json() as {
      results?: Array<{
        id: number;
        name: string;
        previews?: { "preview-hq-mp3"?: string; "preview-lq-mp3"?: string };
      }>;
    };

    return (data.results ?? [])
      .map((s) => ({
        name: s.name,
        url: `https://freesound.org/s/${s.id}/`,
        preview: s.previews?.["preview-hq-mp3"] ?? s.previews?.["preview-lq-mp3"] ?? "",
      }))
      .filter((s) => s.preview !== "");
  } catch {
    return [];
  }
}

router.get("/api/assets/images", requireAuth, async (req, res): Promise<void> => {
  const query = String(req.query.query ?? "nature");
  const count = Math.min(Number(req.query.count ?? 3), 9);

  let urls: string[] = await searchUnsplash(query, count);
  const source = urls.length > 0 ? "unsplash" : "picsum";

  if (urls.length === 0) {
    urls = getPicsumUrls(query, count);
  }

  res.json({ urls, source, query });
});

router.get("/api/assets/fonts", requireAuth, async (_req, res): Promise<void> => {
  res.json({ pairs: FONT_PAIRS });
});

router.get("/api/assets/fonts/:mood", requireAuth, async (req, res): Promise<void> => {
  const mood = req.params.mood?.toLowerCase() ?? "modern";
  const pair = FONT_PAIRS[mood] ?? FONT_PAIRS.modern;
  const families = pair.heading === pair.body
    ? `family=${pair.heading}:wght@${pair.weights}`
    : `family=${pair.heading}:wght@${pair.weights}&family=${pair.body}:wght@${pair.weights}`;

  const googleFontsUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  const cssVars = `--font-heading: '${pair.heading.replace(/\+/g, " ")}', sans-serif; --font-body: '${pair.body.replace(/\+/g, " ")}', sans-serif;`;

  res.json({ ...pair, googleFontsUrl, cssVars, mood });
});

router.get("/api/assets/sounds", requireAuth, async (req, res): Promise<void> => {
  const query = String(req.query.query ?? "notification");
  const count = Math.min(Number(req.query.count ?? 3), 9);

  const sounds = await searchFreeSound(query, count);
  const source = sounds.length > 0 ? "freesound" : "none";

  logger.info({ query, count: sounds.length, source }, "Sons buscados");
  res.json({ sounds, source, query });
});

router.post("/api/assets/resolve", requireAuth, async (req, res): Promise<void> => {
  const { imageQueries = [], fontMood = "modern", soundQueries = [] } = req.body as {
    imageQueries: string[];
    fontMood: string;
    soundQueries?: string[];
  };

  const mood = fontMood.toLowerCase();
  const fontPair = FONT_PAIRS[mood] ?? FONT_PAIRS.modern;
  const families = fontPair.heading === fontPair.body
    ? `family=${fontPair.heading}:wght@${fontPair.weights}`
    : `family=${fontPair.heading}:wght@${fontPair.weights}&family=${fontPair.body}:wght@${fontPair.weights}`;

  const googleFontsUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  const imageResults: Record<string, string[]> = {};
  await Promise.all(
    imageQueries.slice(0, 5).map(async (query) => {
      let urls = await searchUnsplash(query, 2);
      if (urls.length === 0) urls = getPicsumUrls(query, 2);
      imageResults[query] = urls;
    }),
  );

  const soundResults: Record<string, Array<{ name: string; url: string; preview: string }>> = {};
  await Promise.all(
    (soundQueries ?? []).slice(0, 3).map(async (query) => {
      soundResults[query] = await searchFreeSound(query, 2);
    }),
  );

  logger.info({ mood, imageQueries, soundQueries }, "Assets resolvidos");

  res.json({
    fonts: {
      heading: fontPair.heading.replace(/\+/g, " "),
      body: fontPair.body.replace(/\+/g, " "),
      googleFontsUrl,
      cssVars: `--font-heading: '${fontPair.heading.replace(/\+/g, " ")}', sans-serif; --font-body: '${fontPair.body.replace(/\+/g, " ")}', sans-serif;`,
      mood,
    },
    images: imageResults,
    sounds: soundResults,
  });
});

export default router;
