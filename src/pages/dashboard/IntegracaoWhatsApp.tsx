import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Wifi,
  WifiOff,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useWhatsAppBusiness } from "@/hooks/useWhatsAppBusiness";
import { Spinner } from "@/components/ui/spinner";

export default function IntegracaoWhatsApp() {
  const {
    config,
    messages,
    stats,
    loading,
    connecting,
    connectWhatsApp,
    disconnectWhatsApp,
    refetch,
  } = useWhatsAppBusiness();

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);

  const handleConnect = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim() || !businessAccountId.trim()) return;
    const result = await connectWhatsApp(phoneNumberId.trim(), accessToken.trim(), businessAccountId.trim());
    if (result.success) {
      setPhoneNumberId("");
      setAccessToken("");
      setBusinessAccountId("");
    }
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
        return <XCircle className="w-4 h-4 text-red-500" />;
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
      retry_scheduled: "Retry agendado",
    };
    return map[status] || status;
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Integração WhatsApp Business
            </h1>
            <p className="text-muted-foreground">
              Conecte sua conta do WhatsApp Business Cloud API (Meta)
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {config?.is_verified ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-muted-foreground" />
                )}
                Status da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {config?.is_verified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      ✅ Conectado
                    </Badge>
                    {config.verified_at && (
                      <span className="text-sm text-muted-foreground">
                        Desde {new Date(config.verified_at).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Número</Label>
                      <p className="font-medium">{config.phone_display || config.phone_number_id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Empresa</Label>
                      <p className="font-medium">{config.business_name || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Business Account ID</Label>
                      <p className="font-mono text-sm">{config.business_account_id}</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={disconnectWhatsApp}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Como obter suas credenciais:</p>
                        <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                          <li>Acesse <strong>developers.facebook.com</strong></li>
                          <li>Crie ou selecione seu app com WhatsApp Business</li>
                          <li>Vá em WhatsApp {">"} API Setup</li>
                          <li>Copie o Phone Number ID, Access Token e Business Account ID</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="phone_id">Phone Number ID</Label>
                      <Input
                        id="phone_id"
                        placeholder="Ex: 123456789012345"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                    <div>
                      <Label htmlFor="access_token">Access Token (Permanente)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="access_token"
                          type={showToken ? "text" : "password"}
                          placeholder="EAAxxxxxxx..."
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowToken(!showToken)}
                          type="button"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="business_id">WhatsApp Business Account ID</Label>
                      <Input
                        id="business_id"
                        placeholder="Ex: 123456789012345"
                        value={businessAccountId}
                        onChange={(e) => setBusinessAccountId(e.target.value)}
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    onClick={handleConnect}
                    disabled={connecting || !phoneNumberId || !accessToken || !businessAccountId}
                  >
                    {connecting ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        {config?.is_verified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {[
              { label: "Total", value: stats.total, icon: MessageSquare, color: "text-foreground" },
              { label: "Enviadas", value: stats.sent, icon: Send, color: "text-blue-500" },
              { label: "Entregues", value: stats.delivered, icon: CheckCircle2, color: "text-green-500" },
              { label: "Lidas", value: stats.read, icon: Eye, color: "text-emerald-500" },
              { label: "Falhas", value: stats.failed, icon: XCircle, color: "text-red-500" },
            ].map((stat) => (
              <Card key={stat.label} variant="elevated" className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Messages History */}
        {config?.is_verified && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {statusIcon(msg.status)}
                        <div>
                          <p className="text-sm font-medium">{msg.template_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Para: {msg.recipient_number}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {statusLabel(msg.status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
