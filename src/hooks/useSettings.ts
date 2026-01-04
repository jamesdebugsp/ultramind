import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Settings {
  id: string;
  user_id: string;
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  appointment_interval: number;
  auto_confirm: boolean;
  send_reminders: boolean;
  reminder_hours: number;
  theme: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          ...(data as any),
          working_days: Array.isArray((data as any).working_days)
            ? ((data as any).working_days as string[])
            : [],
        });
      } else {
        setSettings(null);
      }
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setSettings(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!user) return { data: null, error: new Error("Not authenticated") };

    setError(null);

    try {
      const { data, error } = await supabase
        .from("settings")
        .upsert(
          {
            user_id: user.id,
            ...updates,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) throw error;

      // Rebusca após salvar (persistência real)
      await fetchSettings();

      toast({
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas.",
      });

      return { data: data as Settings, error: null };
    } catch (err: any) {
      setError(err);
      toast({
        title: "Erro ao salvar",
        description: err?.message,
        variant: "destructive",
      });
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}

