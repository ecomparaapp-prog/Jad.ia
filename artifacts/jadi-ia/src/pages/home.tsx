import { useLocation } from "wouter";
import {
  Code2, Zap, Globe, Smartphone, GitBranch,
  ArrowRight, Bot, Layers, Terminal, Shield,
  BarChart3, Users, FolderOpen, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { SurrealHead } from "@/components/SurrealHead";
import {
  JSLogo, TSLogo, PythonLogo, ReactLogo,
  VueLogo, NodeLogo, NextLogo, HTMLLogo
} from "@/components/TechLogos";

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
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] }
  }),
};

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden">

      {/* ══════════════════════════════════════════
          HERO — dark, surreal 3D head centered
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #050505 0%, #080808 50%, #0a0a0a 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Ambient orbs — neutral dark palette */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(80,0,120,0.12) 0%, transparent 70%)", filter: "blur(100px)" }} />
          <div className="absolute bottom-[-10%] right-[-8%] w-[45vw] h-[45vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(180,60,0,0.10) 0%, transparent 70%)", filter: "blur(120px)" }} />
          <div className="absolute top-[25%] right-[5%] w-[30vw] h-[30vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,80,180,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="flex flex-col items-center text-center" style={{ minHeight: "90vh", justifyContent: "center" }}>

            {/* Surreal 3D Head — TOP */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg mx-auto relative mb-6"
              style={{ height: "460px" }}
            >
              {/* Floating stat cards */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute left-0 top-1/4 hidden lg:block"
                style={{ zIndex: 10 }}
              >
                <div
                  className="p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "1.25rem",
                    backdropFilter: "blur(20px)",
                    minWidth: "100px",
                  }}
                >
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--app-font-serif)" }}>50K+</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Projetos<br />Criados</p>
                </div>
              </motion.div>

              <SurrealHead className="w-full h-full" />

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute right-0 top-1/3 hidden lg:block"
                style={{ zIndex: 10 }}
              >
                <div
                  className="p-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: "1.25rem",
                    backdropFilter: "blur(20px)",
                    minWidth: "100px",
                  }}
                >
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--app-font-serif)" }}>10K+</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Devs<br />Ativos</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Headline — single line */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-bold text-white leading-tight mb-4 whitespace-nowrap"
              style={{
                fontFamily: "var(--app-font-serif)",
                letterSpacing: "-0.02em",
                fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
              }}
            >
              Jad.ia{" "}
              <span style={{
                background: "linear-gradient(135deg, #00C4A7 0%, #FF6B35 50%, #FF00CC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Vibe coding
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-gray-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed"
              style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}
            >
              Descreva o que quer construir em português. A jad.ia gera código em tempo real, cria projetos completos e evolui junto com você.
            </motion.p>

            {/* CTA Buttons — side by side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,196,167,0.35)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/registro")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #00897B 0%, #26C6B0 100%)",
                  boxShadow: "0 0 30px rgba(0,137,123,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  fontFamily: "Plus Jakarta Sans, var(--app-font-sans)",
                }}
              >
                Começar agora
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(255,107,53,0.55)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/login")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #E65100 0%, #FF6B35 60%, #FF8C42 100%)",
                  boxShadow: "0 0 28px rgba(255,107,53,0.40), inset 0 1px 0 rgba(255,255,255,0.18)",
                  fontFamily: "var(--app-font-sans)",
                }}
              >
                Entrar na plataforma
              </motion.button>
            </motion.div>

          </div>
        </div>

        {/* Ticker */}
        <div
          className="border-t border-b overflow-hidden py-4"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" }}
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--app-font-mono)" }}>
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ background: i % 3 === 0 ? "#00C4A7" : i % 3 === 1 ? "#FF6B35" : "#CC00FF" }}
                />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TECH LOGOS
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
          SERVICES — small glassmorphism cards
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
            <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: "var(--app-font-mono)", color: "#00897B" }}>
              O que a jad.ia faz
            </p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--app-font-serif)" }}>
              Nossos Serviços
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto" style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}>
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
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                <div
                  className="h-full flex flex-col p-5"
                  style={{
                    borderRadius: "1.5rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = s.accent === "primary" ? "rgba(0,196,167,0.25)" : "rgba(255,107,53,0.25)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0 text-white"
                    style={{
                      background: s.accent === "primary"
                        ? "linear-gradient(135deg, #00695C 0%, #26A69A 100%)"
                        : "linear-gradient(135deg, #E65100 0%, #FFA726 100%)",
                      boxShadow: s.accent === "primary"
                        ? "0 4px 16px rgba(38,166,154,0.35)"
                        : "0 4px 16px rgba(255,140,0,0.30)",
                    }}
                  >
                    <s.icon className="h-4.5 w-4.5" strokeWidth={1.5} style={{ height: "18px", width: "18px" }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}>
                    {s.desc}
                  </p>
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
        style={{ background: "linear-gradient(135deg, #020E0A 0%, #030D0A 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,137,123,0.15), transparent)" }} />
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
                  style={{ background: i % 2 === 0 ? "linear-gradient(135deg, #00695C, #26A69A)" : "linear-gradient(135deg, #E65100, #FFA726)" }}
                >
                  <s.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>{s.value}</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "var(--app-font-mono)" }}>{s.label}</p>
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
              <p className="text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}>
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
                      style={{ background: "linear-gradient(135deg, #00695C, #26A69A)", boxShadow: "0 4px 16px rgba(38,166,154,0.3)" }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium" style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}>{text}</span>
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
                className="p-6 text-left"
                style={{
                  background: "rgba(4,12,10,0.95)",
                  border: "1px solid rgba(0,137,123,0.18)",
                  borderRadius: "2rem",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                }}
              >
                <div className="flex gap-1.5 mb-5">
                  <div className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "#FEBC2E" }} />
                  <div className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
                  <span className="text-xs text-gray-500 ml-2" style={{ fontFamily: "var(--app-font-mono)" }}>
                    jad.ia — editor
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
                    style={{ background: "rgba(0,137,123,0.07)", border: "1px solid rgba(0,137,123,0.13)" }}
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
        style={{ background: "linear-gradient(160deg, #030808 0%, #060f0d 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #00897B, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-20%] right-[20%] w-[40vw] h-[40vw] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #FF6B35, transparent 70%)", filter: "blur(80px)" }} />
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
              className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              Pronto para criar com IA?
            </h2>
            <p className="text-gray-400 mb-10 leading-relaxed" style={{ fontFamily: "Plus Jakarta Sans, var(--app-font-sans)" }}>
              Comece agora, gratuitamente. Sem cartão de crédito, sem complicação.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(0,196,167,0.4)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/registro")}
              className="inline-flex items-center gap-2 px-12 py-4 text-base font-semibold rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #00897B 0%, #26C6B0 60%, #00897B 100%)",
                backgroundSize: "200% 100%",
                boxShadow: "0 0 40px rgba(0,137,123,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                fontFamily: "Plus Jakarta Sans, var(--app-font-sans)",
              }}
            >
              Começar gratuitamente
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </motion.button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
