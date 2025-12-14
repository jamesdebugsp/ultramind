import { useState, useEffect, useMemo } from "react";
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
  ArrowRight,
  Loader2,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BusinessData {
  id: string;
  user_id: string;
  business_name: string;
  address: string | null;
  whatsapp: string | null;
  instagram: string | null;
}

interface ServiceData {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface SettingsData {
  working_hours_start: string;
  working_hours_end: string;
  appointment_interval: number;
  working_days: string[];
}

interface AppointmentData {
  date: string;
  time: string;
}

const DEFAULT_SETTINGS: SettingsData = {
  working_hours_start: "09:00",
  working_hours_end: "18:00",
  appointment_interval: 30,
  working_days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
};

const DAY_MAP: { [key: number]: string } = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday"
};

function generateTimeSlots(start: string, end: string, interval: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    slots.push(
      `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`
    );
    
    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  
  return slots;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PublicBooking() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [existingAppointments, setExistingAppointments] = useState<AppointmentData[]>([]);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientData, setClientData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    clientWhatsAppUrl?: string;
  } | null>(null);

  useEffect(() => {
    loadBusinessData();
  }, [slug]);

  useEffect(() => {
    if (selectedDate && businessData) {
      loadAppointmentsForDate(selectedDate);
    }
  }, [selectedDate, businessData]);

  const loadBusinessData = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .not('business_name', 'is', null);

      if (profileError) throw profileError;

      const matchingProfile = profiles?.find(p => {
        const profileSlug = p.business_name
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return profileSlug === slug;
      });

      if (matchingProfile) {
        setBusinessData(matchingProfile as BusinessData);
        
        // Load services
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name, duration, price')
          .eq('user_id', matchingProfile.user_id)
          .eq('status', 'active');

        setServices(servicesData || []);

        // Load settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('working_hours_start, working_hours_end, appointment_interval, working_days')
          .eq('user_id', matchingProfile.user_id)
          .maybeSingle();

        if (settingsData) {
          setSettings({
            working_hours_start: settingsData.working_hours_start || DEFAULT_SETTINGS.working_hours_start,
            working_hours_end: settingsData.working_hours_end || DEFAULT_SETTINGS.working_hours_end,
            appointment_interval: settingsData.appointment_interval || DEFAULT_SETTINGS.appointment_interval,
            working_days: Array.isArray(settingsData.working_days) 
              ? settingsData.working_days as string[] 
              : DEFAULT_SETTINGS.working_days
          });
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentsForDate = async (date: string) => {
    if (!businessData) return;
    
    try {
      const { data } = await supabase
        .from('appointments')
        .select('date, time')
        .eq('user_id', businessData.user_id)
        .eq('date', date)
        .neq('status', 'cancelado');

      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const timeSlots = useMemo(() => {
    return generateTimeSlots(
      settings.working_hours_start,
      settings.working_hours_end,
      settings.appointment_interval
    );
  }, [settings]);

  const occupiedTimes = useMemo(() => {
    return new Set(existingAppointments.map(a => a.time));
  }, [existingAppointments]);

  const isDateDisabled = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const dayName = DAY_MAP[date.getDay()];
    return !settings.working_days.includes(dayName);
  };

  const service = services.find((s) => s.id === selectedService);

  const handleSubmit = async () => {
    if (!businessData || !selectedService || !service) return;
    
    // Validate fields
    if (!clientData.name.trim()) {
      toast({ title: "Digite seu nome", variant: "destructive" });
      return;
    }
    
    const phoneDigits = clientData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast({ title: "Digite um WhatsApp válido", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert appointment
      const { data: appointmentData, error: insertError } = await supabase
        .from('appointments')
        .insert({
          user_id: businessData.user_id,
          client_name: clientData.name.trim(),
          client_whatsapp: phoneDigits,
          service_id: selectedService,
          date: selectedDate,
          time: selectedTime,
          status: 'confirmado',
          confirmed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function for WhatsApp confirmation
      try {
        const { data: confirmData } = await supabase.functions.invoke('send-whatsapp-confirmation', {
          body: {
            appointment_id: appointmentData.id,
            client_name: clientData.name.trim(),
            client_whatsapp: phoneDigits,
            business_name: businessData.business_name,
            business_whatsapp: businessData.whatsapp,
            service_name: service.name,
            date: selectedDate,
            time: selectedTime
          }
        });

        setConfirmationData(confirmData);
      } catch (fnError) {
        console.error('Edge function error:', fnError);
      }
      
      setIsConfirmed(true);
      toast({
        title: "Agendamento confirmado! 🎉",
        description: "Você receberá uma confirmação no WhatsApp.",
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Erro ao agendar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !selectedService) {
      toast({ title: "Selecione um serviço", variant: "destructive" });
      return;
    }
    if (step === 2 && !selectedDate) {
      toast({ title: "Selecione uma data", variant: "destructive" });
      return;
    }
    if (step === 2 && !selectedTime) {
      toast({ title: "Selecione um horário", variant: "destructive" });
      return;
    }
    if (step === 3) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Página não encontrada</h1>
          <p className="text-muted-foreground">
            Este estabelecimento não existe ou ainda não configurou sua página.
          </p>
        </Card>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground mb-6">Seu horário foi reservado com sucesso.</p>
          
          <Card className="p-6 mb-6 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estabelecimento:</span>
                <span className="font-medium text-foreground">{businessData.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium text-foreground">{service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium text-foreground">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              {service && (
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold">Valor:</span>
                  <span className="font-bold text-highlight">R$ {service.price.toFixed(2)}</span>
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-3">
            {confirmationData?.clientWhatsAppUrl && (
              <Button className="w-full" size="lg" asChild>
                <a href={confirmationData.clientWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Receber confirmação no WhatsApp
                </a>
              </Button>
            )}
            
            {businessData.whatsapp && (
              <Button variant="outline" className="w-full" size="lg" asChild>
                <a
                  href={`https://api.whatsapp.com/send?phone=55${businessData.whatsapp.replace(/\D/g, '')}&text=Olá! Acabei de agendar um horário.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Falar com {businessData.business_name}
                </a>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Powered by <span className="text-highlight font-semibold">UltraMind</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-highlight flex items-center justify-center text-white font-bold text-lg">
                {businessData.business_name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="font-bold text-foreground">{businessData.business_name}</h1>
                {businessData.address && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[180px]">{businessData.address}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {businessData.instagram && (
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={`https://instagram.com/${businessData.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </Button>
              )}
              {businessData.whatsapp && (
                <Button variant="ghost" size="icon" asChild>
                  <a
                    href={`https://api.whatsapp.com/send?phone=55${businessData.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? "bg-highlight text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
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
            {services.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {services.map((svc) => (
                  <Card
                    key={svc.id}
                    className={`p-4 cursor-pointer transition-all border-2 ${
                      selectedService === svc.id 
                        ? "border-highlight bg-highlight/5" 
                        : "border-transparent hover:border-highlight/30"
                    }`}
                    onClick={() => setSelectedService(svc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{svc.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {svc.duration} min
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-highlight">
                          R$ {svc.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
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
                onChange={(e) => {
                  const date = e.target.value;
                  if (isDateDisabled(date)) {
                    toast({ title: "Este dia não está disponível", variant: "destructive" });
                    return;
                  }
                  setSelectedDate(date);
                  setSelectedTime("");
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
              {selectedDate && isDateDisabled(selectedDate) && (
                <p className="text-sm text-destructive mt-1">
                  Este estabelecimento não atende neste dia da semana.
                </p>
              )}
            </div>

            {selectedDate && !isDateDisabled(selectedDate) && (
              <div>
                <Label className="mb-2 block">Horários disponíveis</Label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isOccupied = occupiedTimes.has(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={isOccupied}
                        className={
                          isOccupied 
                            ? "opacity-50 line-through cursor-not-allowed" 
                            : selectedTime === time 
                              ? "bg-highlight text-white hover:bg-highlight/90" 
                              : ""
                        }
                        onClick={() => !isOccupied && setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
                {occupiedTimes.size > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Horários riscados já estão ocupados
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Client Data */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Seus dados</h2>
            
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Seu nome *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Como devemos te chamar?"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      className="pl-10"
                      required
                      maxLength={100}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={clientData.phone}
                      onChange={(e) => setClientData({ ...clientData, phone: formatPhone(e.target.value) })}
                      className="pl-10"
                      required
                      maxLength={15}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você receberá a confirmação neste número
                  </p>
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Resumo do agendamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-medium text-foreground">{service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium text-foreground">{service?.duration} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium text-foreground">{selectedTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Total:</span>
                  <span className="font-bold text-highlight">R$ {service?.price.toFixed(2)}</span>
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
          <Button 
            onClick={nextStep} 
            disabled={isSubmitting}
            className="bg-highlight text-white hover:bg-highlight/90"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : step === 3 ? (
              "Confirmar Agendamento"
            ) : (
              "Próximo"
            )}
            {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="text-highlight font-semibold">UltraMind</span>
        </p>
      </footer>
    </div>
  );
}
