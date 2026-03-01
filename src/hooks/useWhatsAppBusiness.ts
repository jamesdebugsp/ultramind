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
  retry_count: number;
  created_at: string;
}

export interface WhatsAppPlan {
  id: string;
  user_id: string;
  plan_type: string;
  monthly_limit: number;
  messages_sent_current_month: number;
  reset_date: string;
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
  const [plan, setPlan] = useState<WhatsAppPlan | null>(null);
  const [stats, setStats] = useState<MessageStats>({
    total: 0, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("companies_whatsapp_config")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error) setConfig(data as WhatsAppBusinessConfig | null);
  }, [user]);

  const fetchPlan = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("company_whatsapp_plans")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error) setPlan(data as WhatsAppPlan | null);
  }, [user]);

  const fetchMessages = useCallback(async (filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
  }) => {
    if (!user) return;
    let query = supabase
      .from("whatsapp_business_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(filters?.limit || 50);

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo + "T23:59:59");
    }
    if (filters?.search) {
      query = query.ilike("recipient_number", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    const msgs = (data || []) as WhatsAppBusinessMessage[];
    setMessages(msgs);

    const s: MessageStats = { total: msgs.length, sent: 0, delivered: 0, read: 0, failed: 0, pending: 0 };
    msgs.forEach((m) => {
      if (m.status === "sent" || m.status === "sending") s.sent++;
      else if (m.status === "delivered") s.delivered++;
      else if (m.status === "read") s.read++;
      else if (m.status === "failed") s.failed++;
      else s.pending++;
    });
    setStats(s);
  }, [user]);

  const connectWhatsApp = async (
    phoneNumberId: string,
    accessToken: string,
    businessAccountId: string
  ) => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-business-connect",
        {
          body: {
            phone_number_id: phoneNumberId,
            access_token: accessToken,
            business_account_id: businessAccountId,
          },
        }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.details || data.error);

      toast({
        title: "✅ WhatsApp Business conectado!",
        description: `Número: ${data.phone_display || phoneNumberId}`,
      });
      await Promise.all([fetchConfig(), fetchPlan()]);
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
    const { error } = await supabase
      .from("companies_whatsapp_config")
      .delete()
      .eq("user_id", user.id);
    if (!error) {
      setConfig(null);
      toast({ title: "WhatsApp desconectado" });
    }
  };

  const sendTemplate = async (
    to: string,
    templateName: string,
    parameters: string[] = [],
    language = "pt_BR"
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp-business-send",
        { body: { to, template_name: templateName, parameters, language } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.details || data.error);

      toast({ title: "✅ Mensagem enviada!", description: `Template: ${templateName}` });
      await Promise.all([fetchMessages(), fetchPlan()]);
      return { success: true, data };
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchConfig(), fetchPlan(), fetchMessages()]).finally(() =>
        setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, [user, fetchConfig, fetchPlan, fetchMessages]);

  return {
    config,
    messages,
    plan,
    stats,
    loading,
    connecting,
    connectWhatsApp,
    disconnectWhatsApp,
    sendTemplate,
    fetchMessages,
    refetch: () => Promise.all([fetchConfig(), fetchPlan(), fetchMessages()]),
  };
}
