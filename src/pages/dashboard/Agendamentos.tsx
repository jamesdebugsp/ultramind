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
  MessageSquare,
  Plus,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";

export default function Agendamentos() {
  const { appointments, loading, createAppointment, updateAppointment } = useAppointments();
  const { services } = useServices();
  const { clients } = useClients();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_whatsapp: "",
    service_id: "",
    date: new Date().toISOString().split("T")[0],
    time: ""
  });

  const filteredAgendamentos = appointments.filter(a => a.date === selectedDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await createAppointment({
      client_name: formData.client_name,
      client_whatsapp: formData.client_whatsapp || null,
      client_id: null,
      service_id: formData.service_id || null,
      date: formData.date,
      time: formData.time,
      status: 'pending',
      notes: null,
      confirmed_at: null
    });
    
    setFormData({
      client_name: "",
      client_whatsapp: "",
      service_id: "",
      date: new Date().toISOString().split("T")[0],
      time: ""
    });
    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateAppointment(id, { status });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${name}! Tudo bem? Estamos confirmando seu agendamento.`);
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${message}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmado":
        return <Badge variant="highlight" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "concluido":
        return <Badge variant="highlight">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = {
    total: filteredAgendamentos.length,
    confirmados: filteredAgendamentos.filter(a => a.status === "confirmado").length,
    pendentes: filteredAgendamentos.filter(a => a.status === "pending").length,
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

  const getServiceName = (serviceId: string | null) => {
    if (!serviceId) return "Serviço não especificado";
    const service = services.find(s => s.id === serviceId);
    return service?.name || "Serviço não encontrado";
  };

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Agendamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie todos os agendamentos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do cliente</Label>
                  <Input
                    id="client_name"
                    placeholder="Nome do cliente"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_whatsapp">WhatsApp</Label>
                  <Input
                    id="client_whatsapp"
                    placeholder="(11) 99999-9999"
                    value={formData.client_whatsapp}
                    onChange={(e) => setFormData({ ...formData, client_whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serviço</Label>
                  <Select
                    value={formData.service_id}
                    onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.status === 'active').map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - R${service.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => setFormData({ ...formData, time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agendar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
              <p className="text-muted-foreground mb-4">Nenhum agendamento para esta data</p>
              <Button variant="hero" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar agendamento
              </Button>
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
                          <h3 className="font-semibold text-foreground">{agendamento.client_name}</h3>
                          {getStatusBadge(agendamento.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {getServiceName(agendamento.service_id)}
                        </p>
                        {agendamento.client_whatsapp && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            {agendamento.client_whatsapp}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {agendamento.client_whatsapp && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleWhatsApp(agendamento.client_whatsapp!, agendamento.client_name)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      {agendamento.status === "pending" && (
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
