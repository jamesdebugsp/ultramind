import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  user_id: string;
  business_name: string | null;
  owner_name: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  subscription?: {
    plan: string;
    status: string;
    current_period_end: string | null;
    whatsapp_bot_enabled: boolean;
    whatsapp_bot_override: boolean | null;
    whatsapp_bot_trial_until: string | null;
    whatsapp_enabled: boolean;
  };
  role?: string;
}

export function useAdminData() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subsError) throw subsError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const combinedUsers: AdminUser[] = (profiles || []).map(profile => {
        const sub = subscriptions?.find(s => s.user_id === profile.user_id);
        const userRole = roles?.find(r => r.user_id === profile.user_id);

        return {
          ...profile,
          whatsapp: profile.whatsapp,
          subscription: sub ? {
            plan: sub.plan,
            status: sub.status,
            current_period_end: sub.current_period_end,
            whatsapp_bot_enabled: sub.whatsapp_bot_enabled ?? false,
            whatsapp_bot_override: sub.whatsapp_bot_override ?? null,
            whatsapp_bot_trial_until: sub.whatsapp_bot_trial_until ?? null,
            whatsapp_enabled: sub.whatsapp_enabled ?? false,
          } : undefined,
          role: userRole?.role || 'user',
        };
      });

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserSubscription = async (
    userId: string, 
    updates: { 
      plan?: 'basic' | 'pro' | 'premium'; 
      status?: 'active' | 'trial' | 'inactive' | 'cancelled';
      whatsapp_bot_enabled?: boolean;
      whatsapp_bot_override?: boolean | null;
      whatsapp_bot_trial_until?: string | null;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário atualizado',
        description: 'Alterações salvas com sucesso.',
      });

      await fetchAllUsers();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'user') => {
    try {
      // Delete existing roles for this user first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
        });

      if (error) throw error;

      toast({
        title: 'Função atualizada',
        description: `Usuário agora é ${newRole}.`,
      });

      await fetchAllUsers();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar função',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  // Bot-specific admin functions
  const toggleBotOverride = async (userId: string, forceValue: boolean | null) => {
    return updateUserSubscription(userId, { whatsapp_bot_override: forceValue });
  };

  const grantBotTrial = async (userId: string, days: number = 7) => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + days);
    return updateUserSubscription(userId, { whatsapp_bot_trial_until: trialEnd.toISOString() });
  };

  const revokeBotTrial = async (userId: string) => {
    return updateUserSubscription(userId, { whatsapp_bot_trial_until: null });
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return { 
    users, 
    loading, 
    updateUserSubscription, 
    updateUserRole, 
    toggleBotOverride,
    grantBotTrial,
    revokeBotTrial,
    refetch: fetchAllUsers 
  };
}
