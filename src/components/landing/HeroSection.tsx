import { motion } from "framer-motion";
import { Calendar, MessageCircle, Instagram, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-20">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-highlight/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-highlight/5 to-transparent rounded-full" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Promo badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <Badge variant="promo" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Promoção válida para os primeiros 100 clientes
            </Badge>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Automatize seus agendamentos e transforme{" "}
            <span className="text-gradient">WhatsApp + Instagram</span>{" "}
            em lucro
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Sistema completo de agendamentos para salões, barbearias, pet shops e comércios. 
            Bot automático, página pública e gestão integrada.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button variant="hero" size="xl" asChild>
              <a href="#planos">
                Começar Grátis — 7 dias
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button variant="hero-secondary" size="xl" asChild>
              <a href="#demo">Ver Demonstração</a>
            </Button>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
              <Calendar className="w-4 h-4 text-highlight" />
              <span className="text-sm font-medium text-foreground">Agendamento Online</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
              <MessageCircle className="w-4 h-4 text-highlight" />
              <span className="text-sm font-medium text-foreground">Bot WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
              <Instagram className="w-4 h-4 text-highlight" />
              <span className="text-sm font-medium text-foreground">Integração Instagram</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image/Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              <div className="bg-secondary/30 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-background/50 rounded-md text-xs text-muted-foreground">
                    agende.ultramind.com/seu-estabelecimento
                  </div>
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-accent flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Sua Página de Agendamentos</h3>
                  <p className="text-muted-foreground">Clientes agendam 24/7, você recebe no WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Company tag */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-sm text-muted-foreground font-medium">
          <span className="text-highlight">UltraMind Solutions</span> — AgendePro
        </p>
      </div>
    </section>
  );
}
