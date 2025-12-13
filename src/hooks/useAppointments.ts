import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string | null;
  service_id: string | null;
  client_name: string;
  client_whatsapp: string | null;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appointment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setAppointments([...appointments, data].sort((a, b) => 
        `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
      ));
      
      toast({
        title: "Agendamento criado! ✓",
        description: "O cliente receberá uma confirmação.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao agendar",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const updateData = { ...updates };
      
      // If confirming, set confirmed_at
      if (updates.status === 'confirmado' && !updates.confirmed_at) {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(appointments.map(a => a.id === id ? data : a));
      toast({
        title: "Status atualizado",
        description: `Agendamento marcado como ${updates.status}`,
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(appointments.filter(a => a.id !== id));
      toast({
        title: "Agendamento removido",
        description: "O agendamento foi excluído.",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  return { appointments, loading, createAppointment, updateAppointment, deleteAppointment, refetch: fetchAppointments };
}
