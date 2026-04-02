import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Code2, Zap, Globe, Smartphone, Lock, GitBranch, Cpu, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import logoBranca from "@assets/logo_sem_fundo_branca_1775101885588.jpg";
import logo from "@assets/logo_sem_fundo_1775101885589.png";

const features = [
  { icon: Code2, title: "Editor Inteligente", desc: "Escreva código com syntax highlighting e sugestões da IA em tempo real.", accent: "primary" },
  { icon: Zap, title: "IA Integrada (Groq)", desc: "Chat direto com IA para gerar, refatorar e explicar código na linguagem que você quer.", accent: "secondary" },
  { icon: Globe, title: "Sites e Web Apps", desc: "Crie projetos HTML, CSS, JavaScript, React, Vue e Next.js com pré-visualização.", accent: "primary" },
  { icon: Smartphone, title: "Apps Mobile", desc: "Inicie projetos React Native com todo o suporte de IA para desenvolvimento mobile.", accent: "secondary" },
  { icon: Lock, title: "Gerenciamento de Secrets", desc: "Armazene variáveis de ambiente e chaves de API de forma segura para seus projetos.", accent: "primary" },
  { icon: GitBranch, title: "Controle de Versão", desc: "Integração com GitHub para versionamento e colaboração nos seus projetos.", accent: "secondary" },
];

const languages = [
  { name: "JavaScript", color: "#F7DF1E", bg: "rgba(247,223,30,0.15)" },
  { name: "TypeScript", color: "#3178C6", bg: "rgba(49,120,198,0.15)" },
  { name: "Python", color: "#3776AB", bg: "rgba(55,118,171,0.15)" },
  { name: "React", color: "#61DAFB", bg: "rgba(97,218,251,0.15)" },
  { name: "Vue", color: "#42B883", bg: "rgba(66,184,131,0.15)" },
  { name: "Node.js", color: "#339933", bg: "rgba(51,153,51,0.15)" },
  { name: "Next.js", color: "#888888", bg: "rgba(136,136,136,0.12)" },
  { name: "HTML/CSS", color: "#E34F26", bg: "rgba(227,79,38,0.15)" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-40">
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo badge */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center mb-10"
            >
              <div className="glass-card p-6 inline-flex" style={{ borderRadius: '2.5rem' }}>
                <img
                  src={theme === "dark" ? logoBranca : logo}
                  alt="Jadi.ia"
                  className="h-24 w-24 object-contain"
                />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="glass-card-sm inline-flex items-center gap-2 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5" style={{ color: '#00897B' }} strokeWidth={1.5} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: '#00897B' }}>
                  Powered by Groq AI
                </span>
              </div>
            </motion.div>

            <h1
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              Sua IA de{" "}
              <span className="text-gradient-primary">Vibe Coding</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--app-font-sans)' }}>
              Descreva o que quer construir em português. A Jadi.ia gera o código
              em tempo real enquanto você conversa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation("/registro")}
                data-testid="button-get-started"
                className="btn-primary px-10 py-4 text-base"
              >
                Comece grátis agora
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLocation("/login")}
                data-testid="button-login-home"
                className="btn-glass px-10 py-4 text-base"
              >
                Entrar na plataforma
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LINGUAGENS */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-mono text-muted-foreground mb-6 uppercase tracking-widest">
            suporte completo a
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {languages.map((lang, i) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="glass-card-sm inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium float-card"
                  style={{ background: lang.bg, borderColor: lang.color + '40' }}
                >
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lang.color }} />
                  {lang.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              Tudo que você precisa para criar
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto" style={{ fontFamily: 'var(--app-font-sans)' }}>
              Uma plataforma completa com editor de código, IA integrada, controle de versão e gerenciamento de projetos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-7 float-card group"
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: feature.accent === 'primary' ? 'var(--gradient-primary)' : 'var(--gradient-secondary)',
                    boxShadow: feature.accent === 'primary' ? 'var(--gradient-primary-glow)' : 'var(--gradient-secondary-glow)',
                  }}
                >
                  <feature.icon className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ fontFamily: 'var(--app-font-serif)' }}
                >
                  {feature.title}
                </h3>
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
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center justify-center gap-2 mb-5">
              <Cpu className="h-5 w-5" style={{ color: '#00897B' }} strokeWidth={1.5} />
              <span className="font-semibold text-sm tracking-wide" style={{ color: '#00897B', fontFamily: 'var(--app-font-mono)' }}>
                Powered by Groq AI
              </span>
            </div>
            <h2
              className="text-3xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              IA que entende código de verdade
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mb-12">
              Converse em português para gerar componentes, resolver bugs, refatorar código e criar projetos completos.
            </p>

            <motion.div
              className="max-w-2xl mx-auto glass-card p-6 text-left"
              whileHover={{ translateY: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex gap-1.5 mb-5">
                <div className="h-3 w-3 rounded-full" style={{ background: '#FF5F57' }} />
                <div className="h-3 w-3 rounded-full" style={{ background: '#FEBC2E' }} />
                <div className="h-3 w-3 rounded-full" style={{ background: '#28C840' }} />
              </div>
              <p className="text-sm" style={{ fontFamily: 'var(--app-font-mono)' }}>
                <span className="font-semibold" style={{ color: '#00897B' }}>usuario:</span>{" "}
                <span className="text-muted-foreground">Crie um formulário de login em React com validação</span>
              </p>
              <p className="mt-4 text-sm" style={{ fontFamily: 'var(--app-font-mono)' }}>
                <span className="font-semibold" style={{ color: '#FF8C00' }}>jadi:</span>{" "}
                <span className="text-muted-foreground">Claro! Vou criar um formulário de login completo com React Hook Form e validação...</span>
              </p>
              <div className="mt-4 glass-inset p-4 text-xs leading-relaxed" style={{ fontFamily: 'var(--app-font-mono)' }}>
                <code style={{ color: '#00897B' }}>{`const loginSchema = z.object({`}</code>
                <br />
                <code className="text-muted-foreground pl-6">{`email: z.string().email(),`}</code>
                <br />
                <code className="text-muted-foreground pl-6">{`password: z.string().min(8),`}</code>
                <br />
                <code style={{ color: '#00897B' }}>{`});`}</code>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="max-w-2xl mx-auto glass-card p-14 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ background: 'var(--gradient-primary)', borderRadius: '2.5rem' }}
              />
              <div className="relative">
                <h2
                  className="text-4xl font-bold mb-5"
                  style={{ fontFamily: 'var(--app-font-serif)' }}
                >
                  Pronto para começar?
                </h2>
                <p className="text-muted-foreground mb-10 text-base">
                  Crie sua conta gratuitamente e comece a desenvolver com IA agora mesmo.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/registro")}
                  className="btn-primary px-12 py-4 text-base"
                >
                  Criar conta gratuita
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10">
        <div className="container mx-auto px-4">
          <div className="glass-card-md flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-5">
            <div className="flex items-center gap-2.5">
              <img src={theme === "dark" ? logoBranca : logo} alt="Jadi.ia" className="h-7 w-7 object-contain" />
              <span className="font-bold text-base" style={{ fontFamily: 'var(--app-font-serif)' }}>Jadi.ia</span>
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--app-font-mono)' }}>
              {new Date().getFullYear()} Jadi.ia — Plataforma de desenvolvimento com IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
