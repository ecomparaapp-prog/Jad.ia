import { useLocation } from "wouter";
import {
  Code2, Zap, Globe, Smartphone, GitBranch,
  ArrowRight, Bot, Layers, Terminal, Shield,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { SurrealHead } from "@/components/SurrealHead";
import {
  JSLogo, TSLogo, PythonLogo, ReactLogo,
  VueLogo, NodeLogo, NextLogo, HTMLLogo
} from "@/components/TechLogos";

const BG = "#F4F5F7";
const BG_ALT = "#ECEEF2";
const BORDER = "rgba(0,0,0,0.07)";

const services = [
  { icon: Bot, title: "Vibe Coding IA", desc: "Descreva em português e a IA gera código em tempo real.", accent: "primary" },
  { icon: Globe, title: "Sites & Web Apps", desc: "React, Vue, Next.js e HTML/CSS com preview ao vivo.", accent: "primary" },
  { icon: Layers, title: "Analisador de Stack", desc: "IA recomenda a melhor stack para o seu projeto.", accent: "primary" },
  { icon: Shield, title: "Gerenciador de Secrets", desc: "Variáveis de ambiente e API keys com total segurança.", accent: "primary" },
  { icon: Code2, title: "Editor Inteligente", desc: "Syntax highlighting, autocomplete e sugestões da IA.", accent: "secondary" },
  { icon: Smartphone, title: "Apps Mobile", desc: "React Native com suporte completo de IA para mobile.", accent: "secondary" },
  { icon: Terminal, title: "Geração de Código", desc: "Setup, fix e refactor de qualquer projeto em segundos.", accent: "secondary" },
  { icon: GitBranch, title: "Controle de Versão", desc: "Integração com GitHub para versionamento e colaboração.", accent: "secondary" },
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
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden" style={{ background: BG }}>

      {/* ══════════════════════════════════════════
          HERO — light clean
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: BG, minHeight: "100vh" }}
      >
        {/* Ambient orbs — subtle light palette */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,196,167,0.08) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40vw] h-[40vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)", filter: "blur(100px)" }} />
          <div className="absolute top-[30%] right-[10%] w-[25vw] h-[25vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,137,123,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="flex flex-col items-center text-center" style={{ minHeight: "90vh", justifyContent: "center" }}>

            {/* Surreal 3D Head */}
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
                    background: "rgba(255,255,255,0.85)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "1.25rem",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    minWidth: "100px",
                  }}
                >
                  <p className="text-2xl font-bold text-gray-800">50K+</p>
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
                    background: "rgba(255,255,255,0.85)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "1.25rem",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    minWidth: "100px",
                  }}
                >
                  <p className="text-2xl font-bold text-gray-800">10K+</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Devs<br />Ativos</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-bold leading-tight mb-4 whitespace-nowrap text-gray-900"
              style={{
                fontFamily: "var(--app-font-serif)",
                letterSpacing: "-0.02em",
                fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
              }}
            >
              Jad.ia{" "}
              <span style={{
                background: "linear-gradient(135deg, #00897B 0%, #FF6B35 50%, #FF00CC 100%)",
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
              className="text-gray-500 text-base md:text-lg max-w-xl mb-8 leading-relaxed"
            >
              Descreva o que quer construir em português. A jad.ia gera código em tempo real, cria projetos completos e evolui junto com você.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,137,123,0.30)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/registro")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #00897B 0%, #26C6B0 100%)",
                  boxShadow: "0 0 24px rgba(0,137,123,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                Começar agora
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(255,107,53,0.40)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation("/login")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #E65100 0%, #FF6B35 60%, #FF8C42 100%)",
                  boxShadow: "0 0 22px rgba(255,107,53,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
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
          style={{ borderColor: BORDER, background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)" }}
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            className="flex gap-8 whitespace-nowrap"
          >
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-400" style={{ fontFamily: "var(--app-font-mono)" }}>
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
      <section style={{ background: BG_ALT, paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div className="container mx-auto px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs uppercase tracking-widest text-gray-400 mb-8"
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
                <div
                  className="flex flex-col items-center gap-2 px-5 py-4"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${BORDER}`,
                    borderRadius: "1.25rem",
                    minWidth: "90px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  }}
                >
                  <Logo size={32} />
                  <span className="text-xs text-gray-400 font-medium" style={{ fontFamily: "var(--app-font-mono)" }}>{name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          SERVICES — 4×2 grid, row 1 verde / row 2 laranja
      ══════════════════════════════════ */}
      <section style={{ background: BG_ALT, paddingTop: "2.5rem", paddingBottom: "2.5rem" }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {services.map((s, i) => {
              const isGreen = s.accent === "primary";
              const accentColor = isGreen ? "#00897B" : "#E65100";
              const accentBg   = isGreen
                ? "linear-gradient(135deg, #00695C 0%, #26A69A 100%)"
                : "linear-gradient(135deg, #E65100 0%, #FFA726 100%)";
              const accentHover = isGreen ? "rgba(0,137,123,0.22)" : "rgba(255,107,53,0.22)";
              const subtleBg    = isGreen ? "rgba(0,137,123,0.04)" : "rgba(230,81,0,0.04)";

              return (
                <motion.div
                  key={s.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  style={{ height: "100%" }}
                >
                  <div
                    className="flex flex-col gap-3 p-4 h-full"
                    style={{
                      borderRadius: "1.1rem",
                      background: `rgba(255,255,255,0.92)`,
                      border: `1px solid ${BORDER}`,
                      borderLeft: `3px solid ${accentColor}`,
                      boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
                      transition: "box-shadow 0.18s, background 0.18s",
                      minHeight: "110px",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = subtleBg;
                      e.currentTarget.style.boxShadow = `0 6px 24px ${accentHover}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                      e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.04)";
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white"
                        style={{ background: accentBg, boxShadow: `0 3px 10px ${accentHover}` }}
                      >
                        <s.icon style={{ height: "16px", width: "16px" }} strokeWidth={1.6} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                        {s.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed" style={{ fontFamily: "var(--app-font-sans)" }}>
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CODE DEMO
      ══════════════════════════════════ */}
      <section style={{ background: BG, paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl font-bold mb-5 leading-tight text-gray-900" style={{ fontFamily: "var(--app-font-serif)" }}>
                IA que entende<br />código de verdade
              </h2>
              <p className="text-gray-400 leading-relaxed mb-8">
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
                      style={{ background: "linear-gradient(135deg, #00695C, #26A69A)", boxShadow: "0 4px 12px rgba(38,166,154,0.22)" }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{text}</span>
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
                  background: "#1a1f2e",
                  border: `1px solid rgba(0,137,123,0.20)`,
                  borderRadius: "2rem",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
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
                    style={{ background: "rgba(0,137,123,0.10)", border: "1px solid rgba(0,137,123,0.15)" }}
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
          CTA — light version
      ══════════════════════════════════ */}
      <section style={{ background: BG_ALT, paddingTop: "6rem", paddingBottom: "6rem", position: "relative", overflow: "hidden" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,137,123,0.08), transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-[-10%] right-[20%] w-[30vw] h-[30vw] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,107,53,0.07), transparent 70%)", filter: "blur(60px)" }} />
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
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              Pronto para criar com IA?
            </h2>
            <p className="text-gray-400 mb-10 leading-relaxed">
              Comece agora, gratuitamente. Sem cartão de crédito, sem complicação.
            </p>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,137,123,0.30)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/registro")}
              className="inline-flex items-center gap-2 px-12 py-4 text-base font-semibold rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #00897B 0%, #26C6B0 60%, #00897B 100%)",
                backgroundSize: "200% 100%",
                boxShadow: "0 0 32px rgba(0,137,123,0.28), inset 0 1px 0 rgba(255,255,255,0.15)",
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
