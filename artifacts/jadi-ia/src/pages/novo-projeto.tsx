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
import { ArrowLeft, Bot, Plus } from "lucide-react";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", color: "#f7df1e", desc: "Web interativo e dinâmico" },
  { id: "typescript", label: "TypeScript", color: "#3178c6", desc: "JavaScript com tipagem estática" },
  { id: "python", label: "Python", color: "#3776ab", desc: "Scripts, IA e automações" },
  { id: "react", label: "React", color: "#61dafb", desc: "Interfaces modernas e reativas" },
  { id: "vue", label: "Vue", color: "#42b883", desc: "Framework progressivo" },
  { id: "node.js", label: "Node.js", color: "#339933", desc: "Backend JavaScript" },
  { id: "next.js", label: "Next.js", color: "#888888", desc: "React com SSR e rotas" },
  { id: "html", label: "HTML/CSS", color: "#e34f26", desc: "Sites estáticos" },
  { id: "react native", label: "React Native", color: "#61dafb", desc: "Apps mobile" },
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
                        <button
                          type="button"
                          onClick={() => field.onChange("auto")}
                          data-testid="lang-option-auto"
                          className={`p-3 rounded-lg border text-left transition-all col-span-2 sm:col-span-3 ${
                            selectedLanguage === "auto"
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className={`h-4 w-4 ${selectedLanguage === "auto" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="text-sm font-medium">Automático</span>
                            <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium ml-auto">
                              Recomendado
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            O Agente Analista escolhe a melhor stack baseada na sua descrição
                          </p>
                        </button>
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => field.onChange(lang.id)}
                            data-testid={`lang-option-${lang.id}`}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedLanguage === lang.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: lang.color }} />
                              <span className="text-sm font-medium">{lang.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{lang.desc}</p>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProject.isPending}
                  data-testid="button-create-project"
                >
                  {createProject.isPending ? "Criando..." : "Criar Projeto"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </div>
  );
}
