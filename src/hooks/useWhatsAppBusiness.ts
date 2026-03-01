import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppBusinessConfig {
  id: string;
  user_id: string;
  phone_number_id: string;
  business_account_id: string;
  is_verified: boolean;
  verified_at: string | null;
  phone_display: string | null;
  business_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppBusinessMessage {
  id: string;
  user_id: string;
  recipient_number: string;
  message_id: string | null;
  template_name: string;
  template_params: any[];
  status: string;
  status_updated_at: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
}

export interface MessageStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
}

export function useWhatsAppBusiness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<WhatsAppBusinessConfig | null>(null);
  const [messages, setMessages] = useState<WhatsAppBusinessMessage[]>([]);
  const [stats, setStats] = useState<MessageStats>({ total: 0, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("companies_whatsapp_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as WhatsAppBusinessConfig | null);
    } catch (err: any) {
      console.error("Error fetching WhatsApp config:", err);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("whatsapp_business_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      const msgs = (data || []) as WhatsAppBusinessMessage[];
      setMessages(msgs);

      // Calculate stats
      const s: MessageStats = { total: msgs.length, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
      msgs.forEach((m) => {
        if (m.status === "sent" || m.status === "sending") s.sent++;
        else if (m.status === "delivered") s.delivered++;
        else if (m.status === "read") s.read++;
        else if (m.status === "failed") s.failed++;
        else s.pending++;
      });
      setStats(s);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
    }
  }, [user]);

  const connectWhatsApp = async (phoneNumberId: string, accessToken: string, businessAccountId: string) => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-business-connect", {
        body: {
          phone_number_id: phoneNumberId,
          access_token: accessToken,
          business_account_id: businessAccountId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✅ WhatsApp Business conectado!",
        description: `Número: ${data.phone_display || phoneNumberId}`,
      });

      await fetchConfig();
      return { success: true, data };
    } catch (err: any) {
      toast({
        title: "Erro ao conectar WhatsApp",
        description: err.message,
        variant: "destructive",
      });
      return { success: false, error: err };
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("companies_whatsapp_config")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setConfig(null);
      toast({ title: "WhatsApp desconectado", description: "Sua configuração foi removida." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const sendTemplate = async (to: string, templateName: string, parameters: string[] = [], language = "pt_BR") => {
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-business-send", {
        body: { to, template_name: templateName, parameters, language },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Mensagem enviada!", description: `Template: ${templateName}` });
      await fetchMessages();
      return { success: true, data };
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchConfig(), fetchMessages()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchConfig, fetchMessages]);

  return {
    config,
    messages,
    stats,
    loading,
    connecting,
    connectWhatsApp,
    disconnectWhatsApp,
    sendTemplate,
    refetch: () => Promise.all([fetchConfig(), fetchMessages()]),
  };
}
