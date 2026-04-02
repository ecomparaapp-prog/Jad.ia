import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Code2, Zap, Globe, Smartphone, Lock, GitBranch, Terminal, Cpu, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logoBranca from "@assets/logo_sem_fundo_branca_1775101885588.jpg";
import logo from "@assets/logo_sem_fundo_1775101885589.png";

const features = [
  { icon: Code2, title: "Editor Inteligente", desc: "Escreva código com syntax highlighting e sugestões da IA em tempo real." },
  { icon: Zap, title: "IA Integrada (Groq)", desc: "Chat direto com IA para gerar, refatorar e explicar código na linguagem que você quer." },
  { icon: Globe, title: "Sites e Web Apps", desc: "Crie projetos HTML, CSS, JavaScript, React, Vue e Next.js com pré-visualização." },
  { icon: Smartphone, title: "Apps Mobile", desc: "Inicie projetos React Native com todo o suporte de IA para desenvolvimento mobile." },
  { icon: Lock, title: "Gerenciamento de Secrets", desc: "Armazene variáveis de ambiente e chaves de API de forma segura para seus projetos." },
  { icon: GitBranch, title: "Controle de Versão", desc: "Integração com GitHub para versionamento e colaboração nos seus projetos." },
];

const languages = [
  { name: "JavaScript", color: "#b87333" },
  { name: "TypeScript", color: "#5a7a40" },
  { name: "Python", color: "#7a5c30" },
  { name: "React", color: "#6b8c52" },
  { name: "Vue", color: "#58752e" },
  { name: "Node.js", color: "#4a6b25" },
  { name: "Next.js", color: "#583010" },
  { name: "HTML/CSS", color: "#8c4a1a" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(27 73% 20% / 0.15), transparent)" }}
        />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <div className="neu-card p-5 rounded-3xl inline-flex">
                <img
                  src={theme === "dark" ? logoBranca : logo}
                  alt="Jadi.ia"
                  className="h-20 w-20 object-contain"
                />
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-tight">
              Sua IA de{" "}
              <span className="text-primary font-mono">Vibe Coding</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Descreva o que quer construir em português. A Jadi.ia gera o código
              em tempo real enquanto você conversa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setLocation("/registro")}
                data-testid="button-get-started"
                className="neu-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full"
              >
                Comece grátis agora
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLocation("/login")}
                data-testid="button-login-home"
                className="neu-btn inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold bg-card text-foreground rounded-full"
              >
                Entrar na plataforma
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LINGUAGENS */}
      <section className="py-5">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest">
            suporte completo a
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {languages.map((lang, i) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="neu-card-sm flex items-center gap-2 px-4 py-2 text-xs font-mono"
              >
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lang.color }} />
                {lang.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tudo que você precisa para criar</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa com editor de código, IA integrada, controle de versão e gerenciamento de projetos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="neu-card p-6 group hover:translate-y-[-2px] transition-transform duration-200"
              >
                <div className="neu-card-sm h-11 w-11 flex items-center justify-center mb-5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* IA DEMO */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Cpu className="h-5 w-5 text-primary" />
              <span className="text-primary font-mono text-sm font-semibold tracking-wide">Powered by Groq AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">IA que entende código de verdade</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mb-10">
              Converse em português para gerar componentes, resolver bugs, refatorar código e criar projetos completos.
            </p>

            <div className="max-w-xl mx-auto neu-card p-5 text-left font-mono text-xs">
              <div className="flex gap-1.5 mb-4">
                <div className="h-3 w-3 rounded-full bg-destructive/70" />
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(34 70% 55%)" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "hsl(74 50% 45%)" }} />
              </div>
              <p className="text-muted-foreground">
                <span className="text-primary font-semibold">usuario:</span>{" "}
                Crie um formulário de login em React com validação
              </p>
              <p className="mt-3 text-muted-foreground">
                <span className="font-semibold" style={{ color: "hsl(74 40% 40%)" }}>jadi:</span>{" "}
                Claro! Vou criar um formulário de login completo com React Hook Form e validação...
              </p>
              <div className="mt-3 neu-inset p-3 text-[11px] leading-relaxed">
                <code className="text-primary">{`const loginSchema = z.object({`}</code>
                <br />
                <code className="text-muted-foreground pl-4">{`email: z.string().email(),`}</code>
                <br />
                <code className="text-muted-foreground pl-4">{`password: z.string().min(8),`}</code>
                <br />
                <code className="text-primary">{`});`}</code>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="neu-card max-w-xl mx-auto p-10">
              <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
              <p className="text-muted-foreground mb-8">
                Crie sua conta gratuitamente e comece a desenvolver com IA agora mesmo.
              </p>
              <button
                onClick={() => setLocation("/registro")}
                className="neu-btn inline-flex items-center justify-center gap-2 px-10 py-3.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full"
              >
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={theme === "dark" ? logoBranca : logo} alt="Jadi.ia" className="h-6 w-6 object-contain" />
              <span className="font-semibold font-mono">Jadi.ia</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {new Date().getFullYear()} Jadi.ia — Plataforma de desenvolvimento com IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
