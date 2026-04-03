import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Plus, Sparkles } from "lucide-react";

const LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript",
    desc: "Web interativo e dinâmico",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  },
  {
    id: "typescript",
    label: "TypeScript",
    desc: "JavaScript com tipagem estática",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  },
  {
    id: "python",
    label: "Python",
    desc: "Scripts, IA e automações",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  },
  {
    id: "react",
    label: "React",
    desc: "Interfaces modernas e reativas",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  },
  {
    id: "vue",
    label: "Vue",
    desc: "Framework progressivo",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg",
  },
  {
    id: "node.js",
    label: "Node.js",
    desc: "Backend JavaScript",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  },
  {
    id: "next.js",
    label: "Next.js",
    desc: "React com SSR e rotas",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  },
  {
    id: "html",
    label: "HTML/CSS",
    desc: "Sites estáticos",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  },
  {
    id: "react native",
    label: "React Native",
    desc: "Apps mobile",
    logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  },
];

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(50, "Máximo 50 caracteres"),
  description: z.string().max(200, "Máximo 200 caracteres").optional(),
  language: z.string().min(1, "Selecione uma linguagem ou deixe como Automático"),
});

type FormData = z.infer<typeof formSchema>;

export default function NovoProjeto() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", language: "auto" },
  });

  const selectedLanguage = form.watch("language");

  const createProject = useCreateProject({
    mutation: {
      onSuccess: (project) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Projeto criado!", description: `${project.name} está pronto para edição.` });
        setLocation(`/projetos/${project.id}`);
      },
      onError: (error: { data?: { error?: string } }) => {
        toast({
          title: "Erro ao criar projeto",
          description: error?.data?.error ?? "Tente novamente",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(data: FormData) {
    createProject.mutate({
      data: {
        name: data.name,
        description: data.description ?? null,
        language: data.language,
      },
    });
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Novo Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Projeto</FormLabel>
                        <FormControl>
                          <Input placeholder="meu-projeto-incrivel" data-testid="input-project-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva brevemente o que este projeto faz..."
                            data-testid="input-project-description"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Linguagem / Framework</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                          {/* Automático — full-width card */}
                          <button
                            type="button"
                            onClick={() => field.onChange("auto")}
                            data-testid="lang-option-auto"
                            className={`p-4 rounded-lg border text-left transition-all col-span-2 sm:col-span-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              selectedLanguage === "auto"
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border hover:border-primary/60 hover:bg-muted/50 bg-card text-card-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles
                                className={`h-4 w-4 shrink-0 ${
                                  selectedLanguage === "auto" ? "text-primary-foreground" : "text-primary"
                                }`}
                              />
                              <span className="text-sm font-semibold">Automático</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
                                  selectedLanguage === "auto"
                                    ? "bg-white/20 text-primary-foreground"
                                    : "bg-primary/15 text-primary"
                                }`}
                              >
                                Recomendado
                              </span>
                            </div>
                            <p
                              className={`text-xs ${
                                selectedLanguage === "auto" ? "text-primary-foreground/80" : "text-muted-foreground"
                              }`}
                            >
                              O Agente Analista escolhe a melhor stack baseada na sua descrição
                            </p>
                          </button>

                          {/* Language cards */}
                          {LANGUAGES.map((lang) => {
                            const isSelected = selectedLanguage === lang.id;
                            return (
                              <button
                                key={lang.id}
                                type="button"
                                onClick={() => field.onChange(lang.id)}
                                data-testid={`lang-option-${lang.id}`}
                                className={`p-3 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                                    : "border-border hover:border-primary/60 hover:bg-muted/50 bg-card text-card-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <img
                                    src={lang.logo}
                                    alt={lang.label}
                                    className={`h-5 w-5 shrink-0 object-contain ${
                                      isSelected && lang.id === "next.js" ? "invert" : ""
                                    }`}
                                    loading="lazy"
                                  />
                                  <span className={`text-sm font-semibold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                                    {lang.label}
                                  </span>
                                </div>
                                <p className={`text-xs ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                  {lang.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t border-border">
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold"
                      disabled={createProject.isPending}
                      data-testid="button-create-project"
                    >
                      {createProject.isPending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Criando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Criar Projeto
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
