import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Wand2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  Loader2,
  SendHorizonal,
} from "lucide-react";
import { useGeneratePrompt, type GeneratePromptMutationResult } from "@workspace/api-client-react";

interface GeneratePromptModalProps {
  projectName: string;
  projectDescription?: string;
  projectType?: string;
  language?: string;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
}

export default function GeneratePromptModal({
  projectName,
  projectDescription,
  projectType,
  language,
  onClose,
  onUsePrompt,
}: GeneratePromptModalProps) {
  const [description, setDescription] = useState(projectDescription ?? "");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ prompt: string; suggestions: string[] } | null>(null);

  const generatePrompt = useGeneratePrompt({
    mutation: {
      onSuccess: (data: GeneratePromptMutationResult) => {
        setResult(data);
      },
    },
  });

  function handleGenerate() {
    if (!description.trim()) return;
    setResult(null);
    generatePrompt.mutate({
      data: {
        description,
        projectType: projectType ?? "web app",
        language: language && language !== "auto" ? language : undefined,
      },
    });
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleUsePrompt() {
    if (!result) return;
    onUsePrompt(result.prompt);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-2xl bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "85vh" }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Gerar Prompt Técnico</p>
                <p className="text-xs text-muted-foreground leading-tight">{projectName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden p-5 gap-4">
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descrição do projeto
                </label>
                {language && language !== "auto" && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {language}
                  </Badge>
                )}
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que você quer construir com o máximo de detalhes possível..."
                className="resize-none text-sm min-h-[80px] max-h-[120px]"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Ctrl+Enter para gerar</p>
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={!description.trim() || generatePrompt.isPending}
                  className="h-8 text-xs gap-1.5"
                >
                  {generatePrompt.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Gerar Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>

            {generatePrompt.isPending && !result && (
              <div className="flex-1 flex items-center justify-center py-10">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <Wand2 className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-sm">Arquitetando prompt técnico...</p>
                </div>
              </div>
            )}

            {result && (
              <motion.div
                className="flex flex-col gap-3 flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between flex-shrink-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Prompt Gerado
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-green-500">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>

                <ScrollArea className="flex-1 rounded-lg border border-border bg-muted/30">
                  <div className="p-4">
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono text-foreground/90">
                      {result.prompt}
                    </pre>
                  </div>
                </ScrollArea>

                {result.suggestions.length > 0 && (
                  <div className="flex-shrink-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Sugestões
                    </p>
                    <div className="space-y-1.5">
                      {result.suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {result && (
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border flex-shrink-0">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
                Fechar
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleUsePrompt}>
                <SendHorizonal className="h-3.5 w-3.5" />
                Usar no Vibe Chat
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
