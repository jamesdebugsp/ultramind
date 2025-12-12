import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 gradient-primary relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-highlight/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para transformar seus agendamentos?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Junte-se a mais de 2.500 negócios que já automatizaram sua gestão com o AgendePro
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="highlight" size="xl" asChild>
              <a href="#planos">
                Começar Grátis — 7 dias
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="xl" 
              className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10"
              asChild
            >
              <a 
                href="https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20AgendePro" 
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
