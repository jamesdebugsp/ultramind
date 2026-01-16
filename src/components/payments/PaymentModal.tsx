import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CreditCard, 
  QrCode, 
  FileText, 
  Copy, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { usePayments, CreatePaymentRequest, CreatePaymentResponse } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'plan' | 'credits';
  plan?: 'basic' | 'pro' | 'premium';
  creditsPackage?: 'pack_300' | 'pack_800' | 'pack_2000';
  amount: number;
  description: string;
  onSuccess?: () => void;
}

const PLAN_NAMES: Record<string, string> = {
  basic: 'Essencial',
  pro: 'Profissional',
  premium: 'Master',
};

const CREDIT_PACKAGE_NAMES: Record<string, string> = {
  pack_300: '300 créditos',
  pack_800: '800 créditos',
  pack_2000: '2.000 créditos',
};

export function PaymentModal({
  open,
  onOpenChange,
  type,
  plan,
  creditsPackage,
  amount,
  description,
  onSuccess,
}: PaymentModalProps) {
  const { createPayment, creating, pollPaymentStatus } = usePayments();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'method' | 'form' | 'pending' | 'success' | 'error'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form fields
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerCpf, setPayerCpf] = useState('');

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setTimeout(() => {
        setStep('method');
        setPaymentData(null);
        setCopied(false);
      }, 300);
    }
  }, [open]);

  const handleSelectMethod = (method: 'pix' | 'credit_card' | 'boleto') => {
    setPaymentMethod(method);
    setStep('form');
  };

  const handleSubmit = async () => {
    const request: CreatePaymentRequest = {
      type,
      payment_method: paymentMethod,
      payer_email: payerEmail || undefined,
      payer_name: payerName || undefined,
      payer_cpf: payerCpf || undefined,
    };

    if (type === 'plan' && plan) {
      request.plan = plan;
    } else if (type === 'credits' && creditsPackage) {
      request.credits_package = creditsPackage;
    }

    const result = await createPayment(request);
    
    if (result) {
      setPaymentData(result);
      
      if (result.status === 'approved') {
        setStep('success');
        onSuccess?.();
      } else if (result.status === 'pending') {
        setStep('pending');
        
        // Start polling for payment status
        pollPaymentStatus(result.payment_id, (status) => {
          if (status === 'approved') {
            setStep('success');
            onSuccess?.();
            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu pagamento foi processado com sucesso.',
            });
          } else if (status === 'rejected' || status === 'cancelled') {
            setStep('error');
          }
        });
      } else {
        setStep('error');
      }
    }
  };

  const copyPixCode = () => {
    if (paymentData?.pix?.qr_code) {
      navigator.clipboard.writeText(paymentData.pix.qr_code);
      setCopied(true);
      toast({ title: 'Código PIX copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const itemName = type === 'plan' && plan 
    ? `Plano ${PLAN_NAMES[plan]}` 
    : type === 'credits' && creditsPackage 
      ? CREDIT_PACKAGE_NAMES[creditsPackage] 
      : description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Pagamento Confirmado!' : 
             step === 'error' ? 'Erro no Pagamento' :
             `Pagamento - ${itemName}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'method' && 'Escolha a forma de pagamento'}
            {step === 'form' && 'Preencha seus dados para continuar'}
            {step === 'pending' && 'Aguardando confirmação do pagamento'}
            {step === 'success' && 'Seu pagamento foi processado com sucesso!'}
            {step === 'error' && 'Houve um problema com seu pagamento'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose Payment Method */}
          {step === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-foreground">R$ {amount.toFixed(2)}</p>
              </div>

              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-16 justify-start gap-4"
                  onClick={() => handleSelectMethod('pix')}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">PIX</p>
                    <p className="text-sm text-muted-foreground">Aprovação instantânea</p>
                  </div>
                  <Badge className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    Recomendado
                  </Badge>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 justify-start gap-4"
                  onClick={() => handleSelectMethod('credit_card')}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Parcelamento disponível</p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 justify-start gap-4"
                  onClick={() => handleSelectMethod('boleto')}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Boleto Bancário</p>
                    <p className="text-sm text-muted-foreground">Vencimento em 3 dias</p>
                  </div>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Payment Form */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-foreground">R$ {amount.toFixed(2)}</p>
                <Badge variant="secondary" className="mt-2">
                  {paymentMethod === 'pix' ? 'PIX' : 
                   paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'Boleto'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="João da Silva"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@email.com"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={payerCpf}
                    onChange={(e) => setPayerCpf(formatCPF(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleSubmit} 
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Pagar'
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pending Payment (PIX/Boleto) */}
          {step === 'pending' && paymentData && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {paymentMethod === 'pix' && paymentData.pix && (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {paymentData.pix.qr_code_base64 ? (
                      <img 
                        src={`data:image/png;base64,${paymentData.pix.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-muted flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ou copie o código PIX:</p>
                    <div className="flex gap-2">
                      <Input
                        value={paymentData.pix.qr_code?.slice(0, 40) + '...'}
                        readOnly
                        className="text-xs"
                      />
                      <Button variant="outline" size="icon" onClick={copyPixCode}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Aguardando pagamento...</span>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              {paymentMethod === 'boleto' && paymentData.boleto && (
                <div className="text-center space-y-4">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                    <p className="font-semibold">Boleto gerado com sucesso!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Vencimento: {new Date(paymentData.boleto.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <Button asChild className="w-full">
                    <a href={paymentData.boleto.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Baixar Boleto
                    </a>
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>O pagamento será confirmado em até 3 dias úteis</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-foreground">Pagamento confirmado!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {type === 'plan' 
                    ? `Seu plano ${PLAN_NAMES[plan || 'basic']} foi ativado.`
                    : `${creditsPackage ? CREDIT_PACKAGE_NAMES[creditsPackage] : 'Créditos'} adicionados à sua conta.`
                  }
                </p>
              </div>

              <Button onClick={() => onOpenChange(false)} className="w-full">
                Fechar
              </Button>
            </motion.div>
          )}

          {/* Step 5: Error */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div>
                <p className="text-lg font-semibold text-foreground">Pagamento não aprovado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Houve um problema com seu pagamento. Por favor, tente novamente.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={() => setStep('method')} className="flex-1">
                  Tentar novamente
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
