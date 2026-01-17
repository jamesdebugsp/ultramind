import { motion } from "framer-motion";
import { Check, Sparkles, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Essencial",
    icon: Sparkles,
    price: 49,
    originalPrice: 89,
    savings: 40,
    description: "Perfeito para começar a automatizar",
    cta: "Começar agora — Teste grátis 7 dias",
    features: [
      "Página pública de agendamentos",
      "Até 100 agendamentos/mês",
      "Confirmação por WhatsApp",
      "1 profissional",
      "Suporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Profissional",
    icon: Star,
    price: 99,
    originalPrice: 149,
    savings: 50,
    description: "Ideal para negócios em crescimento",
    cta: "Liberar versão PRO",
    features: [
      "Tudo do Essencial +",
      "Agendamentos ilimitados",
      "Bot WhatsApp completo",
      "Até 5 profissionais",
      "Lembretes automáticos",
      "Dashboard de métricas",
      "Integração Instagram",
      "Suporte prioritário",
    ],
    highlighted: true,
  },
  {
    name: "Master",
    icon: Crown,
    price: 199,
    originalPrice: 299,
    savings: 100,
    description: "Para quem quer dominar o mercado",
    cta: "Quero o Master — Crescer Agora",
    features: [
      "Tudo do Profissional +",
      "Profissionais ilimitados",
      "Múltiplas unidades",
      "Automação completa",
      "Mensagens personalizadas",
      "Relatórios avançados",
      "API de integração",
      "Suporte VIP 24/7",
    ],
    highlighted: false,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanClick = () => {
    if (user) {
      navigate("/dashboard/planos");
    } else {
      navigate("/cadastro");
    }
  };

  return (
    <section id="planos" className="py-24 bg-background">
      <div className="container px-4">
        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="bg-gradient-to-r from-highlight/10 via-accent/10 to-highlight/10 border border-highlight/20 rounded-2xl p-4 text-center">
            <p className="text-sm md:text-base font-semibold text-foreground">
              🔥 <span className="text-highlight">Promoção válida para os primeiros 100 clientes</span> — após isso os preços voltam ao normal
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos & Preços
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Todos incluem 7 dias grátis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="promo" className="px-4 py-1.5">
                    Mais popular
                  </Badge>
                </div>
              )}
              
              <Card 
                variant={plan.highlighted ? "highlight" : "elevated"}
                className={`h-full flex flex-col ${plan.highlighted ? "scale-105" : ""}`}
              >
                <div className="p-8 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      plan.highlighted ? "gradient-accent" : "bg-muted"
                    }`}>
                      <plan.icon className={`w-6 h-6 ${plan.highlighted ? "text-primary-foreground" : "text-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-foreground">
                        R${plan.price}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-muted-foreground line-through">
                        R${plan.originalPrice}
                      </span>
                      <Badge variant="success" className="text-xs">
                        Economia de R${plan.savings}
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-highlight shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button 
                    variant={plan.highlighted ? "hero" : "outline"} 
                    size="lg" 
                    className="w-full cursor-pointer"
                    onClick={handlePlanClick}
                    aria-label={`Assinar plano ${plan.name} por R$${plan.price} por mês`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
