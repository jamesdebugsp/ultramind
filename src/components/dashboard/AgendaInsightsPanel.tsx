import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  Calendar,
  TrendingUp,
  Users,
  Scissors,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  RefreshCw,
  Loader2,
  Target,
  BarChart3,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAgendaInsights, type InsightItem, type Recommendation } from "@/hooks/useAgendaInsights";

const iconMap = {
  clock: Clock,
  calendar: Calendar,
  trending: TrendingUp,
  users: Users,
  scissors: Scissors,
  alert: AlertTriangle,
};

const typeColors = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  tip: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

const typeIconBg = {
  info: "bg-blue-500/10",
  warning: "bg-amber-500/10",
  success: "bg-emerald-500/10",
  tip: "bg-violet-500/10",
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground",
};

function InsightCard({ insight, index }: { insight: InsightItem; index: number }) {
  const Icon = iconMap[insight.icon] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${typeColors[insight.type]}`}>
        <div className={`w-9 h-9 rounded-lg ${typeIconBg[insight.type]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">{insight.title}</p>
          <p className="text-xs mt-0.5 opacity-80">{insight.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
    >
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-highlight/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-highlight" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-sm text-foreground">{rec.title}</p>
            <Badge className={priorityColors[rec.priority]} variant="outline">
              {rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Média" : "Baixa"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{rec.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AgendaInsightsPanel() {
  const { data, loading, error, fetchInsights } = useAgendaInsights();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="relative">
            <Brain className="w-10 h-10 text-highlight animate-pulse" />
            <Sparkles className="w-4 h-4 text-highlight absolute -top-1 -right-1 animate-bounce" />
          </div>
          <p className="text-sm text-muted-foreground">Analisando sua agenda com IA...</p>
          <Loader2 className="w-5 h-5 animate-spin text-highlight" />
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card variant="elevated">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertTriangle className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Não foi possível gerar insights</p>
          <Button variant="outline" size="sm" onClick={fetchInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { metrics, insights, recommendations, suggested_time, rawMetrics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-highlight to-highlight/60 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Insights Inteligentes da Agenda</h2>
            <p className="text-xs text-muted-foreground">Análise automática com IA</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-highlight" />
            <span className="text-xs text-muted-foreground">Ocupação</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.occupancy_rate}%</p>
          <Progress value={metrics.occupancy_rate} className="h-1.5 mt-2" />
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Faltas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{rawMetrics.noShows}</p>
          <p className="text-xs text-muted-foreground mt-1">{metrics.no_show_rate}% do total</p>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Pico</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.busiest_hour || "--"}</p>
          <p className="text-xs text-muted-foreground mt-1">horário mais ocupado</p>
        </Card>

        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Vazios hoje</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.empty_slots_today}</p>
          <p className="text-xs text-muted-foreground mt-1">horários disponíveis</p>
        </Card>
      </div>

      {/* Suggested Time */}
      {suggested_time && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-4 border-highlight/30 bg-highlight/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-highlight/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Melhor horário sugerido pela IA: <span className="text-highlight">{suggested_time}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Baseado na análise de demanda e ocupação da sua agenda
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Insights */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Brain className="w-4 h-4 text-highlight" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-highlight" />
              Recomendações da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, i) => (
              <RecommendationCard key={i} rec={rec} index={i} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* No-show clients */}
      {rawMetrics.frequentNoShows.length > 0 && (
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserX className="w-4 h-4 text-destructive" />
              Clientes com Faltas Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rawMetrics.frequentNoShows.map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive">
                      {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  </div>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {count} faltas
                  </Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">
                💡 Sugerimos exigir confirmação antecipada para estes clientes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Summary */}
      <Card variant="elevated" className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{rawMetrics.monthTotal}</p>
            <p className="text-xs text-muted-foreground">Agendamentos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{rawMetrics.confirmed + rawMetrics.completed}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{rawMetrics.cancelled}</p>
            <p className="text-xs text-muted-foreground">Cancelamentos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{rawMetrics.noShows}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-highlight">{metrics.occupancy_rate}%</p>
            <p className="text-xs text-muted-foreground">Ocupação</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
