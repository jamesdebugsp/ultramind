import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  Crown,
  Zap,
  Star,
  Loader2,
  MessageSquare,
  Bell,
  Calendar,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSubscription, SubscriptionPlan } from "@/hooks/useSubscription";
import { useCredits, CREDIT_PACKAGES, PLAN_CREDITS } from "@/hooks/useCredits";
import { PaymentModal } from "@/components/payments/PaymentModal";

const plans = [
  {
    id: "basic" as SubscriptionPlan,
    name: "Essencial",
    price: 49,
    description: "Ideal para começar",
    icon: Star,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    credits: 0,
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
    credits: 600,
    features: [
      { text: "Até 200 agendamentos/mês", included: true },
      { text: "Página de agendamento", included: true },
      { text: "QR Code personalizado", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "WhatsApp automático", included: true },
      { text: "Lembretes automáticos", included: true },
      { text: "600 créditos/mês", included: true },
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
    credits: 2500,
    features: [
      { text: "Agendamentos ilimitados", included: true },
      { text: "Página de agendamento", included: true },
      { text: "QR Code personalizado", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "WhatsApp inteligente", included: true },
      { text: "Agendamento via WhatsApp", included: true },
      { text: "2.500 créditos/mês", included: true },
    ],
  },
];

export default function Planos() {
  const { subscription, loading, refetch: refetchSubscription } = useSubscription();
  const { creditInfo, loading: creditsLoading, getUsagePercentage, packages, refetch: refetchCredits } = useCredits();
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'plan' | 'credits'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium'>('basic');
  const [selectedPackage, setSelectedPackage] = useState<'pack_300' | 'pack_800' | 'pack_2000'>('pack_300');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDescription, setPaymentDescription] = useState('');

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (subscription?.plan === plan) return;
    const planData = plans.find(p => p.id === plan);
    if (!planData) return;
    
    setPaymentType('plan');
    setSelectedPlan(plan);
    setPaymentAmount(planData.price);
    setPaymentDescription(`Plano ${planData.name}`);
    setPaymentModalOpen(true);
  };

  const handleBuyCredits = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    setPaymentType('credits');
    setSelectedPackage(packageId as 'pack_300' | 'pack_800' | 'pack_2000');
    setPaymentAmount(pkg.price);
    setPaymentDescription(`${pkg.credits} créditos WhatsApp`);
    setPaymentModalOpen(true);
  };

  const handleOpenCreditsModal = () => {
    // Default to the most popular package
    const popularPkg = packages.find(p => p.popular) || packages[0];
    if (popularPkg) {
      setPaymentType('credits');
      setSelectedPackage(popularPkg.id as 'pack_300' | 'pack_800' | 'pack_2000');
      setPaymentAmount(popularPkg.price);
      setPaymentDescription(`${popularPkg.credits} créditos WhatsApp`);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentSuccess = () => {
    refetchSubscription();
    refetchCredits();
  };

  if (loading || creditsLoading) {
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
          className="text-center mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Planos & Créditos
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Cada mensagem WhatsApp consome 1 crédito.
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

        {/* Credits Card */}
        {creditInfo && (subscription?.plan === 'pro' || subscription?.plan === 'premium') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <Card variant="highlight" className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-highlight" />
                    <h3 className="font-semibold text-lg text-foreground">Seus Créditos WhatsApp</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{creditInfo.availableCredits}</p>
                      <p className="text-sm text-muted-foreground">Disponíveis</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{creditInfo.creditsUsed}</p>
                      <p className="text-sm text-muted-foreground">Usados este mês</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{creditInfo.extraCredits}</p>
                      <p className="text-sm text-muted-foreground">Extras (não expiram)</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consumo mensal</span>
                      <span className="text-foreground">{getUsagePercentage()}%</span>
                    </div>
                    <Progress value={getUsagePercentage()} className="h-2" />
                  </div>
                </div>
                <div>
                  <Button 
                    variant="hero" 
                    onClick={handleOpenCreditsModal}
                    aria-label="Comprar créditos WhatsApp extras"
                    className="cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Comprar Créditos
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Features Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Créditos/mês</p>
                <p className="text-sm text-muted-foreground">
                  {PLAN_CREDITS[subscription?.plan || 'basic'] || 0}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
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
                  className={`relative h-full cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-within:ring-2 focus-within:ring-highlight ${plan.popular ? 'ring-2 ring-highlight' : ''} ${isCurrentPlan ? 'border-highlight bg-highlight/5' : ''}`}
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Selecionar plano ${plan.name} por R$${plan.price} por mês`}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isCurrentPlan) {
                      e.preventDefault();
                      handleSelectPlan(plan.id);
                    }
                  }}
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
                    {plan.credits > 0 && (
                      <div className="mt-2">
                        <Badge className="bg-highlight/10 text-highlight border-highlight/20">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {plan.credits} créditos/mês
                        </Badge>
                      </div>
                    )}
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
                      className="w-full cursor-pointer"
                      disabled={isCurrentPlan}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.id);
                      }}
                      aria-label={isCurrentPlan ? 'Este é seu plano atual' : `Assinar plano ${plan.name}`}
                    >
                      {isCurrentPlan ? 'Plano atual' : subscription?.plan && plans.findIndex(p => p.id === subscription.plan) > plans.findIndex(p => p.id === plan.id) ? 'Fazer downgrade' : 'Assinar agora'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Credit Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-xl font-bold text-foreground text-center mb-6">
            Créditos Avulsos
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Compre créditos extras que não expiram. Use quando precisar de mais mensagens!
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id}
                variant="elevated" 
                className={`p-6 text-center cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-within:ring-2 focus-within:ring-highlight ${pkg.popular ? 'ring-2 ring-highlight' : ''}`}
                onClick={() => handleBuyCredits(pkg.id)}
                role="button"
                tabIndex={0}
                aria-label={`Comprar ${pkg.credits} créditos por R$${pkg.price}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBuyCredits(pkg.id);
                  }
                }}
              >
                {pkg.popular && (
                  <Badge variant="highlight" className="mb-4">
                    Mais vendido
                  </Badge>
                )}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-highlight" />
                  <span className="text-2xl font-bold text-foreground">{pkg.credits}</span>
                </div>
                <p className="text-muted-foreground mb-4">créditos</p>
                <p className="text-xl font-bold text-foreground mb-4">R${pkg.price}</p>
                <Button 
                  variant={pkg.popular ? "hero" : "outline"} 
                  className="w-full cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyCredits(pkg.id);
                  }}
                  aria-label={`Comprar ${pkg.credits} créditos`}
                >
                  Comprar
                </Button>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-xl font-bold text-foreground text-center mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">O que são créditos?</h3>
              <p className="text-muted-foreground text-sm">
                Cada mensagem WhatsApp enviada (confirmação, lembrete ou mensagem do bot) consome 1 crédito. Os créditos do plano renovam mensalmente, já os créditos extras nunca expiram.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-muted-foreground text-sm">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">O que acontece se meus créditos acabarem?</h3>
              <p className="text-muted-foreground text-sm">
                O bot WhatsApp é pausado automaticamente. Você pode comprar créditos avulsos ou aguardar a renovação mensal para continuar enviando mensagens.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <h3 className="font-semibold text-foreground mb-2">Como funciona o WhatsApp automático?</h3>
              <p className="text-muted-foreground text-sm">
                Nos planos Pro e Master, o sistema envia automaticamente confirmações e lembretes via WhatsApp para seus clientes usando a API oficial do Twilio.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* Payment Modal */}
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          type={paymentType}
          plan={selectedPlan}
          creditsPackage={selectedPackage}
          amount={paymentAmount}
          description={paymentDescription}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
