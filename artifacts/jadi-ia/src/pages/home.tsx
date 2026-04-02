import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Code2, Zap, Globe, Smartphone, Lock, GitBranch, Terminal, Cpu } from "lucide-react";
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
  { name: "JavaScript", color: "#f7df1e" },
  { name: "TypeScript", color: "#3178c6" },
  { name: "Python", color: "#3776ab" },
  { name: "React", color: "#61dafb" },
  { name: "Vue", color: "#42b883" },
  { name: "Node.js", color: "#339933" },
  { name: "Next.js", color: "#000000" },
  { name: "HTML/CSS", color: "#e34f26" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative overflow-hidden bg-background py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex justify-center mb-8">
              <motion.img
                src={theme === "dark" ? logoBranca : logo}
                alt="Jadi.ia"
                className="h-24 w-24 object-contain"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Crie com IA.{" "}
              <span className="text-primary">Construa mais rápido.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Jadi.ia é a plataforma de desenvolvimento assistida por IA para criar sites, sistemas,
              web apps e aplicativos mobile diretamente no seu navegador.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/registro")}
                data-testid="button-get-started"
                className="text-base px-8"
              >
                Comece grátis agora
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/login")}
                data-testid="button-login-home"
                className="text-base px-8"
              >
                Entrar na plataforma
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-4">Suporte a todas as principais linguagens</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {languages.map((lang, i) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background text-sm"
              >
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: lang.color }} />
                {lang.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para criar</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
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
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Cpu className="h-6 w-6 text-primary" />
              <span className="text-primary font-semibold">Powered by Groq AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">IA que entende código de verdade</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Converse com a IA para gerar componentes, resolver bugs, refatorar código e criar projetos completos
              a partir de uma simples descrição em português.
            </p>
            <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-4 text-left font-mono text-sm">
              <div className="flex gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-destructive/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <p className="text-muted-foreground"><span className="text-primary">usuario:</span> Crie um formulário de login em React com validacao</p>
              <p className="mt-2 text-muted-foreground"><span className="text-green-400">jadi:</span> Claro! Vou criar um formulário de login completo com React Hook Form e validação...</p>
              <div className="mt-2 bg-muted/50 rounded p-2 text-xs">
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

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground text-lg mb-8">
              Crie sua conta gratuitamente e comece a desenvolver com IA agora mesmo.
            </p>
            <Button size="lg" onClick={() => setLocation("/registro")} className="text-base px-10">
              Criar conta gratuita
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src={theme === "dark" ? logoBranca : logo}
                alt="Jadi.ia"
                className="h-6 w-6 object-contain"
              />
              <span className="font-semibold">Jadi.ia</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} Jadi.ia — Plataforma de desenvolvimento com IA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
