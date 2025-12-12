import { motion } from "framer-motion";
import { 
  Clock, 
  Bell, 
  Users, 
  BarChart3, 
  Globe, 
  MessageSquare,
  QrCode,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Página Pública de Agendamentos",
    description: "Link exclusivo para seus clientes agendarem 24 horas por dia, 7 dias por semana.",
  },
  {
    icon: MessageSquare,
    title: "Bot de WhatsApp Automático",
    description: "Confirmações, lembretes e reagendamentos enviados automaticamente.",
  },
  {
    icon: Bell,
    title: "Lembretes Inteligentes",
    description: "Notificações 24h e 1h antes do horário para reduzir faltas.",
  },
  {
    icon: Users,
    title: "Multi-profissionais",
    description: "Gerencie a agenda de todos os profissionais do seu estabelecimento.",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Configure horários de funcionamento e intervalos personalizados.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Completo",
    description: "Métricas de agendamentos, faltas e serviços mais populares.",
  },
  {
    icon: QrCode,
    title: "QR Code Exclusivo",
    description: "Gere QR codes para divulgar sua página de agendamentos.",
  },
  {
    icon: Smartphone,
    title: "100% Mobile",
    description: "Interface otimizada para celular, tanto para você quanto seus clientes.",
  },
];

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">crescer</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para automatizar seu dia a dia e encantar seus clientes
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group"
            >
              <div className="h-full bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-card hover:border-highlight/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-highlight/10 text-highlight flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
