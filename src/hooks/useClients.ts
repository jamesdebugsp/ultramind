import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...client, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setClients([data, ...clients]);
      toast({
        title: "Cliente adicionado!",
        description: "O cliente foi cadastrado com sucesso.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setClients(clients.map(c => c.id === id ? data : c));
      toast({
        title: "Cliente atualizado!",
        description: "Os dados foram salvos.",
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

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClients(clients.filter(c => c.id !== id));
      toast({
        title: "Cliente removido",
        description: "O cliente foi excluído.",
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
    fetchClients();
  }, [user]);

  return { clients, loading, createClient, updateClient, deleteClient, refetch: fetchClients };
}
