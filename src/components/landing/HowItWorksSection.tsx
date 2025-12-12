import { motion } from "framer-motion";
import { ClipboardList, Send, Calendar, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Configure seu negócio",
    description: "Adicione seus serviços, profissionais e horários em menos de 3 minutos.",
    color: "bg-highlight/10 text-highlight",
  },
  {
    icon: Send,
    title: "Compartilhe seu link",
    description: "Divulgue sua página de agendamentos no WhatsApp, Instagram e redes sociais.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Calendar,
    title: "Receba agendamentos",
    description: "Clientes agendam online e você recebe confirmação automática no WhatsApp.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Três passos simples para automatizar seus agendamentos e nunca mais perder clientes
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
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card rounded-2xl p-8 border border-border shadow-card hover:shadow-lg transition-shadow duration-300">
                {/* Step number */}
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
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
          className="flex items-center justify-center gap-3 mt-12 text-emerald-600"
        >
          <CheckCircle2 className="w-6 h-6" />
          <span className="font-semibold">Pronto! Seu negócio está automatizado.</span>
        </motion.div>
      </div>
    </section>
  );
}
