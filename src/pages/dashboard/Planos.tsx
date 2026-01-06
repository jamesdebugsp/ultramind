import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Zap,
  Star,
  Loader2,
  MessageSquare,
  Bell,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";

const plans = [
  {
    id: "basic" as SubscriptionPlan,
    name: "Essencial",
    price: 49,
    description: "Ideal para começar",
    icon: Star,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    features: [
      { text: "Até 50 agendamentos/mês", included: true },
      { text: "Página de agendamento", included: true },
      { text: "QR Code personalizado", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "WhatsApp automático", included: false },
      { text: "Lembretes automáticos", included: false },
      { text: "Relatórios avançados", included: false },
    ],
  },
  {
    id: "pro" as SubscriptionPlan,
    name: "Profissional",
    price: 99,
    description: "Mais popular",
    icon: Zap,
    color: "text-highlight",
    bgColor: "bg-highlight/10",
    popular: true,
    features: [
      { text: "Até 200 agendamentos/mês", included: true },
      { text: "Página de agendamento", included: true },
      { text: "QR Code personalizado", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "WhatsApp automático", included: true },
      { text: "Lembretes automáticos", included: true },
      { text: "Relatórios avançados", included: false },
    ],
  },
  {
    id: "premium" as SubscriptionPlan,
    name: "Master",
    price: 199,
    description: "Para profissionais",
    icon: Crown,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    features: [
      { text: "Agendamentos ilimitados", included: true },
      { text: "Página de agendamento", included: true },
      { text: "QR Code personalizado", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "WhatsApp automático", included: true },
      { text: "Lembretes automáticos", included: true },
      { text: "Relatórios avançados", included: true },
    ],
  },
];

export default function Planos() {
  const { subscription, loading, changePlan } = useSubscription();

  const handleChangePlan = async (plan: SubscriptionPlan) => {
    if (subscription?.plan === plan) return;
    await changePlan(plan);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-highlight" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Planos & Preços
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Faça upgrade ou downgrade a qualquer momento.
          </p>
          {subscription && (
            <div className="mt-4 inline-flex items-center gap-2">
              <span className="text-muted-foreground">Seu plano atual:</span>
              <Badge variant="highlight" className="text-sm">
                {subscription.plan === 'basic' ? 'Essencial' : subscription.plan === 'pro' ? 'Profissional' : 'Master'}
              </Badge>
              {subscription.status === 'trial' && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Trial
                </Badge>
              )}
            </div>
          )}
        </motion.div>

        {/* Features Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Agendamentos</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.max_appointments === -1 ? 'Ilimitado' : `${subscription?.max_appointments || 50}/mês`}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${subscription?.whatsapp_enabled ? 'bg-emerald-500/10' : 'bg-muted'} flex items-center justify-center`}>
                <MessageSquare className={`w-5 h-5 ${subscription?.whatsapp_enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.whatsapp_enabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${subscription?.reminders_enabled ? 'bg-emerald-500/10' : 'bg-muted'} flex items-center justify-center`}>
                <Bell className={`w-5 h-5 ${subscription?.reminders_enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Lembretes</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.reminders_enabled ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Status</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {subscription?.status || 'trial'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card
                  variant="elevated"
                  className={`relative h-full ${plan.popular ? 'ring-2 ring-highlight' : ''} ${isCurrentPlan ? 'border-highlight bg-highlight/5' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="highlight" className="px-3">
                        Mais popular
                      </Badge>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3">
                        Plano atual
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div className={`w-14 h-14 mx-auto rounded-xl ${plan.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-7 h-7 ${plan.color}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-foreground">R${plan.price}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            feature.included ? 'bg-emerald-500/10' : 'bg-muted'
                          }`}>
                            <Check className={`w-3 h-3 ${feature.included ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          </div>
                          <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isCurrentPlan ? "outline" : plan.popular ? "hero" : "default"}
                      className="w-full"
                      disabled={isCurrentPlan}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      {isCurrentPlan ? 'Plano atual' : subscription?.plan && plans.findIndex(p => p.id === subscription.plan) > plans.findIndex(p => p.id === plan.id) ? 'Fazer downgrade' : 'Fazer upgrade'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-xl font-bold text-foreground text-center mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-muted-foreground text-sm">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">O período de trial inclui todas as funcionalidades?</h3>
              <p className="text-muted-foreground text-sm">
                O trial de 14 dias inclui as funcionalidades do plano Essencial. Faça upgrade para testar recursos avançados.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Como funciona o WhatsApp automático?</h3>
              <p className="text-muted-foreground text-sm">
                Nos planos Pro e Master, o sistema envia automaticamente confirmações e lembretes via WhatsApp para seus clientes.
              </p>
            </Card>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
