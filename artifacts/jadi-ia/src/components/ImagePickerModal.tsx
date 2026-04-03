import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ImageIcon, Download, Copy, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ImageResult {
  id: string;
  source: "pixabay" | "unsplash";
  thumbUrl: string;
  previewUrl: string;
  fullUrl: string;
  description: string;
  author: string;
  width: number;
  height: number;
  likes?: number;
  downloadUrl?: string;
}

interface ImagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, description: string) => void;
  token: string | null;
}

const SOURCE_OPTIONS = [
  { value: "both", label: "Todos" },
  { value: "pixabay", label: "Pixabay" },
  { value: "unsplash", label: "Unsplash" },
] as const;

export default function ImagePickerModal({ open, onClose, onInsert, token }: ImagePickerModalProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"both" | "pixabay" | "unsplash">("both");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<ImageResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string, src: string, pg: number) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), source: src, page: String(pg) });
      const res = await fetch(`/api/images/search?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Erro na busca");
      const data = await res.json() as { results: ImageResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setPage(1);
    search(query, source, 1);
  }

  function handleSourceChange(s: typeof source) {
    setSource(s);
    if (searched && query.trim()) {
      setPage(1);
      search(query, s, 1);
    }
  }

  function handlePrev() {
    const p = Math.max(1, page - 1);
    setPage(p);
    search(query, source, p);
  }

  function handleNext() {
    const p = page + 1;
    setPage(p);
    search(query, source, p);
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleInsert(img: ImageResult, useHtml = false) {
    const url = img.fullUrl;
    const desc = img.description || img.author;
    if (useHtml) {
      onInsert(`<img src="${url}" alt="${desc}" />`, desc);
    } else {
      onInsert(url, desc);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card w-full max-w-4xl flex flex-col"
          style={{ maxHeight: "90vh", borderRadius: "1.5rem" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: "var(--gradient-primary)", opacity: 0.9 }}>
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">Buscar Imagens</h2>
                <p className="text-xs text-muted-foreground">Pixabay & Unsplash — gratuitas para uso</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-border/20">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ex: natureza, cidade, tecnologia, pessoas..."
                  className="pl-9 rounded-xl"
                  autoFocus
                />
              </div>
              <Button type="submit" disabled={loading || !query.trim()} className="rounded-xl px-5" style={{ background: "var(--gradient-primary)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </form>
            <div className="flex gap-2 mt-3">
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSourceChange(opt.value)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                    source === opt.value
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  style={source === opt.value ? { background: "var(--gradient-primary)" } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {!searched && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-sm">Busque imagens do Pixabay e Unsplash</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Milhões de fotos gratuitas e de alta qualidade</p>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!loading && searched && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma imagem encontrada para "{query}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Tente termos em inglês para melhores resultados</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {results.map((img) => (
                  <div
                    key={img.id}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      selected?.id === img.id ? "border-primary shadow-lg scale-[1.02]" : "border-transparent hover:border-primary/50"
                    }`}
                    onClick={() => setSelected(selected?.id === img.id ? null : img)}
                  >
                    <div className="aspect-video bg-muted">
                      <img
                        src={img.thumbUrl}
                        alt={img.description}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                      <p className="text-white text-xs font-medium truncate">{img.author}</p>
                      <Badge
                        variant="secondary"
                        className="text-[9px] w-fit mt-0.5 px-1.5 py-0"
                        style={{ background: img.source === "pixabay" ? "#1ea446" : "#111" }}
                      >
                        {img.source}
                      </Badge>
                    </div>

                    {selected?.id === img.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-6 w-6 text-primary drop-shadow" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected image actions + pagination */}
          <div className="p-4 border-t border-border/20">
            {selected ? (
              <div className="flex items-start gap-4">
                <img
                  src={selected.previewUrl}
                  alt={selected.description}
                  className="h-16 w-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selected.description || "Sem descrição"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">por {selected.author} · {selected.source} · {selected.width}×{selected.height}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Button
                      size="sm"
                      className="rounded-lg h-7 text-xs"
                      style={{ background: "var(--gradient-primary)" }}
                      onClick={() => handleInsert(selected, false)}
                    >
                      Inserir URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-7 text-xs"
                      onClick={() => handleInsert(selected, true)}
                    >
                      Inserir como &lt;img&gt;
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-lg h-7 text-xs"
                      onClick={() => handleCopy(selected.fullUrl)}
                    >
                      {copied === selected.fullUrl ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied === selected.fullUrl ? "Copiado!" : "Copiar URL"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {results.length > 0 ? `${results.length} imagens · página ${page} · clique para selecionar` : ""}
                </p>
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-7" onClick={handlePrev} disabled={page <= 1 || loading}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7" onClick={handleNext} disabled={loading}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
