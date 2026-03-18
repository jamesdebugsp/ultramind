import { motion } from "framer-motion";
import { ClipboardList, Send, Calendar, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Configure seu negócio",
    description: "Adicione seus serviços, profissionais e horários em menos de 3 minutos.",
  },
  {
    icon: Send,
    title: "Compartilhe seu link",
    description: "Divulgue sua página de agendamentos no WhatsApp, Instagram e redes sociais.",
  },
  {
    icon: Calendar,
    title: "Receba agendamentos",
    description: "Clientes agendam online e você recebe confirmação automática no WhatsApp.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-28 bg-card">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">Como funciona</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-5">
            Comece em 3 passos simples
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Automatize seus agendamentos e nunca mais perca clientes
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-14 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="relative bg-background rounded-2xl p-8 border border-border shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                {/* Step number */}
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                  {index + 1}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Success indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-center justify-center gap-3 mt-14 text-highlight"
        >
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-semibold text-lg">Pronto! Seu negócio está automatizado.</span>
        </motion.div>
      </div>
    </section>
  );
}
