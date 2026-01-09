import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Save, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSettings } from "@/hooks/useSettings";

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
}

interface WorkingHours {
  [key: string]: DaySchedule;
}

const dayNames: { [key: string]: string } = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const initialHours: WorkingHours = {
  monday: { enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  tuesday: { enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  wednesday: { enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  thursday: { enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  friday: { enabled: true, start: "09:00", end: "18:00", breakStart: "12:00", breakEnd: "13:00" },
  saturday: { enabled: true, start: "09:00", end: "14:00", breakStart: "", breakEnd: "" },
  sunday: { enabled: false, start: "09:00", end: "14:00", breakStart: "", breakEnd: "" },
};

export default function Horarios() {
  const { settings, loading, updateSettings } = useSettings();
  const [workingHours, setWorkingHours] = useState<WorkingHours>(initialHours);
  const [slotDuration, setSlotDuration] = useState("30");
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from database
  useEffect(() => {
    if (settings) {
      // Convert working_days array to WorkingHours structure
      const workingDays = settings.working_days || [];
      const updatedHours = { ...initialHours };
      
      dayOrder.forEach(day => {
        updatedHours[day] = {
          ...updatedHours[day],
          enabled: workingDays.includes(day),
          start: settings.working_hours_start || "09:00",
          end: settings.working_hours_end || "18:00",
        };
      });
      
      setWorkingHours(updatedHours);
      setSlotDuration(String(settings.appointment_interval || 30));
    }
  }, [settings]);

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setWorkingHours({
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // Convert WorkingHours to working_days array
      const workingDays = dayOrder.filter(day => workingHours[day].enabled);
      
      // Get the first enabled day's hours as the global hours
      const firstEnabledDay = dayOrder.find(day => workingHours[day].enabled);
      const startHour = firstEnabledDay ? workingHours[firstEnabledDay].start : "09:00";
      const endHour = firstEnabledDay ? workingHours[firstEnabledDay].end : "18:00";
      
      await updateSettings({
        working_days: workingDays,
        working_hours_start: startHour,
        working_hours_end: endHour,
        appointment_interval: parseInt(slotDuration) || 30,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToAll = (day: string) => {
    const source = workingHours[day];
    const newHours = { ...workingHours };
    Object.keys(newHours).forEach((d) => {
      if (d !== day) {
        newHours[d] = { ...source };
      }
    });
    setWorkingHours(newHours);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-8">
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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Horários de Funcionamento
            </h1>
            <p className="text-muted-foreground">
              Configure os horários de atendimento
            </p>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </motion.div>

        {/* Slot Duration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="elevated" className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Intervalo entre agendamentos</h3>
                <p className="text-sm text-muted-foreground">
                  Duração mínima de cada slot de agendamento
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-20 text-center"
                  min="5"
                  max="120"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Working Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {dayOrder.map((day) => {
            const schedule = workingHours[day];
            return (
              <Card 
                key={day} 
                variant="elevated" 
                className={`p-4 lg:p-6 ${!schedule.enabled ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-4 lg:w-48">
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => updateDay(day, "enabled", checked)}
                    />
                    <span className="font-medium text-foreground">{dayNames[day]}</span>
                  </div>

                  {schedule.enabled && (
                    <>
                      {/* Main Hours */}
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground hidden sm:block" />
                          <Input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => updateDay(day, "start", e.target.value)}
                            className="w-28"
                          />
                        </div>
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => updateDay(day, "end", e.target.value)}
                          className="w-28"
                        />
                      </div>

                      {/* Break Hours */}
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-muted-foreground hidden lg:block">Intervalo:</span>
                        <Input
                          type="time"
                          value={schedule.breakStart}
                          onChange={(e) => updateDay(day, "breakStart", e.target.value)}
                          className="w-28"
                          placeholder="--:--"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={schedule.breakEnd}
                          onChange={(e) => updateDay(day, "breakEnd", e.target.value)}
                          className="w-28"
                          placeholder="--:--"
                        />
                      </div>

                      {/* Copy Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAll(day)}
                        className="text-xs"
                      >
                        Copiar para todos
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card variant="elevated" className="p-6 bg-highlight/5 border-highlight/20">
            <h3 className="font-semibold text-foreground mb-2">💡 Dicas</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ative <strong>sábado</strong> se você atende neste dia</li>
              <li>• Configure intervalos de almoço para bloquear horários automaticamente</li>
              <li>• Use "Copiar para todos" para aplicar o mesmo horário em todos os dias</li>
              <li>• Desative dias que você não trabalha</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
