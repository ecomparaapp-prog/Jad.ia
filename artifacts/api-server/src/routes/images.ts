import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

interface PixabayHit {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
  user: string;
  views: number;
  downloads: number;
  likes: number;
  imageWidth: number;
  imageHeight: number;
}

interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: { full: string; regular: string; small: string; thumb: string };
  user: { name: string; username: string };
  width: number;
  height: number;
  likes: number;
  links: { download: string };
}

router.get("/images/pixabay", requireAuth, async (req, res) => {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "PIXABAY_API_KEY não configurada" });
    return;
  }

  const q = String(req.query.q ?? "nature");
  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 20);
  const imageType = String(req.query.image_type ?? "photo");
  const orientation = req.query.orientation ? String(req.query.orientation) : undefined;

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q,
      image_type: imageType,
      page: String(page),
      per_page: String(Math.min(perPage, 20)),
      safesearch: "true",
    });
    if (orientation) params.set("orientation", orientation);

    const response = await fetch(`https://pixabay.com/api/?${params}`);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Pixabay API error ${response.status}: ${err}`);
    }

    const data = await response.json() as { totalHits: number; hits: PixabayHit[] };

    res.json({
      source: "pixabay",
      total: data.totalHits,
      page,
      perPage,
      results: data.hits.map((hit) => ({
        id: String(hit.id),
        thumbUrl: hit.previewURL,
        previewUrl: hit.webformatURL,
        fullUrl: hit.largeImageURL,
        description: hit.tags,
        author: hit.user,
        width: hit.imageWidth,
        height: hit.imageHeight,
        likes: hit.likes,
        downloads: hit.downloads,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Erro ao buscar imagens do Pixabay");
    res.status(500).json({ error: "Erro ao buscar imagens no Pixabay" });
  }
});

router.get("/images/unsplash", requireAuth, async (req, res) => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    res.status(503).json({ error: "UNSPLASH_ACCESS_KEY não configurada" });
    return;
  }

  const query = String(req.query.q ?? "nature");
  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 20);
  const orientation = req.query.orientation ? String(req.query.orientation) : undefined;

  try {
    const params = new URLSearchParams({
      query,
      page: String(page),
      per_page: String(Math.min(perPage, 30)),
    });
    if (orientation) params.set("orientation", orientation);

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Unsplash API error ${response.status}: ${err}`);
    }

    const data = await response.json() as { total: number; results: UnsplashPhoto[] };

    res.json({
      source: "unsplash",
      total: data.total,
      page,
      perPage,
      results: data.results.map((photo) => ({
        id: photo.id,
        thumbUrl: photo.urls.thumb,
        previewUrl: photo.urls.small,
        fullUrl: photo.urls.regular,
        description: photo.description ?? photo.alt_description ?? "",
        author: photo.user.name,
        width: photo.width,
        height: photo.height,
        likes: photo.likes,
        downloadUrl: photo.links.download,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Erro ao buscar fotos do Unsplash");
    res.status(500).json({ error: "Erro ao buscar fotos no Unsplash" });
  }
});

router.get("/images/search", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "nature");
  const source = String(req.query.source ?? "both");
  const page = Number(req.query.page ?? 1);
  const perPage = 12;

  const results: Record<string, unknown>[] = [];
  const errors: string[] = [];

  const fetchPixabay = async () => {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey || source === "unsplash") return;
    try {
      const params = new URLSearchParams({
        key: apiKey,
        q,
        image_type: "photo",
        page: String(page),
        per_page: String(perPage),
        safesearch: "true",
      });
      const res = await fetch(`https://pixabay.com/api/?${params}`);
      if (!res.ok) throw new Error(`Pixabay ${res.status}`);
      const data = await res.json() as { hits: PixabayHit[] };
      for (const hit of data.hits) {
        results.push({
          id: `pixabay_${hit.id}`,
          source: "pixabay",
          thumbUrl: hit.previewURL,
          previewUrl: hit.webformatURL,
          fullUrl: hit.largeImageURL,
          description: hit.tags,
          author: hit.user,
          width: hit.imageWidth,
          height: hit.imageHeight,
        });
      }
    } catch (err) {
      errors.push(`Pixabay: ${err}`);
    }
  };

  const fetchUnsplash = async () => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey || source === "pixabay") return;
    try {
      const params = new URLSearchParams({
        query: q,
        page: String(page),
        per_page: String(perPage),
      });
      const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
        headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
      });
      if (!res.ok) throw new Error(`Unsplash ${res.status}`);
      const data = await res.json() as { results: UnsplashPhoto[] };
      for (const photo of data.results) {
        results.push({
          id: `unsplash_${photo.id}`,
          source: "unsplash",
          thumbUrl: photo.urls.thumb,
          previewUrl: photo.urls.small,
          fullUrl: photo.urls.regular,
          description: photo.description ?? photo.alt_description ?? "",
          author: photo.user.name,
          width: photo.width,
          height: photo.height,
        });
      }
    } catch (err) {
      errors.push(`Unsplash: ${err}`);
    }
  };

  await Promise.all([fetchPixabay(), fetchUnsplash()]);

  results.sort(() => Math.random() - 0.5);

  res.json({ results, errors: errors.length ? errors : undefined });
});

export default router;
