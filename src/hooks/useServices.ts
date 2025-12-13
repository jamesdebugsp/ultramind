import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (service: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('services')
        .insert({ ...service, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setServices([data, ...services]);
      toast({
        title: "Serviço criado!",
        description: "O serviço foi adicionado com sucesso.",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setServices(services.map(s => s.id === id ? data : s));
      toast({
        title: "Serviço atualizado!",
        description: "As alterações foram salvas.",
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

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setServices(services.filter(s => s.id !== id));
      toast({
        title: "Serviço removido",
        description: "O serviço foi excluído.",
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
    fetchServices();
  }, [user]);

  return { services, loading, createService, updateService, deleteService, refetch: fetchServices };
}
