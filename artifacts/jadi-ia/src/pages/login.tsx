import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { KeyRound } from "lucide-react";
import logoBranca from "@assets/logo_sem_fundo_branca_1775101885588.jpg";
import logo from "@assets/logo_sem_fundo_1775101885589.png";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setToken } = useAuth();
  const { theme } = useTheme();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Bem-vindo de volta!", description: `Olá, ${data.user.name}!` });
        setLocation("/dashboard");
      },
      onError: (error: { data?: { error?: string } }) => {
        toast({
          title: "Erro ao entrar",
          description: error?.data?.error ?? "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(data: LoginForm) {
    loginMutation.mutate({ data });
  }

  function fillTestCredentials() {
    form.setValue("email", "admin@jadi.ia");
    form.setValue("password", "admin123");
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12 border-r border-border">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <img
            src={theme === "dark" ? logoBranca : logo}
            alt="Jadi.ia"
            className="h-32 w-32 object-contain mx-auto mb-8"
          />
          <h2 className="text-2xl font-bold mb-4">Desenvolva com a ajuda da IA</h2>
          <p className="text-muted-foreground">
            Crie sites, sistemas, web apps e aplicativos mobile com suporte de inteligência artificial em português.
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <img
              src={theme === "dark" ? logoBranca : logo}
              alt="Jadi.ia"
              className="h-10 w-10 object-contain lg:hidden"
            />
            <div>
              <h1 className="text-2xl font-bold">Entrar</h1>
              <p className="text-sm text-muted-foreground">Acesse sua conta no Jadi.ia</p>
            </div>
          </div>

          <div
            className="mb-6 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={fillTestCredentials}
            data-testid="test-credentials-hint"
            title="Clique para preencher automaticamente"
          >
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-primary">Conta de teste (clique para preencher)</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Email: <span className="text-foreground">admin@jadi.ia</span>
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Senha: <span className="text-foreground">admin123</span>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        data-testid="input-email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Nao tem uma conta?{" "}
            <Link href="/registro" className="text-primary hover:underline font-medium" data-testid="link-register">
              Criar conta gratuita
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
