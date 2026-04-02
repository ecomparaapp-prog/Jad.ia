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

async function searchPixabayImages(query: string, count = 3): Promise<string[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=${count}&safesearch=true&editors_choice=false`;
    const res = await fetch(url, {
      headers: {
        "Referer": "https://pixabay.com",
        "User-Agent": "Mozilla/5.0 Jad.ia AssetEngine/1.0",
      },
    });
    if (!res.ok) {
      logger.warn({ status: res.status, query }, "Pixabay images falhou");
      return [];
    }
    const data = await res.json() as {
      hits?: Array<{ webformatURL?: string; largeImageURL?: string }>;
    };
    return (data.hits ?? [])
      .map((h) => h.webformatURL ?? h.largeImageURL)
      .filter((u): u is string => !!u);
  } catch {
    return [];
  }
}

const FALLBACK_SOUNDS: Record<string, Array<{ name: string; url: string; preview: string }>> = {
  "button click": [
    { name: "Click UI", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3", preview: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3" },
    { name: "Click soft", url: "https://cdn.pixabay.com/audio/2021/08/04/audio_c518a35e65.mp3", preview: "https://cdn.pixabay.com/audio/2021/08/04/audio_c518a35e65.mp3" },
  ],
  "notification": [
    { name: "Notification chime", url: "https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3", preview: "https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3" },
    { name: "Alert ping", url: "https://cdn.pixabay.com/audio/2022/11/17/audio_5b68e7b39b.mp3", preview: "https://cdn.pixabay.com/audio/2022/11/17/audio_5b68e7b39b.mp3" },
  ],
  "success": [
    { name: "Success ding", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_d0c6ff1bab.mp3", preview: "https://cdn.pixabay.com/audio/2022/03/15/audio_d0c6ff1bab.mp3" },
  ],
  "error": [
    { name: "Error buzz", url: "https://cdn.pixabay.com/audio/2021/08/09/audio_14a9c22e51.mp3", preview: "https://cdn.pixabay.com/audio/2021/08/09/audio_14a9c22e51.mp3" },
  ],
};

function getFallbackSounds(query: string, count = 2): Array<{ name: string; url: string; preview: string }> {
  const key = Object.keys(FALLBACK_SOUNDS).find((k) => query.toLowerCase().includes(k)) ?? "button click";
  return (FALLBACK_SOUNDS[key] ?? FALLBACK_SOUNDS["button click"]).slice(0, count);
}

async function searchPixabaySounds(query: string, count = 3): Promise<Array<{ name: string; url: string; preview: string }>> {
  return getFallbackSounds(query, count);
}

function getPicsumUrls(query: string, count = 3): string[] {
  const seed = query.toLowerCase().replace(/\s+/g, "-");
  return Array.from({ length: count }, (_, i) => `${PICSUM_BASE}/800/450?random=${seed}-${i}`);
}

async function fetchImages(query: string, count = 3): Promise<{ urls: string[]; source: string }> {
  let urls = await searchUnsplash(query, count);
  if (urls.length > 0) return { urls, source: "unsplash" };

  urls = await searchPixabayImages(query, count);
  if (urls.length > 0) return { urls, source: "pixabay" };

  return { urls: getPicsumUrls(query, count), source: "picsum" };
}

router.get("/assets/images", requireAuth, async (req, res): Promise<void> => {
  const query = String(req.query.query ?? "nature");
  const count = Math.min(Number(req.query.count ?? 3), 9);
  const { urls, source } = await fetchImages(query, count);
  res.json({ urls, source, query });
});

router.get("/assets/fonts", requireAuth, async (_req, res): Promise<void> => {
  res.json({ pairs: FONT_PAIRS });
});

router.get("/assets/fonts/:mood", requireAuth, async (req, res): Promise<void> => {
  const mood = req.params.mood?.toLowerCase() ?? "modern";
  const pair = FONT_PAIRS[mood] ?? FONT_PAIRS.modern;
  const families = pair.heading === pair.body
    ? `family=${pair.heading}:wght@${pair.weights}`
    : `family=${pair.heading}:wght@${pair.weights}&family=${pair.body}:wght@${pair.weights}`;

  const googleFontsUrl = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  const cssVars = `--font-heading: '${pair.heading.replace(/\+/g, " ")}', sans-serif; --font-body: '${pair.body.replace(/\+/g, " ")}', sans-serif;`;

  res.json({ ...pair, googleFontsUrl, cssVars, mood });
});

router.get("/assets/sounds", requireAuth, async (req, res): Promise<void> => {
  const query = String(req.query.query ?? "notification");
  const count = Math.min(Number(req.query.count ?? 3), 9);

  const sounds = await searchPixabaySounds(query, count);
  const source = sounds.length > 0 ? "pixabay" : "none";

  logger.info({ query, count: sounds.length, source }, "Sons buscados");
  res.json({ sounds, source, query });
});

router.post("/assets/resolve", requireAuth, async (req, res): Promise<void> => {
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

  const imageResults: Record<string, { urls: string[]; source: string }> = {};
  await Promise.all(
    imageQueries.slice(0, 5).map(async (query) => {
      const result = await fetchImages(query, 2);
      imageResults[query] = result;
    }),
  );

  const soundResults: Record<string, Array<{ name: string; url: string; preview: string }>> = {};
  await Promise.all(
    (soundQueries ?? []).slice(0, 3).map(async (query) => {
      soundResults[query] = await searchPixabaySounds(query, 2);
    }),
  );

  logger.info({ mood, imageQueries, soundQueries }, "Assets resolvidos via Pixabay");

  res.json({
    fonts: {
      heading: fontPair.heading.replace(/\+/g, " "),
      body: fontPair.body.replace(/\+/g, " "),
      googleFontsUrl,
      cssVars: `--font-heading: '${fontPair.heading.replace(/\+/g, " ")}', sans-serif; --font-body: '${fontPair.body.replace(/\+/g, " ")}', sans-serif;`,
      mood,
    },
    images: Object.fromEntries(
      Object.entries(imageResults).map(([q, r]) => [q, r.urls]),
    ),
    imageSources: Object.fromEntries(
      Object.entries(imageResults).map(([q, r]) => [q, r.source]),
    ),
    sounds: soundResults,
  });
});

export default router;
