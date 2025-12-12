import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Carla Mendes",
    role: "Proprietária, Salão Beleza Pura",
    content: "Reduzi 80% das faltas com os lembretes automáticos. Meus clientes adoram agendar pelo link!",
    rating: 5,
    avatar: "CM",
  },
  {
    name: "Ricardo Santos",
    role: "Barbeiro, Barbearia Premium",
    content: "Nunca mais perdi cliente por demora no WhatsApp. O bot responde na hora e já agenda.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Patrícia Lima",
    role: "Dona, Pet Shop Amigo Fiel",
    content: "Organização total! Consigo ver todos os banhos e tosas do dia em um só lugar.",
    rating: 5,
    avatar: "PL",
  },
  {
    name: "Fernando Costa",
    role: "Manicure Autônoma",
    content: "Comecei a parecer mais profissional. Minhas clientes elogiam o sistema de agendamento.",
    rating: 5,
    avatar: "FC",
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de negócios já transformaram seus agendamentos
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="elevated" className="h-full p-6">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-highlight/30 mb-4" />

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: "2.500+", label: "Negócios ativos" },
            { value: "150mil", label: "Agendamentos/mês" },
            { value: "98%", label: "Satisfação" },
            { value: "80%", label: "Redução de faltas" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-extrabold text-highlight mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
