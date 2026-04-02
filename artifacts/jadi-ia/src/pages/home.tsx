import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import {
  Code2, Zap, Globe, Smartphone, Lock, GitBranch,
  ArrowRight, Sparkles, Bot, Layers, Terminal, Shield,
  BarChart3, Users, FolderOpen, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { NeuralHead } from "@/components/NeuralHead";
import {
  JSLogo, TSLogo, PythonLogo, ReactLogo,
  VueLogo, NodeLogo, NextLogo, HTMLLogo
} from "@/components/TechLogos";
import logoBranca from "@assets/logo_sem_fundo_branca_1775101885588.jpg";
import logo from "@assets/logo_sem_fundo_1775101885589.png";

const services = [
  { icon: Bot, title: "Vibe Coding IA", desc: "Descreva em português e a IA gera código em tempo real via streaming.", accent: "primary" },
  { icon: Code2, title: "Editor Inteligente", desc: "Syntax highlighting, autocomplete e sugestões contextuais da IA.", accent: "secondary" },
  { icon: Globe, title: "Sites & Web Apps", desc: "React, Vue, Next.js, HTML/CSS com pré-visualização ao vivo.", accent: "primary" },
  { icon: Smartphone, title: "Apps Mobile", desc: "React Native com suporte completo de IA para desenvolvimento mobile.", accent: "secondary" },
  { icon: Layers, title: "Analisador de Stack", desc: "IA recomenda automaticamente a melhor stack para seu projeto.", accent: "primary" },
  { icon: Terminal, title: "Geração de Código", desc: "Comandos rápidos para setup, fix e refactor de qualquer projeto.", accent: "secondary" },
  { icon: Shield, title: "Gerenciador de Secrets", desc: "Armazene variáveis de ambiente e API keys com total segurança.", accent: "primary" },
  { icon: GitBranch, title: "Controle de Versão", desc: "Integração com GitHub para versionamento e colaboração.", accent: "secondary" },
];

const stats = [
  { icon: Users, value: "10K+", label: "Desenvolvedores" },
  { icon: FolderOpen, value: "50K+", label: "Projetos Criados" },
  { icon: Zap, value: "2M+", label: "Linhas Geradas" },
  { icon: Clock, value: "24/7", label: "Disponibilidade" },
];

const techStack = [
  { Logo: JSLogo, name: "JavaScript" },
  { Logo: TSLogo, name: "TypeScript" },
  { Logo: PythonLogo, name: "Python" },
  { Logo: ReactLogo, name: "React" },
  { Logo: VueLogo, name: "Vue.js" },
  { Logo: NodeLogo, name: "Node.js" },
  { Logo: NextLogo, name: "Next.js" },
  { Logo: HTMLLogo, name: "HTML/CSS" },
];

const tickerItems = [
  "Vibe Coding", "Web Apps", "Apps Mobile", "IA Generativa",
  "Editor Inteligente", "Stack Automático", "GitHub Integration", "Secrets Manager",
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }),
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════
          HERO — dark section with 3D head
      ══════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #060f0d 0%, #0a1a15 40%, #0d1f19 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-[-5%] w-[45vw] h-[45vw] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #00897B 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #FF8C00 0%, transparent 70%)", filter: "blur(100px)" }} />
          <div className="absolute top-[30%] right-[15%] w-[25vw] h-[25vw] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #004D40 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[80vh]">

            {/* Left stats */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex lg:col-span-2 flex-col gap-5"
            >
              {[
                { value: "50K+", label: "Projetos\nCriados" },
                { value: "98%", label: "Satisfação\nUsuários" },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className="glass-card-sm p-5 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "1.25rem",
                  }}
                >
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--app-font-serif)" }}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1 whitespace-pre-line leading-relaxed">{label}</p>
                </div>
              ))}
            </motion.div>

            {/* Center — headline + 3D */}
            <div className="lg:col-span-8 flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full"
                style={{
                  background: "rgba(0,137,123,0.15)",
                  border: "1px solid rgba(0,137,123,0.35)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#26C6B0" }} strokeWidth={1.5} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: "#26C6B0", fontFamily: "var(--app-font-mono)" }}>
                  Inteligência Artificial para Devs
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "var(--app-font-serif)" }}
              >
                Sua IA de{" "}
                <br />
                <span style={{
                  background: "linear-gradient(135deg, #00C4A7 0%, #FFA726 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Vibe Coding.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="text-gray-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
              >
                Descreva o que quer construir em português. A jadi.ia gera código em tempo real, cria projetos completos e evolui junto com você.
              </motion.p>

              {/* 3D Neural Head */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md mx-auto"
                style={{ height: "320px" }}
              >
                <NeuralHead className="w-full h-full" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4 mt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/registro")}
                  data-testid="button-get-started"
                  className="btn-primary px-10 py-4 text-base"
                >
                  Começar agora
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/login")}
                  data-testid="button-login-home"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  Entrar na plataforma
                </motion.button>
              </motion.div>
            </div>

            {/* Right stats */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex lg:col-span-2 flex-col gap-5 items-end"
            >
              {[
                { value: "10K+", label: "Devs\nAtivos" },
                { value: "2M+", label: "Linhas de\nCódigo" },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className="glass-card-sm p-5 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "1.25rem",
                    width: "100%",
                  }}
                >
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--app-font-serif)" }}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1 whitespace-pre-line leading-relaxed">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <div
          className="border-t border-b overflow-hidden py-4"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--app-font-mono)" }}>
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ background: i % 3 === 0 ? "#00897B" : i % 3 === 1 ? "#FF8C00" : "#555" }}
                />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TECH LOGOS SECTION
      ══════════════════════════════════ */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8"
            style={{ fontFamily: "var(--app-font-mono)" }}
          >
            Suporte completo a
          </motion.p>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map(({ Logo, name }, i) => (
              <motion.div
                key={name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="glass-card-sm flex flex-col items-center gap-2 px-5 py-4" style={{ borderRadius: "1.25rem", minWidth: "90px" }}>
                  <Logo size={32} />
                  <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "var(--app-font-mono)" }}>{name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SERVICES — small modular cards
      ══════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "var(--app-font-mono)", color: "#00897B" }}>
              O que a jadi.ia faz
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Uma plataforma completa para criar qualquer tipo de software com o poder da IA.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
              >
                <div
                  className="glass-card-md h-full flex flex-col p-5"
                  style={{ borderRadius: "1.5rem" }}
                >
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0 text-white"
                    style={{
                      background: s.accent === "primary" ? "var(--gradient-primary)" : "var(--gradient-secondary)",
                      boxShadow: s.accent === "primary" ? "var(--gradient-primary-glow)" : "var(--gradient-secondary-glow)",
                    }}
                  >
                    <s.icon className="h-4.5 w-4.5" strokeWidth={1.5} style={{ height: "18px", width: "18px" }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAR
      ══════════════════════════════════ */}
      <section
        className="py-16 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #00201A 0%, #001A14 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, #00897B, transparent)" }} />
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-white"
                  style={{ background: i % 2 === 0 ? "var(--gradient-primary)" : "var(--gradient-secondary)" }}
                >
                  <s.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--app-font-mono)" }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CODE DEMO SECTION
      ══════════════════════════════════ */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: "var(--app-font-mono)", color: "#00897B" }}>
                Como funciona
              </p>
              <h2 className="text-4xl font-bold mb-5 leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                IA que entende<br />código de verdade
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Converse em português para gerar componentes, resolver bugs, refatorar código e criar projetos completos — tudo em tempo real.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: "Geração de código em streaming" },
                  { icon: BarChart3, text: "Análise automática de stack" },
                  { icon: Code2, text: "Suporte a 8+ linguagens" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                      style={{ background: "var(--gradient-primary)", boxShadow: "var(--gradient-primary-glow)" }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              whileHover={{ y: -4 }}
            >
              <div
                className="glass-card p-6 text-left"
                style={{
                  background: "rgba(6,15,13,0.95)",
                  border: "1px solid rgba(0,137,123,0.2)",
                  borderRadius: "2rem",
                }}
              >
                <div className="flex gap-1.5 mb-5">
                  <div className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
                  <span className="text-xs text-gray-500 ml-2" style={{ fontFamily: "var(--app-font-mono)" }}>
                    jadi.ia — editor
                  </span>
                </div>

                <div className="space-y-3" style={{ fontFamily: "var(--app-font-mono)", fontSize: "0.8rem" }}>
                  <p>
                    <span style={{ color: "#00C4A7" }}>você →</span>{" "}
                    <span className="text-gray-300">Crie um formulário de login em React com validação</span>
                  </p>
                  <p>
                    <span style={{ color: "#FFA726" }}>jadi →</span>{" "}
                    <span className="text-gray-400">Vou criar com React Hook Form e Zod...</span>
                  </p>
                  <div
                    className="rounded-xl p-4 mt-2 text-xs leading-6"
                    style={{ background: "rgba(0,137,123,0.08)", border: "1px solid rgba(0,137,123,0.15)" }}
                  >
                    <code style={{ color: "#00C4A7" }}>{`const schema = z.object({`}</code><br />
                    <code style={{ color: "#94a3b8", paddingLeft: "1.5rem" }}>{`email: z.string().email(),`}</code><br />
                    <code style={{ color: "#94a3b8", paddingLeft: "1.5rem" }}>{`password: z.string().min(8),`}</code><br />
                    <code style={{ color: "#00C4A7" }}>{`});`}</code><br />
                    <br />
                    <code style={{ color: "#FFA726" }}>{`export function LoginForm() {`}</code><br />
                    <code style={{ color: "#94a3b8", paddingLeft: "1.5rem" }}>{`const form = useForm({...`}</code>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #060f0d 0%, #0a1a15 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #00897B, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-20%] right-[20%] w-[40vw] h-[40vw] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #FF8C00, transparent 70%)", filter: "blur(80px)" }} />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto"
          >
            <h2
              className="text-5xl md:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              Pronto para criar<br />com IA?
            </h2>
            <p className="text-lg mb-12" style={{ color: "rgba(255,255,255,0.55)" }}>
              Crie sua conta gratuitamente e comece a desenvolver agora mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/registro")}
                className="btn-primary px-12 py-4 text-base"
              >
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/login")}
                className="inline-flex items-center justify-center gap-2 px-12 py-4 text-base font-semibold rounded-full text-white"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(20px)",
                }}
              >
                Já tenho conta
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer
        className="py-8"
        style={{ background: "#030a08", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={logoBranca} alt="Jadi.ia" className="h-7 w-7 object-contain opacity-90" />
              <span className="font-bold text-base text-white" style={{ fontFamily: "var(--app-font-serif)" }}>
                Jadi.ia
              </span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--app-font-mono)" }}>
              {new Date().getFullYear()} Jadi.ia — Plataforma de desenvolvimento com IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
