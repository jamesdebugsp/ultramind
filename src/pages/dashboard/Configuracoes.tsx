import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Save, 
  Store,
  Phone,
  Instagram,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProfile } from "@/hooks/useProfile";
import { useSettings } from "@/hooks/useSettings";

export default function Configuracoes() {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: "",
    whatsapp: "",
    instagram: "",
    address: "",
    description: "",
  });

  const [notifications, setNotifications] = useState({
    send_reminders: true,
    auto_confirm: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        whatsapp: profile.whatsapp || "",
        instagram: profile.instagram || "",
        address: profile.address || "",
        description: profile.description || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setNotifications({
        send_reminders: settings.send_reminders ?? true,
        auto_confirm: settings.auto_confirm ?? false,
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    await updateProfile({
      business_name: formData.business_name || null,
      whatsapp: formData.whatsapp || null,
      instagram: formData.instagram || null,
      address: formData.address || null,
      description: formData.description || null,
    });
    
    await updateSettings({
      send_reminders: notifications.send_reminders,
      auto_confirm: notifications.auto_confirm,
    });
    
    setIsSaving(false);
  };

  const loading = profileLoading || settingsLoading;

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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do seu estabelecimento
            </p>
          </div>
          <Button variant="hero" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </motion.div>

        <div className="space-y-6">
          {/* Business Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Informações do Estabelecimento</h3>
                  <p className="text-sm text-muted-foreground">Dados exibidos na página pública</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Nome do estabelecimento</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="Nome do seu negócio"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="instagram"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="@seunegocio"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-10 min-h-[80px]"
                      placeholder="Endereço completo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Breve descrição do seu negócio"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  <p className="text-sm text-muted-foreground">Configure as notificações automáticas</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Enviar lembretes</p>
                    <p className="text-sm text-muted-foreground">Enviar lembrete antes dos agendamentos</p>
                  </div>
                  <Switch
                    checked={notifications.send_reminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, send_reminders: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Auto-confirmar agendamentos</p>
                    <p className="text-sm text-muted-foreground">Confirmar automaticamente novos agendamentos</p>
                  </div>
                  <Switch
                    checked={notifications.auto_confirm}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, auto_confirm: checked })}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Plano & Pagamentos</h3>
                  <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-highlight/5 rounded-lg border border-highlight/20">
                <div className="mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">Plano Gratuito</p>
                    <Badge variant="highlight">Ativo</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Funcionalidades básicas incluídas</p>
                </div>
                <Button variant="outline">
                  Fazer Upgrade
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Segurança</h3>
                  <p className="text-sm text-muted-foreground">Configurações de acesso e segurança</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full sm:w-auto">
                  Alterar Senha
                </Button>
                <Button variant="outline" className="w-full sm:w-auto ml-0 sm:ml-4">
                  Alterar E-mail
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
