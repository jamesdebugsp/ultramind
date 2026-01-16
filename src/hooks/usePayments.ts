import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  user_id: string;
  type: 'plan' | 'credits';
  plan: string | null;
  credits_amount: number | null;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';
  payment_method: 'pix' | 'credit_card' | 'boleto' | null;
  external_id: string | null;
  external_reference: string | null;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  pix_copy_paste: string | null;
  boleto_url: string | null;
  boleto_barcode: string | null;
  boleto_expiration: string | null;
  card_last_four: string | null;
  card_brand: string | null;
  installments: number | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  type: 'plan' | 'credits';
  plan?: 'basic' | 'pro' | 'premium';
  credits_package?: 'pack_300' | 'pack_800' | 'pack_2000';
  payment_method: 'pix' | 'credit_card' | 'boleto';
  card_token?: string;
  installments?: number;
  payer_email?: string;
  payer_name?: string;
  payer_cpf?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  payment_id: string;
  external_id: string;
  status: string;
  status_detail?: string;
  pix?: {
    qr_code: string;
    qr_code_base64: string;
    expires_at: string;
  };
  boleto?: {
    url: string;
    barcode: string;
    expires_at: string;
  };
  error?: string;
}

export function usePayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as Payment[]);
    } catch (error: unknown) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPayment = async (request: CreatePaymentRequest): Promise<CreatePaymentResponse | null> => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para fazer um pagamento',
        variant: 'destructive',
      });
      return null;
    }

    setCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-payment', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as CreatePaymentResponse;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      // Refresh payments list
      await fetchPayments();

      if (data.status === 'approved') {
        toast({
          title: 'Pagamento aprovado!',
          description: 'Seu pagamento foi processado com sucesso.',
        });
      } else if (data.status === 'pending') {
        if (request.payment_method === 'pix') {
          toast({
            title: 'PIX gerado!',
            description: 'Escaneie o QR Code ou copie o código para pagar.',
          });
        } else if (request.payment_method === 'boleto') {
          toast({
            title: 'Boleto gerado!',
            description: 'Clique para baixar e pagar o boleto.',
          });
        }
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro no pagamento',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return data as Payment;
    } catch (error: unknown) {
      console.error('Error fetching payment:', error);
      return null;
    }
  };

  const pollPaymentStatus = useCallback(async (
    paymentId: string, 
    onStatusChange: (status: string) => void,
    maxAttempts = 60,
    intervalMs = 5000
  ) => {
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Payment polling stopped: max attempts reached');
        return;
      }

      const payment = await getPaymentById(paymentId);
      if (!payment) return;

      if (payment.status !== 'pending') {
        onStatusChange(payment.status);
        await fetchPayments();
        return;
      }

      attempts++;
      setTimeout(poll, intervalMs);
    };

    poll();
  }, [fetchPayments]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Payment change:', payload);
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPayments]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    creating,
    createPayment,
    getPaymentById,
    pollPaymentStatus,
    refetch: fetchPayments,
  };
}
