import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Bell, BellOff, Check, CheckCircle,
  Clock, Eye, Filter, Loader2, RefreshCw, Shield, XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useWebhookMonitoring, type WebhookLog, type AdminAlert } from "@/hooks/useWebhookMonitoring";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function SeverityBadge({ severity }: { severity: string }) {
  switch (severity) {
    case "critical":
      return <Badge variant="destructive">Crítico</Badge>;
    case "error":
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Erro</Badge>;
    case "warning":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Aviso</Badge>;
    default:
      return <Badge variant="outline">Info</Badge>;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "processed":
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    case "error":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "skipped":
      return <Clock className="w-4 h-4 text-amber-600" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
}

export function WebhookMonitoringPanel() {
  const {
    logs, alerts, loadingLogs, loadingAlerts, unreadCount,
    fetchLogs, fetchAlerts, markAlertRead, markAllRead, resolveAlert, getHealthStatus,
  } = useWebhookMonitoring();

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const health = getHealthStatus();

  const filteredLogs = severityFilter === "all"
    ? logs
    : logs.filter(l => l.severity === severityFilter);

  const timeAgo = (date: string) =>
    formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });

  if (loadingLogs && loadingAlerts) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-highlight" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health.status === 'operational' ? 'bg-emerald-500' : health.status === 'partial' ? 'bg-amber-500' : 'bg-destructive'} animate-pulse`} />
              <div>
                <p className={`font-semibold ${health.color}`}>{health.label}</p>
                <p className="text-xs text-muted-foreground">Webhook Status</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-highlight" />
              <div>
                <p className="text-2xl font-bold text-foreground">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Eventos (últimos 100)</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {logs.filter(l => l.severity === 'error' || l.severity === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Alertas não lidos</p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts" className="relative">
            Alertas
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-destructive rounded-full">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">Logs do Webhook</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas do Sistema
              </CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllRead}>
                    <BellOff className="w-4 h-4 mr-1" /> Marcar tudo lido
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={fetchAlerts}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum alerta registrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${!alert.is_read ? 'bg-muted/50 border-highlight/30' : 'border-border'} ${alert.resolved_at ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <SeverityBadge severity={alert.severity} />
                          <div>
                            <p className={`font-medium ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {alert.title}
                            </p>
                            {alert.description && (
                              <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">{timeAgo(alert.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!alert.is_read && (
                            <Button variant="ghost" size="sm" onClick={() => markAlertRead(alert.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {!alert.resolved_at && (
                            <Button variant="ghost" size="sm" onClick={() => resolveAlert(alert.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Logs do Webhook
              </CardTitle>
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32 h-8">
                    <Filter className="w-3 h-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Quando</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <>
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        >
                          <TableCell><StatusIcon status={log.status} /></TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{log.event_type}</p>
                              {log.event_action && <p className="text-xs text-muted-foreground">{log.event_action}</p>}
                            </div>
                          </TableCell>
                          <TableCell><SeverityBadge severity={log.severity} /></TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{log.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.processing_time_ms != null ? `${log.processing_time_ms}ms` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{timeAgo(log.created_at)}</TableCell>
                        </TableRow>
                        {expandedLog === log.id && (
                          <TableRow key={`${log.id}-detail`}>
                            <TableCell colSpan={6}>
                              <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2">
                                {log.external_payment_id && <p><strong>MP Payment ID:</strong> {log.external_payment_id}</p>}
                                {log.external_reference && <p><strong>Referência:</strong> {log.external_reference}</p>}
                                {log.payment_id && <p><strong>Payment ID (DB):</strong> {log.payment_id}</p>}
                                {log.error_message && <p className="text-destructive"><strong>Erro:</strong> {log.error_message}</p>}
                                {log.response_data && (
                                  <details>
                                    <summary className="cursor-pointer text-muted-foreground">Dados da resposta</summary>
                                    <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-40">
                                      {JSON.stringify(log.response_data, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum log encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
