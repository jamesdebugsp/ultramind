import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const stats = [
  { label: "Agendamentos do Mês", value: "248", change: "+12%", trend: "up", icon: Calendar },
  { label: "Faturamento Estimado", value: "R$ 18.450", change: "+8%", trend: "up", icon: DollarSign },
  { label: "Novos Clientes", value: "32", change: "+25%", trend: "up", icon: Users },
  { label: "Taxa de Faltas", value: "8%", change: "-15%", trend: "down", icon: TrendingDown },
];

const topServices = [
  { name: "Corte Feminino", count: 68, revenue: 5440 },
  { name: "Corte Masculino", count: 52, revenue: 2340 },
  { name: "Escova", count: 45, revenue: 2250 },
  { name: "Coloração", count: 28, revenue: 5040 },
  { name: "Manicure", count: 35, revenue: 1225 },
];

const topClients = [
  { name: "Carla Souza", visits: 8, spent: 640 },
  { name: "Maria Silva", visits: 6, spent: 480 },
  { name: "Ana Costa", visits: 5, spent: 400 },
  { name: "Patrícia Lima", visits: 4, spent: 320 },
  { name: "Lucia Ferreira", visits: 4, spent: 280 },
];

const peakHours = [
  { hour: "09:00", count: 42 },
  { hour: "10:00", count: 58 },
  { hour: "11:00", count: 45 },
  { hour: "14:00", count: 52 },
  { hour: "15:00", count: 48 },
  { hour: "16:00", count: 38 },
  { hour: "17:00", count: 32 },
];

const maxCount = Math.max(...peakHours.map(h => h.count));

export default function Relatorios() {
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
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho do seu negócio
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} variant="elevated" className="p-4 lg:p-6">
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
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-highlight" />
                  Serviços Mais Agendados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{service.count}x</Badge>
                            <span className="text-sm font-semibold text-highlight">
                              R${service.revenue}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-accent rounded-full"
                            style={{ width: `${(service.count / topServices[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Clients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 text-highlight" />
                  Clientes Mais Frequentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topClients.map((client, index) => (
                    <div key={client.name} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {client.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.visits} visitas</p>
                          </div>
                          <span className="font-semibold text-highlight">
                            R${client.spent}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-highlight" />
                Horários Mais Procurados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48">
                {peakHours.map((hour) => (
                  <div key={hour.hour} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full gradient-accent rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${(hour.count / maxCount) * 100}%` }}
                    />
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">{hour.count}</p>
                      <p className="text-xs text-muted-foreground">{hour.hour}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
