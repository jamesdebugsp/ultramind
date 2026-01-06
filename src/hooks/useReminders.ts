import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Reminder {
  id: string;
  appointment_id: string;
  user_id: string;
  reminder_type: string;
  scheduled_for: string;
  sent_at: string | null;
  status: string;
  message: string | null;
  created_at: string;
}

export function useReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (appointmentId: string, scheduledFor: Date, message?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          scheduled_for: scheduledFor.toISOString(),
          message: message || null,
          status: 'pending',
          reminder_type: 'whatsapp',
        })
        .select()
        .single();

      if (error) throw error;

      setReminders([...reminders, data]);
      toast({
        title: 'Lembrete criado!',
        description: 'O cliente será notificado automaticamente.',
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar lembrete',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const sendReminder = async (appointmentId: string, appointment: {
    client_name: string;
    client_whatsapp: string;
    date: string;
    time: string;
    service_name: string;
    business_name: string;
    business_whatsapp: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Create reminder record
      const scheduledFor = new Date(`${appointment.date}T${appointment.time}`);
      scheduledFor.setHours(scheduledFor.getHours() - 2); // 2 hours before

      const message = `🔔 *Lembrete de Agendamento*

Olá ${appointment.client_name}!

Seu horário está chegando:
📅 *Data:* ${new Date(appointment.date + 'T12:00:00').toLocaleDateString('pt-BR')}
⏰ *Horário:* ${appointment.time}
💼 *Serviço:* ${appointment.service_name}
🏢 *Local:* ${appointment.business_name}

Confirme sua presença respondendo esta mensagem.

_Lembrete automático UltraMind_`;

      // Open WhatsApp immediately
      const cleanPhone = appointment.client_whatsapp.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      // Save reminder to database
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          scheduled_for: scheduledFor.toISOString(),
          sent_at: new Date().toISOString(),
          message,
          status: 'sent',
          reminder_type: 'whatsapp',
        })
        .select()
        .single();

      if (error) throw error;

      setReminders([...reminders, data]);
      toast({
        title: 'Lembrete enviado!',
        description: `Mensagem enviada para ${appointment.client_name}.`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar lembrete',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReminders(reminders.filter(r => r.id !== id));

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir lembrete',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user]);

  return { reminders, loading, createReminder, sendReminder, deleteReminder, refetch: fetchReminders };
}
