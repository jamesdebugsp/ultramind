import { motion } from "framer-motion";
import { ArrowRight, Clock, MessageCircle, Star, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-24">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-secondary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto">
          {/* Two column layout on desktop */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Social proof badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-highlight/10 border border-highlight/20 rounded-full text-sm text-highlight font-medium mb-8"
              >
                <div className="flex -space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-highlight text-highlight" />
                  ))}
                </div>
                <span>Nota 4.9 · Usado por 120+ empresas</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.08] tracking-tight mb-7">
                Pare de perder clientes no{" "}
                <span className="text-gradient">WhatsApp</span> todos os dias.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-lg">
                Responda automaticamente, agende clientes e aumente suas vendas sem precisar atender manualmente.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <Button variant="highlight" size="xl" className="shadow-cta" asChild>
                  <Link to={user ? "/dashboard/planos" : "/cadastro"}>
                    Começar agora grátis
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
                <Button variant="hero-secondary" size="xl" asChild>
                  <a href="#demo">Ver demonstração</a>
                </Button>
              </div>

              {/* Microcopy */}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Leva menos de 2 minutos · Sem cartão de crédito
              </p>
            </motion.div>

            {/* Right: WhatsApp Chat Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
              className="relative"
            >
              {/* Phone frame */}
              <div className="relative mx-auto max-w-[320px]">
                {/* Glow behind phone */}
                <div className="absolute -inset-8 bg-secondary/10 rounded-[3rem] blur-2xl" />
                
                <div className="relative bg-card rounded-[2rem] shadow-xl border border-border overflow-hidden">
                  {/* WhatsApp header */}
                  <div className="gradient-primary px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-foreground">AgendePro Bot</p>
                      <p className="text-[11px] text-primary-foreground/70">online</p>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="p-4 space-y-3 bg-muted/30 min-h-[320px]">
                    {/* User message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="bg-highlight/15 border border-highlight/20 rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
                        <p className="text-sm text-foreground">Olá, quero agendar</p>
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">14:02</p>
                      </div>
                    </motion.div>

                    {/* Bot reply */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                      className="flex justify-start"
                    >
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%] shadow-sm">
                        <p className="text-sm text-foreground">
                          Olá! 👋 Seja bem-vindo(a)!
                        </p>
                        <p className="text-sm text-foreground mt-1">
                          Escolha uma opção:
                        </p>
                        <p className="text-sm text-foreground mt-1">1️⃣ Agendar horário</p>
                        <p className="text-sm text-foreground">2️⃣ Ver serviços</p>
                        <p className="text-sm text-foreground">3️⃣ Falar com atendente</p>
                        <p className="text-[10px] text-muted-foreground mt-1">14:02</p>
                      </div>
                    </motion.div>

                    {/* User reply */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.8, duration: 0.4 }}
                      className="flex justify-end"
                    >
                      <div className="bg-highlight/15 border border-highlight/20 rounded-2xl rounded-br-sm px-3.5 py-2">
                        <p className="text-sm text-foreground">1</p>
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">14:03</p>
                      </div>
                    </motion.div>

                    {/* Bot confirmation */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.3, duration: 0.4 }}
                      className="flex justify-start"
                    >
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%] shadow-sm">
                        <p className="text-sm text-foreground">
                          ✅ Perfeito! Escolha o serviço:
                        </p>
                        <p className="text-sm text-foreground mt-1">💈 Corte — R$45</p>
                        <p className="text-sm text-foreground">✂️ Barba — R$30</p>
                        <p className="text-[10px] text-muted-foreground mt-1">14:03</p>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.8, duration: 0.5 }}
                  className="absolute -bottom-3 -right-3 bg-highlight text-highlight-foreground rounded-xl px-3 py-1.5 shadow-cta flex items-center gap-1.5 text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  100% automático
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
            Mais de 120 empresas já automatizam seus atendimentos com o AgendePro
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-40">
            {["StudioBella", "BarberKing", "PetCare+", "SalãoVIP", "ClinicDerma", "NailArt"].map((name) => (
              <span key={name} className="text-lg font-bold text-foreground tracking-tight">{name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
