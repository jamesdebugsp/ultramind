import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Filter,
  Send,
  Bell,
  Bot,
  User,
  Building,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useMessageLogs, useMessageLogStats, MessageLog } from "@/hooks/useMessageLogs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MonitoramentoWhatsApp() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: logs, isLoading, refetch, isRefetching } = useMessageLogs({
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    messageType: typeFilter !== "all" ? typeFilter : undefined,
  });
  
  const { data: stats } = useMessageLogStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enviado
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Falhou
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "confirmation":
        return (
          <Badge variant="outline" className="border-highlight/30 text-highlight">
            <Send className="w-3 h-3 mr-1" />
            Confirmação
          </Badge>
        );
      case "reminder_24h":
        return (
          <Badge variant="outline" className="border-purple-500/30 text-purple-600">
            <Bell className="w-3 h-3 mr-1" />
            Lembrete 24h
          </Badge>
        );
      case "reminder_2h":
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-600">
            <Bell className="w-3 h-3 mr-1" />
            Lembrete 2h
          </Badge>
        );
      case "bot_reply":
        return (
          <Badge variant="outline" className="border-blue-500/30 text-blue-600">
            <Bot className="w-3 h-3 mr-1" />
            Bot
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getRecipientIcon = (type: string) => {
    return type === "owner" ? (
      <Building className="w-4 h-4 text-highlight" />
    ) : (
      <User className="w-4 h-4 text-muted-foreground" />
    );
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13 && cleaned.startsWith("55")) {
      const ddd = cleaned.slice(2, 4);
      const num = cleaned.slice(4);
      return `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
    }
    return phone;
  };

  const successRate = stats ? Math.round((stats.sent / (stats.total || 1)) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Monitoramento WhatsApp
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe todas as mensagens enviadas pelo sistema
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.sent || 0}</p>
                <p className="text-sm text-muted-foreground">Enviadas</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.failed || 0}</p>
                <p className="text-sm text-muted-foreground">Falhas</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                successRate >= 90 ? "bg-emerald-500/10" : 
                successRate >= 70 ? "bg-amber-500/10" : "bg-destructive/10"
              }`}>
                <span className={`text-lg font-bold ${
                  successRate >= 90 ? "text-emerald-600" : 
                  successRate >= 70 ? "text-amber-600" : "text-destructive"
                }`}>
                  %
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{successRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa sucesso</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Type breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="p-4 border-highlight/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-highlight" />
                <span className="text-sm font-medium">Confirmações</span>
              </div>
              <span className="text-lg font-bold">{stats?.byType.confirmation || 0}</span>
            </div>
          </Card>
          <Card className="p-4 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Lembretes 24h</span>
              </div>
              <span className="text-lg font-bold">{stats?.byType.reminder_24h || 0}</span>
            </div>
          </Card>
          <Card className="p-4 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">Lembretes 2h</span>
              </div>
              <span className="text-lg font-bold">{stats?.byType.reminder_2h || 0}</span>
            </div>
          </Card>
          <Card className="p-4 border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Bot</span>
              </div>
              <span className="text-lg font-bold">{stats?.byType.bot_reply || 0}</span>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 mb-6"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="failed">Falhas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="confirmation">Confirmação</SelectItem>
              <SelectItem value="reminder_24h">Lembrete 24h</SelectItem>
              <SelectItem value="reminder_2h">Lembrete 2h</SelectItem>
              <SelectItem value="bot_reply">Bot</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Histórico de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-highlight" />
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{getTypeBadge(log.message_type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRecipientIcon(log.recipient_type)}
                              <span className="text-sm">
                                {log.recipient_type === "owner" ? "Dono" : "Cliente"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatPhone(log.recipient_phone)}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.sent_at || log.created_at ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {formatDistanceToNow(
                                      new Date(log.sent_at || log.created_at),
                                      { addSuffix: true, locale: ptBR }
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {new Date(log.sent_at || log.created_at).toLocaleString("pt-BR")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Ver mensagem
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <MessageSquare className="w-5 h-5" />
                                      Detalhes da Mensagem
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                      {getTypeBadge(log.message_type)}
                                      {getStatusBadge(log.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Telefone:</span>
                                        <p className="font-mono">{formatPhone(log.recipient_phone)}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Destinatário:</span>
                                        <p>{log.recipient_type === "owner" ? "Dono" : "Cliente"}</p>
                                      </div>
                                      {log.twilio_sid && (
                                        <div className="col-span-2">
                                          <span className="text-muted-foreground">Twilio SID:</span>
                                          <p className="font-mono text-xs truncate">{log.twilio_sid}</p>
                                        </div>
                                      )}
                                      {log.error_message && (
                                        <div className="col-span-2">
                                          <span className="text-destructive flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Erro:
                                          </span>
                                          <p className="text-destructive text-sm">{log.error_message}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground text-sm">Conteúdo:</span>
                                      <ScrollArea className="h-[200px] mt-2">
                                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                                          {log.message_content || "Conteúdo não disponível"}
                                        </div>
                                      </ScrollArea>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma mensagem encontrada</p>
                  <p className="text-sm">As mensagens aparecerão aqui quando forem enviadas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
