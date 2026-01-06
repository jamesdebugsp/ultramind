import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type SubscriptionPlan = 'basic' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'trial' | 'inactive' | 'cancelled';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  max_appointments: number;
  whatsapp_enabled: boolean;
  reminders_enabled: boolean;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_FEATURES: Record<SubscriptionPlan, { maxAppointments: number; whatsapp: boolean; reminders: boolean; price: number }> = {
  basic: { maxAppointments: 50, whatsapp: false, reminders: false, price: 49 },
  pro: { maxAppointments: 200, whatsapp: true, reminders: true, price: 99 },
  premium: { maxAppointments: -1, whatsapp: true, reminders: true, price: 199 }, // -1 = unlimited
};

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If no subscription exists, create one
      if (!data) {
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSubscription(newSub as Subscription);
      } else {
        setSubscription(data as Subscription);
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (newPlan: SubscriptionPlan) => {
    if (!user || !subscription) return { error: new Error('Not authenticated') };

    const features = PLAN_FEATURES[newPlan];

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan: newPlan,
          max_appointments: features.maxAppointments,
          whatsapp_enabled: features.whatsapp,
          reminders_enabled: features.reminders,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSubscription(data as Subscription);
      toast({
        title: 'Plano atualizado!',
        description: `Você agora está no plano ${newPlan.toUpperCase()}.`,
      });

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar plano',
        description: error.message,
        variant: 'destructive',
      });
      return { data: null, error };
    }
  };

  const canUseFeature = (feature: 'whatsapp' | 'reminders'): boolean => {
    if (!subscription) return false;
    if (feature === 'whatsapp') return subscription.whatsapp_enabled;
    if (feature === 'reminders') return subscription.reminders_enabled;
    return false;
  };

  const isWithinLimit = (currentAppointments: number): boolean => {
    if (!subscription) return false;
    if (subscription.max_appointments === -1) return true; // Unlimited
    return currentAppointments < subscription.max_appointments;
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    changePlan,
    canUseFeature,
    isWithinLimit,
    refetch: fetchSubscription,
    planFeatures: PLAN_FEATURES,
  };
}
