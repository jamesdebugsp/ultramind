import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          ...data,
          working_days: Array.isArray(data.working_days) ? data.working_days as string[] : []
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setSettings({
        ...data,
        working_days: Array.isArray(data.working_days) ? data.working_days as string[] : []
      });
      toast({
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
