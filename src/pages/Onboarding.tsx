import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Store, 
  Clock, 
  Scissors, 
  Users,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { id: 1, title: "Estabelecimento", icon: Store },
  { id: 2, title: "Serviços", icon: Scissors },
  { id: 3, title: "Horários", icon: Clock },
  { id: 4, title: "Profissionais", icon: Users },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    whatsapp: "",
    instagram: "",
    address: "",
    services: [{ name: "", duration: "30", price: "" }],
    workingHours: {
      monday: { start: "09:00", end: "18:00", enabled: true },
      tuesday: { start: "09:00", end: "18:00", enabled: true },
      wednesday: { start: "09:00", end: "18:00", enabled: true },
      thursday: { start: "09:00", end: "18:00", enabled: true },
      friday: { start: "09:00", end: "18:00", enabled: true },
      saturday: { start: "09:00", end: "14:00", enabled: true },
      sunday: { start: "09:00", end: "14:00", enabled: false },
    },
    professionals: [{ name: "", role: "" }],
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...formData.services];
    newServices[index] = { ...newServices[index], [field]: value };
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: "", duration: "30", price: "" }],
    });
  };

  const handleProfessionalChange = (index: number, field: string, value: string) => {
    const newProfessionals = [...formData.professionals];
    newProfessionals[index] = { ...newProfessionals[index], [field]: value };
    setFormData({ ...formData, professionals: newProfessionals });
  };

  const addProfessional = () => {
    setFormData({
      ...formData,
      professionals: [...formData.professionals, { name: "", role: "" }],
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Configuração concluída!",
        description: "Seu estabelecimento está pronto para receber agendamentos.",
      });
      navigate("/dashboard");
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">AgendePro</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Configure seu estabelecimento</h1>
          <p className="text-muted-foreground">Isso leva menos de 3 minutos</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentStep >= step.id
                    ? "gradient-accent text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-1 mx-1 rounded ${
                    currentStep > step.id ? "bg-highlight" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card variant="elevated" className="p-8">
          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Sobre seu estabelecimento</h2>
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Nome do estabelecimento</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="Ex: Salão Beleza Pura"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp para receber agendamentos</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram (opcional)</Label>
                <Input
                  id="instagram"
                  name="instagram"
                  placeholder="@seuperfil"
                  value={formData.instagram}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Rua, número, bairro, cidade"
                    value={formData.address}
                    onChange={handleChange}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Services */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Seus serviços</h2>
              
              {formData.services.map((service, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="col-span-3 sm:col-span-1">
                    <Label>Nome do serviço</Label>
                    <Input
                      placeholder="Ex: Corte feminino"
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={service.duration}
                      onChange={(e) => handleServiceChange(index, "duration", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={service.price}
                      onChange={(e) => handleServiceChange(index, "price", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addService} className="w-full">
                + Adicionar serviço
              </Button>
            </motion.div>
          )}

          {/* Step 3: Working Hours */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Horários de funcionamento</h2>
              
              {Object.entries(formData.workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <label className="flex items-center gap-2 w-28">
                    <input
                      type="checkbox"
                      checked={hours.enabled}
                      onChange={(e) => {
                        const newHours = { ...formData.workingHours };
                        newHours[day as keyof typeof newHours].enabled = e.target.checked;
                        setFormData({ ...formData, workingHours: newHours });
                      }}
                      className="rounded"
                    />
                    <span className="capitalize text-sm font-medium text-foreground">
                      {day === "monday" && "Segunda"}
                      {day === "tuesday" && "Terça"}
                      {day === "wednesday" && "Quarta"}
                      {day === "thursday" && "Quinta"}
                      {day === "friday" && "Sexta"}
                      {day === "saturday" && "Sábado"}
                      {day === "sunday" && "Domingo"}
                    </span>
                  </label>
                  {hours.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={hours.start}
                        onChange={(e) => {
                          const newHours = { ...formData.workingHours };
                          newHours[day as keyof typeof newHours].start = e.target.value;
                          setFormData({ ...formData, workingHours: newHours });
                        }}
                        className="w-28"
                      />
                      <span className="text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={hours.end}
                        onChange={(e) => {
                          const newHours = { ...formData.workingHours };
                          newHours[day as keyof typeof newHours].end = e.target.value;
                          setFormData({ ...formData, workingHours: newHours });
                        }}
                        className="w-28"
                      />
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {/* Step 4: Professionals */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Profissionais</h2>
              
              {formData.professionals.map((professional, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Maria"
                      value={professional.name}
                      onChange={(e) => handleProfessionalChange(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input
                      placeholder="Ex: Cabeleireira"
                      value={professional.role}
                      onChange={(e) => handleProfessionalChange(index, "role", e.target.value)}
                    />
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addProfessional} className="w-full">
                + Adicionar profissional
              </Button>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button type="button" variant="hero" onClick={nextStep}>
              {currentStep === 4 ? "Concluir" : "Próximo"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
