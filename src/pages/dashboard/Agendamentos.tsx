import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

interface Agendamento {
  id: string;
  clientName: string;
  clientPhone: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: "confirmado" | "pendente" | "cancelado" | "concluido";
}

const initialAgendamentos: Agendamento[] = [
  { id: "1", clientName: "Maria Silva", clientPhone: "(11) 99999-1111", service: "Corte + Escova", professional: "Ana", date: "2024-12-12", time: "09:00", status: "confirmado" },
  { id: "2", clientName: "João Santos", clientPhone: "(11) 99999-2222", service: "Barba", professional: "Carlos", date: "2024-12-12", time: "09:30", status: "confirmado" },
  { id: "3", clientName: "Patrícia Lima", clientPhone: "(11) 99999-3333", service: "Manicure", professional: "Fernanda", date: "2024-12-12", time: "10:00", status: "pendente" },
  { id: "4", clientName: "Ricardo Costa", clientPhone: "(11) 99999-4444", service: "Corte Masculino", professional: "Carlos", date: "2024-12-12", time: "10:30", status: "confirmado" },
  { id: "5", clientName: "Camila Souza", clientPhone: "(11) 99999-5555", service: "Coloração", professional: "Ana", date: "2024-12-12", time: "11:00", status: "pendente" },
  { id: "6", clientName: "André Oliveira", clientPhone: "(11) 99999-6666", service: "Corte Feminino", professional: "Ana", date: "2024-12-12", time: "14:00", status: "confirmado" },
  { id: "7", clientName: "Lucia Ferreira", clientPhone: "(11) 99999-7777", service: "Pedicure", professional: "Fernanda", date: "2024-12-12", time: "15:00", status: "cancelado" },
  { id: "8", clientName: "Felipe Martins", clientPhone: "(11) 99999-8888", service: "Barba + Corte", professional: "Carlos", date: "2024-12-12", time: "16:00", status: "confirmado" },
];

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(initialAgendamentos);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();

  const filteredAgendamentos = agendamentos.filter(a => a.date === selectedDate);

  const updateStatus = (id: string, status: Agendamento["status"]) => {
    setAgendamentos(agendamentos.map(a => 
      a.id === id ? { ...a, status } : a
    ));
    toast({ 
      title: "Status atualizado", 
      description: `Agendamento marcado como ${status}` 
    });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${name}! Tudo bem? Aqui é do Salão Premium.`);
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${message}`, "_blank");
  };

  const getStatusBadge = (status: Agendamento["status"]) => {
    switch (status) {
      case "confirmado":
        return <Badge variant="highlight" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Confirmado</Badge>;
      case "pendente":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "concluido":
        return <Badge variant="highlight">Concluído</Badge>;
    }
  };

  const stats = {
    total: filteredAgendamentos.length,
    confirmados: filteredAgendamentos.filter(a => a.status === "confirmado").length,
    pendentes: filteredAgendamentos.filter(a => a.status === "pendente").length,
    cancelados: filteredAgendamentos.filter(a => a.status === "cancelado").length,
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Agendamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os agendamentos
          </p>
        </motion.div>

        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl border border-border"
        >
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground capitalize">
              {formatDate(selectedDate)}
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1 text-sm text-muted-foreground bg-transparent border-none text-center cursor-pointer"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.confirmados}</p>
                <p className="text-sm text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.cancelados}</p>
                <p className="text-sm text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Appointments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredAgendamentos.length === 0 ? (
            <Card variant="elevated" className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
            </Card>
          ) : (
            filteredAgendamentos
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((agendamento) => (
                <Card key={agendamento.id} variant="elevated" className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl gradient-accent flex flex-col items-center justify-center text-primary-foreground">
                        <Clock className="w-5 h-5 mb-1" />
                        <span className="text-sm font-bold">{agendamento.time}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{agendamento.clientName}</h3>
                          {getStatusBadge(agendamento.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{agendamento.service}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {agendamento.professional}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {agendamento.clientPhone}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleWhatsApp(agendamento.clientPhone, agendamento.clientName)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                      {agendamento.status === "pendente" && (
                        <>
                          <Button 
                            variant="hero" 
                            size="sm"
                            onClick={() => updateStatus(agendamento.id, "confirmado")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => updateStatus(agendamento.id, "cancelado")}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {agendamento.status === "confirmado" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateStatus(agendamento.id, "concluido")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
