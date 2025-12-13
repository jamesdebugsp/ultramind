import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  Scissors,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useProfile();
  const { services, loading: servicesLoading } = useServices();
  const { clients, loading: clientsLoading } = useClients();
  const { appointments, loading: appointmentsLoading } = useAppointments();

  const loading = profileLoading || servicesLoading || clientsLoading || appointmentsLoading;

  const businessSlug = useMemo(() => {
    if (!profile?.business_name) return "meu-negocio";
    return profile.business_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, [profile?.business_name]);

  const bookingUrl = `${window.location.origin}/agendar/${businessSlug}`;

  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const confirmedToday = todayAppointments.filter(a => a.status === "confirmado").length;

  const stats = [
    {
      title: "Agendamentos Hoje",
      value: todayAppointments.length.toString(),
      change: `${confirmedToday} confirmados`,
      trend: "up" as const,
      icon: Calendar,
    },
    {
      title: "Clientes",
      value: clients.length.toString(),
      change: "+0%",
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "Serviços Ativos",
      value: services.filter(s => s.status === 'active').length.toString(),
      change: `${services.length} total`,
      trend: "up" as const,
      icon: Scissors,
    },
    {
      title: "Taxa de Presença",
      value: appointments.length > 0 
        ? `${Math.round((appointments.filter(a => a.status === 'concluido').length / appointments.length) * 100)}%`
        : "0%",
      change: "últimos 30 dias",
      trend: "up" as const,
      icon: TrendingUp,
    },
  ];

  const upcomingAppointments = appointments
    .filter(a => a.date >= today && a.status !== 'cancelado')
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 5);

  const popularServices = useMemo(() => {
    const serviceCounts: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.service_id) {
        serviceCounts[a.service_id] = (serviceCounts[a.service_id] || 0) + 1;
      }
    });
    
    return services
      .map(s => ({ name: s.name, count: serviceCounts[s.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [services, appointments]);

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus clientes",
    });
    setTimeout(() => setCopied(false), 2000);
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
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            {profile?.business_name ? `${profile.business_name}` : "Bom dia!"} 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está o resumo do seu dia
          </p>
        </motion.div>

        {/* Booking Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="highlight" className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sua página de agendamentos</p>
                <p className="font-mono text-lg font-medium text-foreground break-all">{bookingUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="highlight-outline" size="sm" onClick={copyLink}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="highlight" size="sm" asChild>
                  <a href={`/agendar/${businessSlug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card variant="elevated" className="p-4 lg:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-highlight" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold">Próximos Agendamentos</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/dashboard/agendamentos">Ver todos</a>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum agendamento próximo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => {
                      const service = services.find(s => s.id === appointment.service_id);
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                              {appointment.client_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{appointment.client_name}</p>
                              <p className="text-sm text-muted-foreground">{service?.name || "Serviço"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold text-foreground">{appointment.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(appointment.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Popular Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Serviços Populares</CardTitle>
              </CardHeader>
              <CardContent>
                {popularServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scissors className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum serviço cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {popularServices.map((service, index) => (
                      <div key={service.name} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-foreground">{service.name}</p>
                            <Badge variant="highlight">{service.count}</Badge>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-accent rounded-full"
                              style={{ width: `${popularServices[0]?.count > 0 ? (service.count / popularServices[0].count) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
