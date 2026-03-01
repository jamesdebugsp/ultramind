import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  RefreshCw,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useWhatsAppBusiness, type WhatsAppBusinessMessage } from "@/hooks/useWhatsAppBusiness";
import { Spinner } from "@/components/ui/spinner";

export default function WhatsAppLogs() {
  const { messages, loading, fetchMessages, refetch } = useWhatsAppBusiness();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleFilter = () => {
    fetchMessages({
      status: statusFilter,
      search: searchQuery || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 100,
    });
  };

  const handleClear = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    fetchMessages({ limit: 100 });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "sending":
        return <Send className="w-4 h-4 text-blue-500" />;
      case "delivered":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "read":
        return <Eye className="w-4 h-4 text-emerald-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente",
      sending: "Enviando",
      sent: "Enviado",
      delivered: "Entregue",
      read: "Lido",
      failed: "Falhou",
      retry_scheduled: "Retry",
    };
    return map[status] || status;
  };

  const statusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "delivered" || status === "read") return "default";
    if (status === "failed") return "destructive";
    if (status === "sent" || status === "sending") return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner className="w-8 h-8" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Logs de Mensagens WhatsApp
            </h1>
            <p className="text-muted-foreground">
              Histórico completo de mensagens enviadas
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="read">Lido</SelectItem>
                      <SelectItem value="failed">Falhou</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Buscar número</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="5511..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Data início</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Data fim</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="hero" onClick={handleFilter} className="flex-1">
                    Filtrar
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Message List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Mensagens ({messages.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma mensagem encontrada com os filtros atuais.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {statusIcon(msg.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{msg.template_name}</span>
                            <Badge variant={statusBadgeVariant(msg.status)} className="text-xs">
                              {statusLabel(msg.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Para: {msg.recipient_number}
                            {msg.retry_count > 0 && (
                              <span className="ml-2">• {msg.retry_count} retries</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </p>
                        {msg.error_message && (
                          <p className="text-xs text-destructive mt-0.5 max-w-xs truncate">
                            {msg.error_message}
                          </p>
                        )}
                        {msg.message_id && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[200px]">
                            ID: {msg.message_id}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
