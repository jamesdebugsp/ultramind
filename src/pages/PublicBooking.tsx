import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Instagram, 
  CheckCircle2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Mock data - would come from API
const businessData = {
  name: "Salão Premium",
  address: "Rua das Flores, 123 - Centro, São Paulo",
  whatsapp: "5511999999999",
  instagram: "salaopremium",
  services: [
    { id: 1, name: "Corte Feminino", duration: 45, price: 80 },
    { id: 2, name: "Corte Masculino", duration: 30, price: 50 },
    { id: 3, name: "Escova", duration: 40, price: 60 },
    { id: 4, name: "Coloração", duration: 120, price: 180 },
    { id: 5, name: "Manicure", duration: 45, price: 40 },
    { id: 6, name: "Pedicure", duration: 50, price: 50 },
  ],
  professionals: [
    { id: 1, name: "Ana", role: "Cabeleireira" },
    { id: 2, name: "Carlos", role: "Barbeiro" },
    { id: 3, name: "Fernanda", role: "Manicure" },
  ],
};

const availableTimes = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export default function PublicBooking() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientData, setClientData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const service = businessData.services.find((s) => s.id === selectedService);
  const professional = businessData.professionals.find((p) => p.id === selectedProfessional);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsConfirmed(true);
    
    toast({
      title: "Agendamento confirmado! 🎉",
      description: "Você receberá uma confirmação no WhatsApp.",
    });
  };

  const nextStep = () => {
    if (step === 1 && !selectedService) {
      toast({ title: "Selecione um serviço", variant: "destructive" });
      return;
    }
    if (step === 2 && !selectedProfessional) {
      toast({ title: "Selecione um profissional", variant: "destructive" });
      return;
    }
    if (step === 3 && (!selectedDate || !selectedTime)) {
      toast({ title: "Selecione data e horário", variant: "destructive" });
      return;
    }
    if (step === 4 && (!clientData.name || !clientData.phone)) {
      toast({ title: "Preencha seus dados", variant: "destructive" });
      return;
    }
    
    if (step === 4) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Agendamento Confirmado!</h1>
          <Card variant="elevated" className="p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium text-foreground">{service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profissional:</span>
                <span className="font-medium text-foreground">{professional?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium text-foreground">
                  {new Date(selectedDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
            </div>
          </Card>
          <p className="text-muted-foreground mb-6">
            Você receberá uma confirmação no WhatsApp em instantes.
          </p>
          <Button variant="hero" size="lg" asChild>
            <a
              href={`https://api.whatsapp.com/send?phone=${businessData.whatsapp}&text=Olá! Acabei de agendar um horário.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                {businessData.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-bold text-foreground">{businessData.name}</h1>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{businessData.address}</span>
                </div>
              </div>
            </div>
            {businessData.instagram && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={`https://instagram.com/${businessData.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? "gradient-accent text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-8 h-1 mx-1 rounded ${
                    step > s ? "bg-highlight" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Escolha o serviço</h2>
            <div className="grid gap-3">
              {businessData.services.map((service) => (
                <Card
                  key={service.id}
                  variant={selectedService === service.id ? "highlight" : "elevated"}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedService === service.id ? "" : "hover:border-highlight/30"
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {service.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-highlight">R$ {service.price}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Professional */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Escolha o profissional</h2>
            <div className="grid gap-3">
              {businessData.professionals.map((prof) => (
                <Card
                  key={prof.id}
                  variant={selectedProfessional === prof.id ? "highlight" : "elevated"}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedProfessional === prof.id ? "" : "hover:border-highlight/30"
                  }`}
                  onClick={() => setSelectedProfessional(prof.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{prof.name}</p>
                      <p className="text-sm text-muted-foreground">{prof.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Escolha data e horário</h2>
            
            <div className="mb-6">
              <Label htmlFor="date" className="mb-2 block">Data</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
            </div>

            {selectedDate && (
              <div>
                <Label className="mb-2 block">Horários disponíveis</Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "highlight" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Client Data */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Seus dados</h2>
            
            <Card variant="elevated" className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Seu nome</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Como devemos te chamar?"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={clientData.phone}
                      onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card variant="elevated" className="p-6">
              <h3 className="font-bold text-foreground mb-4">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium text-foreground">{service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-medium text-foreground">{professional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-highlight">R$ {service?.price}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button variant="hero" onClick={nextStep} disabled={isSubmitting}>
            {isSubmitting ? "Confirmando..." : step === 4 ? "Confirmar Agendamento" : "Próximo"}
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-highlight font-semibold">AgendePro</span> — UltraMind Solutions
        </p>
      </footer>
    </div>
  );
}
