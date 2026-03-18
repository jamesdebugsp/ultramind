import { motion } from "framer-motion";
import { 
  MessageSquare,
  CalendarCheck,
  Zap,
  TrendingUp
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Responda clientes automaticamente",
    description: "Bot inteligente no WhatsApp que responde, agenda e confirma sem você precisar fazer nada.",
  },
  {
    icon: CalendarCheck,
    title: "Agendamentos 24h por dia",
    description: "Página pública com link exclusivo. Seus clientes agendam a qualquer hora, de qualquer lugar.",
  },
  {
    icon: Zap,
    title: "Integração com WhatsApp e Instagram",
    description: "Conecte seus canais e centralize tudo. Confirmações e lembretes enviados automaticamente.",
  },
  {
    icon: TrendingUp,
    title: "Aumente suas vendas sem esforço",
    description: "Reduza faltas em 80%, preencha horários vagos e acompanhe tudo pelo dashboard.",
  },
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-28 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-sm font-semibold text-secondary uppercase tracking-widest mb-3">Benefícios</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-5">
            Tudo que você precisa para{" "}
            <span className="text-gradient">crescer</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para automatizar seu dia a dia e encantar seus clientes
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full bg-card rounded-2xl p-8 border border-border shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
