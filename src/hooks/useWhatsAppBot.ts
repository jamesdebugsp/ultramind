import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppBotStatus {
  isActive: boolean;
  botEnabled: boolean;
  planAllows: boolean;
  hasWhatsapp: boolean;
  subscriptionActive: boolean;
  trialUntil: string | null;
  isOverridden: boolean;
  overrideValue: boolean | null;
}

export interface BotControlUpdate {
  whatsapp_bot_enabled?: boolean;
  whatsapp_bot_override?: boolean | null;
  whatsapp_bot_trial_until?: string | null;
}

export function useWhatsAppBot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<WhatsAppBotStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBotStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch subscription and profile in parallel
      const [subscriptionResult, profileResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('whatsapp')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (subscriptionResult.error) throw subscriptionResult.error;
      if (profileResult.error) throw profileResult.error;

      const subscription = subscriptionResult.data;
      const profile = profileResult.data;

      if (!subscription) {
        setStatus({
          isActive: false,
          botEnabled: false,
          planAllows: false,
          hasWhatsapp: false,
          subscriptionActive: false,
          trialUntil: null,
          isOverridden: false,
          overrideValue: null,
        });
        setLoading(false);
        return;
      }

      const planAllows = subscription.plan === 'pro' || subscription.plan === 'premium';
      const hasWhatsapp = !!profile?.whatsapp && profile.whatsapp.trim() !== '';
      const subscriptionActive = subscription.status === 'active' || subscription.status === 'trial';
      const botEnabled = subscription.whatsapp_bot_enabled ?? false;
      const overrideValue = subscription.whatsapp_bot_override ?? null;
      const isOverridden = overrideValue !== null;
      const trialUntil = subscription.whatsapp_bot_trial_until;

      // Check if trial is active
      const trialActive = trialUntil && new Date(trialUntil) > new Date();

      // Calculate if bot is active based on all conditions
      let isActive = false;

      if (isOverridden) {
        // Admin override takes precedence
        isActive = overrideValue && hasWhatsapp && subscriptionActive;
      } else if (trialActive) {
        // Trial period is active
        isActive = hasWhatsapp && subscriptionActive;
      } else if (planAllows) {
        // Plan allows bot
        isActive = botEnabled && hasWhatsapp && subscriptionActive;
      }

      setStatus({
        isActive,
        botEnabled,
        planAllows,
        hasWhatsapp,
        subscriptionActive,
        trialUntil,
        isOverridden,
        overrideValue,
      });
    } catch (error: any) {
      console.error('Error fetching bot status:', error);
      toast({
        title: 'Erro ao carregar status do bot',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Enable bot (for users with PRO/PREMIUM plans)
  const enableBot = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ whatsapp_bot_enabled: true })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '🤖 Bot WhatsApp ativado!',
        description: 'O bot começará a responder automaticamente.',
      });

      await fetchBotStatus();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao ativar bot',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  // Disable bot (for users)
  const disableBot = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ whatsapp_bot_enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Bot WhatsApp desativado',
        description: 'O bot não responderá mais automaticamente.',
      });

      await fetchBotStatus();
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao desativar bot',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, [fetchBotStatus]);

  return {
    status,
    loading,
    enableBot,
    disableBot,
    refetch: fetchBotStatus,
  };
}

// Hook for admin control of bot
export function useAdminBotControl() {
  const { toast } = useToast();

  // Update bot settings for a specific user (admin only)
  const updateUserBotSettings = async (
    userId: string,
    updates: BotControlUpdate
  ) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Configuração do bot atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar bot',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  // Enable bot override (force on)
  const forceEnableBot = async (userId: string) => {
    return updateUserBotSettings(userId, { whatsapp_bot_override: true });
  };

  // Disable bot override (force off)
  const forceDisableBot = async (userId: string) => {
    return updateUserBotSettings(userId, { whatsapp_bot_override: false });
  };

  // Clear override (use plan rules)
  const clearBotOverride = async (userId: string) => {
    return updateUserBotSettings(userId, { whatsapp_bot_override: null });
  };

  // Grant trial period
  const grantBotTrial = async (userId: string, days: number = 7) => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + days);
    
    return updateUserBotSettings(userId, {
      whatsapp_bot_trial_until: trialEnd.toISOString(),
    });
  };

  // Revoke trial period
  const revokeBotTrial = async (userId: string) => {
    return updateUserBotSettings(userId, {
      whatsapp_bot_trial_until: null,
    });
  };

  return {
    updateUserBotSettings,
    forceEnableBot,
    forceDisableBot,
    clearBotOverride,
    grantBotTrial,
    revokeBotTrial,
  };
}
