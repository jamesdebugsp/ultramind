import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CreditInfo {
  monthlyCredits: number;
  extraCredits: number;
  creditsUsed: number;
  availableCredits: number;
  creditsResetAt: string | null;
  plan: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_300', credits: 300, price: 29 },
  { id: 'pack_800', credits: 800, price: 59, popular: true },
  { id: 'pack_2000', credits: 2000, price: 119 },
];

export const PLAN_CREDITS: Record<string, number> = {
  basic: 0,
  pro: 600,
  premium: 2500,
};

export function useCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('monthly_credits, extra_credits, credits_used, credits_reset_at, plan')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const available = (data.monthly_credits + data.extra_credits) - data.credits_used;
        setCreditInfo({
          monthlyCredits: data.monthly_credits,
          extraCredits: data.extra_credits,
          creditsUsed: data.credits_used,
          availableCredits: Math.max(0, available),
          creditsResetAt: data.credits_reset_at,
          plan: data.plan,
        });
      }
    } catch (error: any) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getAvailableCredits = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    const { data, error } = await supabase.rpc('get_available_credits', { p_user_id: user.id });
    if (error) {
      console.error('Error getting available credits:', error);
      return 0;
    }
    return data || 0;
  }, [user]);

  const addExtraCredits = async (amount: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('add_extra_credits', { 
        p_user_id: user.id, 
        p_amount: amount 
      });

      if (error) throw error;

      toast({
        title: 'Créditos adicionados!',
        description: `${amount} créditos foram adicionados à sua conta.`,
      });

      await fetchCredits();
      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar créditos',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Admin function to add credits to any user
  const grantCreditsToUser = async (userId: string, amount: number): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('add_extra_credits', { 
        p_user_id: userId, 
        p_amount: amount 
      });

      if (error) throw error;

      toast({
        title: 'Créditos concedidos!',
        description: `${amount} créditos concedidos ao usuário.`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Erro ao conceder créditos',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const getUsagePercentage = (): number => {
    if (!creditInfo) return 0;
    const total = creditInfo.monthlyCredits + creditInfo.extraCredits;
    if (total === 0) return 0;
    return Math.round((creditInfo.creditsUsed / total) * 100);
  };

  const isLowCredits = (): boolean => {
    if (!creditInfo) return false;
    return creditInfo.availableCredits > 0 && creditInfo.availableCredits <= 50;
  };

  const hasNoCredits = (): boolean => {
    if (!creditInfo) return true;
    return creditInfo.availableCredits === 0;
  };

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    creditInfo,
    loading,
    getAvailableCredits,
    addExtraCredits,
    grantCreditsToUser,
    getUsagePercentage,
    isLowCredits,
    hasNoCredits,
    refetch: fetchCredits,
    packages: CREDIT_PACKAGES,
    planCredits: PLAN_CREDITS,
  };
}
