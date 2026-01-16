-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create payments table to track all payment transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'plan', -- 'plan' or 'credits'
  plan TEXT, -- 'basic', 'pro', 'premium' (only for plan payments)
  credits_amount INTEGER, -- only for credit purchases
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
  payment_method TEXT, -- 'pix', 'credit_card', 'boleto'
  external_id TEXT, -- Mercado Pago payment ID
  external_reference TEXT, -- Our internal reference
  pix_qr_code TEXT, -- PIX QR Code data
  pix_qr_code_base64 TEXT, -- PIX QR Code image
  pix_copy_paste TEXT, -- PIX copy-paste code
  boleto_url TEXT, -- Boleto PDF URL
  boleto_barcode TEXT, -- Boleto barcode
  boleto_expiration DATE, -- Boleto expiration date
  card_last_four TEXT, -- Last 4 digits of card
  card_brand TEXT, -- Card brand (visa, mastercard, etc)
  installments INTEGER DEFAULT 1, -- Number of installments
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_external_id ON public.payments(external_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- RLS Policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all payments"
ON public.payments FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Service role can manage all payments"
ON public.payments FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to process approved payments
CREATE OR REPLACE FUNCTION public.process_approved_payment(p_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  
  IF v_payment.status != 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Process based on payment type
  IF v_payment.type = 'plan' THEN
    -- Update subscription based on plan
    IF v_payment.plan = 'basic' THEN
      UPDATE subscriptions SET
        plan = 'basic',
        status = 'active',
        max_appointments = 50,
        whatsapp_enabled = false,
        reminders_enabled = false,
        monthly_credits = 0,
        current_period_start = now(),
        current_period_end = now() + interval '30 days',
        updated_at = now()
      WHERE user_id = v_payment.user_id;
    ELSIF v_payment.plan = 'pro' THEN
      UPDATE subscriptions SET
        plan = 'pro',
        status = 'active',
        max_appointments = 200,
        whatsapp_enabled = true,
        reminders_enabled = true,
        monthly_credits = 600,
        credits_used = 0,
        credits_reset_at = now() + interval '30 days',
        current_period_start = now(),
        current_period_end = now() + interval '30 days',
        updated_at = now()
      WHERE user_id = v_payment.user_id;
    ELSIF v_payment.plan = 'premium' THEN
      UPDATE subscriptions SET
        plan = 'premium',
        status = 'active',
        max_appointments = -1,
        whatsapp_enabled = true,
        reminders_enabled = true,
        whatsapp_bot_enabled = true,
        monthly_credits = 2500,
        credits_used = 0,
        credits_reset_at = now() + interval '30 days',
        current_period_start = now(),
        current_period_end = now() + interval '30 days',
        updated_at = now()
      WHERE user_id = v_payment.user_id;
    END IF;
  ELSIF v_payment.type = 'credits' THEN
    -- Add extra credits
    UPDATE subscriptions SET
      extra_credits = extra_credits + COALESCE(v_payment.credits_amount, 0),
      updated_at = now()
    WHERE user_id = v_payment.user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;