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
  TestTube,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useWhatsAppBusiness } from "@/hooks/useWhatsAppBusiness";
import { Spinner } from "@/components/ui/spinner";
import { useNavigate } from "react-router-dom";

export default function IntegracaoWhatsApp() {
  const {
    config,
    messages,
    plan,
    stats,
    loading,
    connecting,
    connectWhatsApp,
    disconnectWhatsApp,
    sendTemplate,
    refetch,
  } = useWhatsAppBusiness();
  const navigate = useNavigate();

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Test send state
  const [testTo, setTestTo] = useState("");
  const [testTemplate, setTestTemplate] = useState("hello_world");
  const [testSending, setTestSending] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const handleConnect = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim() || !businessAccountId.trim()) return;
    const result = await connectWhatsApp(phoneNumberId.trim(), accessToken.trim(), businessAccountId.trim());
    if (result.success) {
      setPhoneNumberId("");
      setAccessToken("");
      setBusinessAccountId("");
    }
  };

  const handleTestSend = async () => {
    if (!testTo.trim() || !testTemplate.trim()) return;
    setTestSending(true);
    await sendTemplate(testTo.trim(), testTemplate.trim());
    setTestSending(false);
    setTestDialogOpen(false);
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

  const planLabels: Record<string, string> = {
    basic: "Basic — 1.000/mês",
    pro: "Pro — 5.000/mês",
    business: "Business — Ilimitado",
  };

  const usagePercent = plan
    ? plan.monthly_limit === -1
      ? 0
      : Math.min(100, (plan.messages_sent_current_month / plan.monthly_limit) * 100)
    : 0;

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
      pending: "Pendente", sending: "Enviando", sent: "Enviado",
      delivered: "Entregue", read: "Lido", failed: "Falhou",
      retry_scheduled: "Retry",
    };
    return map[status] || status;
  };

  const lastMessage = messages[0];

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            {config?.is_verified && (
              <Button variant="outline" onClick={() => navigate("/dashboard/whatsapp-logs")}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Logs
              </Button>
            )}
          </div>
        </motion.div>

        {/* Connection Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
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
                  <div className="flex gap-2">
                    <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <TestTube className="w-4 h-4 mr-2" />
                          Testar Envio
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Testar Envio de Template</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Número (com DDI)</Label>
                            <Input
                              placeholder="5511999999999"
                              value={testTo}
                              onChange={(e) => setTestTo(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Nome do Template</Label>
                            <Input
                              placeholder="hello_world"
                              value={testTemplate}
                              onChange={(e) => setTestTemplate(e.target.value)}
                            />
                          </div>
                          <Button
                            variant="hero"
                            onClick={handleTestSend}
                            disabled={testSending || !testTo || !testTemplate}
                            className="w-full"
                          >
                            {testSending ? <Spinner className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Enviar Teste
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="sm" onClick={disconnectWhatsApp}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  </div>
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
                          <li>Copie Phone Number ID, Access Token e Business Account ID</li>
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
                        <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)}>
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
                      <><Spinner className="w-4 h-4 mr-2" />Validando...</>
                    ) : (
                      <><Wifi className="w-4 h-4 mr-2" />Conectar WhatsApp</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Plan & Usage */}
        {config?.is_verified && plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Plano & Uso Mensal</span>
                  <Badge variant="outline">{planLabels[plan.plan_type] || plan.plan_type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {plan.messages_sent_current_month} de{" "}
                    {plan.monthly_limit === -1 ? "∞" : plan.monthly_limit.toLocaleString()} mensagens
                  </span>
                  <span className="text-muted-foreground">
                    Reset em: {new Date(plan.reset_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {plan.monthly_limit !== -1 && (
                  <Progress value={usagePercent} className="h-3" />
                )}
                {usagePercent >= 80 && plan.monthly_limit !== -1 && (
                  <p className="text-sm text-destructive">
                    ⚠️ Você está usando {Math.round(usagePercent)}% do limite mensal.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        {config?.is_verified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {[
              { label: "Total", value: stats.total, icon: MessageSquare },
              { label: "Enviadas", value: stats.sent, icon: Send },
              { label: "Entregues", value: stats.delivered, icon: CheckCircle2 },
              { label: "Lidas", value: stats.read, icon: Eye },
              { label: "Falhas", value: stats.failed, icon: XCircle },
            ].map((stat) => (
              <Card key={stat.label} variant="elevated" className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Last Message + Recent Messages */}
        {config?.is_verified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Last message */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Última Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                {lastMessage ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {statusIcon(lastMessage.status)}
                      <Badge variant="outline">{statusLabel(lastMessage.status)}</Badge>
                    </div>
                    <p className="text-sm"><strong>Template:</strong> {lastMessage.template_name}</p>
                    <p className="text-sm"><strong>Para:</strong> {lastMessage.recipient_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lastMessage.created_at).toLocaleString("pt-BR")}
                    </p>
                    {lastMessage.error_message && (
                      <p className="text-xs text-destructive">{lastMessage.error_message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
                )}
              </CardContent>
            </Card>

            {/* Recent messages */}
            <Card variant="elevated" className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Mensagens Recentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/whatsapp-logs")}>
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {messages.length > 0 ? (
                  <div className="space-y-2">
                    {messages.slice(0, 5).map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          {statusIcon(msg.status)}
                          <span className="text-sm">{msg.template_name}</span>
                          <span className="text-xs text-muted-foreground">→ {msg.recipient_number}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
