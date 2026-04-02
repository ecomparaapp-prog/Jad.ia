import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import logoBranca from "@assets/logo_sem_fundo_branca_1775101885588.jpg";
import logo from "@assets/logo_sem_fundo_1775101885589.png";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas nao coincidem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const perks = [
  "Editor de código com IA integrada",
  "Geração de código em português",
  "Gerenciamento de projetos e arquivos",
  "Gratuito para sempre",
];

export default function Registro() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setToken } = useAuth();
  const { theme } = useTheme();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        toast({ title: "Conta criada!", description: `Bem-vindo ao Jad.ia, ${data.user.name}!` });
        setLocation("/dashboard");
      },
      onError: (error: { data?: { error?: string } }) => {
        toast({
          title: "Erro ao criar conta",
          description: error?.data?.error ?? "Tente novamente",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(data: RegisterForm) {
    const { confirmPassword: _unused, ...registerData } = data;
    registerMutation.mutate({ data: registerData });
  }

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'var(--gradient-secondary)', opacity: 0.07 }}
        />
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-sm relative"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="glass-card p-4 inline-flex" style={{ borderRadius: '1.5rem' }}>
              <img src={theme === "dark" ? logoBranca : logo} alt="Jad.ia" className="h-14 w-14 object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--app-font-serif)' }}>Jad.ia</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="h-3.5 w-3.5" style={{ color: '#FF8C00' }} strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">Powered by jad.ia</span>
              </div>
            </div>
          </motion.div>

          <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--app-font-serif)' }}>
            Comece a criar hoje
          </h3>
          <p className="text-muted-foreground mb-8">
            Junte-se a milhares de desenvolvedores que usam IA para criar projetos incríveis com mais velocidade.
          </p>

          <div className="space-y-3">
            {perks.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                  style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--gradient-primary-glow)' }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </div>
                <span className="text-sm">{perk}</span>
              </motion.div>
            ))}
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
            <img src={theme === "dark" ? logoBranca : logo} alt="Jad.ia" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl" style={{ fontFamily: 'var(--app-font-serif)' }}>Jad.ia</span>
          </div>

          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--app-font-serif)' }}>
            Criar conta
          </h1>
          <p className="text-sm text-muted-foreground mb-8">Gratuito para sempre</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                      Nome completo
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome"
                        data-testid="input-name"
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
                      Confirmar senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-confirm-password"
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
                className="btn-primary w-full py-3.5 text-sm mt-2"
                disabled={registerMutation.isPending}
                data-testid="button-submit"
              >
                {registerMutation.isPending ? "Criando conta..." : "Criar conta gratuita"}
                {!registerMutation.isPending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
              </button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-7">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#00897B' }} data-testid="link-login">
              Entrar
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
