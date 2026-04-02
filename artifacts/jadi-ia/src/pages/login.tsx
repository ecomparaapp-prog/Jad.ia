import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { KeyRound, ArrowRight, Sparkles } from "lucide-react";
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

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--gradient-primary)', opacity: 0.07 }}
        />
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm text-center relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass-card inline-flex p-8 mb-10"
            style={{ borderRadius: '2.5rem' }}
          >
            <img
              src={theme === "dark" ? logoBranca : logo}
              alt="Jadi.ia"
              className="h-28 w-28 object-contain"
            />
          </motion.div>
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: 'var(--app-font-serif)' }}
          >
            Jadi.ia
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Crie sites, sistemas e apps com suporte de IA em português. Descreva, e o código aparece em tempo real.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: '#FF8C00' }} strokeWidth={1.5} />
            <span className="text-sm font-medium text-muted-foreground">Powered by Groq AI</span>
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={theme === "dark" ? logoBranca : logo} alt="Jadi.ia" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl" style={{ fontFamily: 'var(--app-font-serif)' }}>Jadi.ia</span>
          </div>

          <h1
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: 'var(--app-font-serif)' }}
          >
            Entrar
          </h1>
          <p className="text-sm text-muted-foreground mb-8">Acesse sua conta no Jadi.ia</p>

          {/* Test credentials */}
          <div
            className="mb-7 p-4 glass-inset cursor-pointer transition-all hover:opacity-80 rounded-2xl"
            onClick={fillTestCredentials}
            data-testid="test-credentials-hint"
            title="Clique para preencher automaticamente"
          >
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#00897B' }} strokeWidth={1.5} />
              <span className="text-xs font-semibold" style={{ color: '#00897B', fontFamily: 'var(--app-font-mono)' }}>
                Conta de teste — clique para preencher
              </span>
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
              Email: <span className="text-foreground font-medium">admin@jadi.ia</span>
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
              Senha: <span className="text-foreground font-medium">admin123</span>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        data-testid="input-email"
                        autoComplete="email"
                        className="glass-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#00897B] rounded-2xl h-12 px-4"
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
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-password"
                        autoComplete="current-password"
                        className="glass-inset border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-[#00897B] rounded-2xl h-12 px-4"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary w-full py-3.5 text-sm mt-2"
                data-testid="button-submit"
              >
                {loginMutation.isPending ? "Entrando..." : "Entrar"}
                {!loginMutation.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
              </button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-7">
            Não tem uma conta?{" "}
            <Link href="/registro" className="font-semibold hover:underline" style={{ color: '#00897B' }} data-testid="link-register">
              Criar conta gratuita
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
