import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Save, 
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  message: string;
}

const initialTemplates: MessageTemplate[] = [
  {
    id: "confirmation",
    name: "Confirmação de Agendamento",
    description: "Enviada quando um novo agendamento é criado",
    icon: CheckCircle2,
    enabled: true,
    message: `Agendamento confirmado! 🎉

Olá {{nome_cliente}}!

Seu agendamento foi confirmado com sucesso:

📅 Data: {{data}}
⏰ Horário: {{hora}}
✂️ Serviço: {{servico}}
📍 Local: {{nome_estabelecimento}}

Qualquer dúvida, estamos à disposição!

UltraMind Solutions — AgendePro`,
  },
  {
    id: "reminder_24h",
    name: "Lembrete 24 Horas",
    description: "Enviada 24 horas antes do agendamento",
    icon: Clock,
    enabled: true,
    message: `Lembrete de agendamento! ⏰

Olá {{nome_cliente}}!

Passando para lembrar do seu agendamento amanhã:

📅 Data: {{data}}
⏰ Horário: {{hora}}
✂️ Serviço: {{servico}}

Confirme sua presença respondendo esta mensagem!

{{nome_estabelecimento}}`,
  },
  {
    id: "reminder_1h",
    name: "Lembrete 1 Hora",
    description: "Enviada 1 hora antes do agendamento",
    icon: Bell,
    enabled: true,
    message: `Seu horário é daqui a pouco! ⏰

Olá {{nome_cliente}}!

Seu agendamento é em 1 hora:

⏰ Horário: {{hora}}
✂️ Serviço: {{servico}}

Estamos te esperando! 😊

{{nome_estabelecimento}}`,
  },
  {
    id: "merchant_notification",
    name: "Notificação para Comerciante",
    description: "Enviada para você quando há novo agendamento",
    icon: Calendar,
    enabled: true,
    message: `Novo agendamento confirmado! 📅

👤 Cliente: {{nome_cliente}}
📱 WhatsApp: {{telefone_cliente}}
📅 Data: {{data}}
⏰ Horário: {{hora}}
✂️ Serviço: {{servico}}

UltraMind Solutions — AgendePro`,
  },
  {
    id: "cancellation",
    name: "Cancelamento",
    description: "Enviada quando um agendamento é cancelado",
    icon: XCircle,
    enabled: true,
    message: `Agendamento cancelado

Olá {{nome_cliente}},

Seu agendamento para {{data}} às {{hora}} foi cancelado.

Se precisar reagendar, acesse nossa página:
{{link_agendamento}}

{{nome_estabelecimento}}`,
  },
  {
    id: "reschedule",
    name: "Reagendamento",
    description: "Enviada quando um agendamento é alterado",
    icon: Calendar,
    enabled: true,
    message: `Agendamento alterado! 📅

Olá {{nome_cliente}}!

Seu agendamento foi alterado:

📅 Nova data: {{data}}
⏰ Novo horário: {{hora}}
✂️ Serviço: {{servico}}

Qualquer dúvida, estamos à disposição!

{{nome_estabelecimento}}`,
  },
];

export default function BotWhatsApp() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleTemplate = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  const updateMessage = (id: string, message: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, message } : t
    ));
  };

  const handleSave = () => {
    setEditingTemplate(null);
    toast({
      title: "Mensagens salvas!",
      description: "Suas configurações do bot foram atualizadas.",
    });
  };

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
              Bot WhatsApp
            </h1>
            <p className="text-muted-foreground">
              Configure as mensagens automáticas
            </p>
          </div>
          <Button variant="hero" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </motion.div>

        {/* Variables Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card variant="elevated" className="p-6 bg-highlight/5 border-highlight/20">
            <h3 className="font-semibold text-foreground mb-3">📝 Variáveis disponíveis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{nome_cliente}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{telefone_cliente}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{data}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{hora}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{servico}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{nome_estabelecimento}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{link_agendamento}}"}</code>
              <code className="bg-muted px-2 py-1 rounded text-muted-foreground">{"{{profissional}}"}</code>
            </div>
          </Card>
        </motion.div>

        {/* Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {templates.map((template) => (
            <Card 
              key={template.id} 
              variant="elevated" 
              className={`p-4 lg:p-6 ${!template.enabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  template.enabled ? 'gradient-accent' : 'bg-muted'
                }`}>
                  <template.icon className={`w-6 h-6 ${
                    template.enabled ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={() => toggleTemplate(template.id)}
                      />
                    </div>
                  </div>
                  
                  {template.enabled && (
                    <div className="mt-4">
                      {editingTemplate === template.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={template.message}
                            onChange={(e) => updateMessage(template.id, e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="hero" 
                              size="sm"
                              onClick={() => setEditingTemplate(null)}
                            >
                              Concluir Edição
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="bg-muted/30 rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                          onClick={() => setEditingTemplate(template.id)}
                        >
                          <div className="flex items-start justify-between">
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                              {template.message}
                            </pre>
                            <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
