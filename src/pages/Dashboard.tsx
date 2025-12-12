import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Copy,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const stats = [
  {
    title: "Agendamentos Hoje",
    value: "12",
    change: "+3",
    trend: "up",
    icon: Calendar,
  },
  {
    title: "Clientes Ativos",
    value: "248",
    change: "+15%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Taxa de Presença",
    value: "92%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Faltas do Mês",
    value: "8",
    change: "-20%",
    trend: "down",
    icon: AlertCircle,
  },
];

const upcomingAppointments = [
  { id: 1, client: "Maria Silva", service: "Corte + Escova", time: "09:00", professional: "Ana" },
  { id: 2, client: "João Santos", service: "Barba", time: "09:30", professional: "Carlos" },
  { id: 3, client: "Patrícia Lima", service: "Manicure", time: "10:00", professional: "Fernanda" },
  { id: 4, client: "Ricardo Costa", service: "Corte Masculino", time: "10:30", professional: "Carlos" },
  { id: 5, client: "Camila Souza", service: "Coloração", time: "11:00", professional: "Ana" },
];

const popularServices = [
  { name: "Corte Feminino", count: 45 },
  { name: "Corte Masculino", count: 38 },
  { name: "Escova", count: 32 },
  { name: "Manicure", count: 28 },
  { name: "Coloração", count: 22 },
];

export default function Dashboard() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const bookingUrl = "agende.ultramind.com/salao-premium";

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus clientes",
    });
    setTimeout(() => setCopied(false), 2000);
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
            Bom dia! 👋
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
                <p className="font-mono text-lg font-medium text-foreground">{bookingUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="highlight-outline" size="sm" onClick={copyLink}>
                  {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button variant="highlight" size="sm" asChild>
                  <a href={`/agendar/salao-premium`} target="_blank">
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
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === "up" ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
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
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {appointment.client.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{appointment.client}</p>
                          <p className="text-sm text-muted-foreground">{appointment.service}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{appointment.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.professional}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                            style={{ width: `${(service.count / 45) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
