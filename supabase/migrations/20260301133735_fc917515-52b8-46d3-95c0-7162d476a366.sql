
-- Tabela de planos WhatsApp por empresa
CREATE TABLE public.company_whatsapp_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  messages_sent_current_month INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_whatsapp_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own whatsapp plan"
  ON public.company_whatsapp_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp plan"
  ON public.company_whatsapp_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp plan"
  ON public.company_whatsapp_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all whatsapp plans"
  ON public.company_whatsapp_plans FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Super admins can view all whatsapp plans"
  ON public.company_whatsapp_plans FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all whatsapp plans"
  ON public.company_whatsapp_plans FOR ALL
  USING (public.is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_whatsapp_plans_updated_at
  BEFORE UPDATE ON public.company_whatsapp_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_company_whatsapp_plans_user_id ON public.company_whatsapp_plans(user_id);
CREATE INDEX idx_company_whatsapp_plans_reset_date ON public.company_whatsapp_plans(reset_date);

-- Function to check and consume WhatsApp Business message limit
CREATE OR REPLACE FUNCTION public.check_and_consume_wa_limit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
BEGIN
  SELECT * INTO v_plan FROM company_whatsapp_plans WHERE user_id = p_user_id;
  
  -- Auto-create basic plan if not exists
  IF NOT FOUND THEN
    INSERT INTO company_whatsapp_plans (user_id) VALUES (p_user_id);
    RETURN TRUE;
  END IF;
  
  -- Check if reset needed
  IF now() >= v_plan.reset_date THEN
    UPDATE company_whatsapp_plans
    SET messages_sent_current_month = 0,
        reset_date = date_trunc('month', now()) + interval '1 month'
    WHERE user_id = p_user_id;
    v_plan.messages_sent_current_month := 0;
  END IF;
  
  -- Unlimited plan
  IF v_plan.monthly_limit = -1 THEN
    UPDATE company_whatsapp_plans
    SET messages_sent_current_month = messages_sent_current_month + 1
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Check limit
  IF v_plan.messages_sent_current_month >= v_plan.monthly_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  UPDATE company_whatsapp_plans
  SET messages_sent_current_month = messages_sent_current_month + 1
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to reset all monthly counters (for cron job)
CREATE OR REPLACE FUNCTION public.reset_wa_monthly_counters()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE company_whatsapp_plans
  SET messages_sent_current_month = 0,
      reset_date = date_trunc('month', now()) + interval '1 month'
  WHERE reset_date <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Auto-create WhatsApp plan when user connects WhatsApp
CREATE OR REPLACE FUNCTION public.auto_create_wa_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO company_whatsapp_plans (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_wa_plan_on_connect
  AFTER INSERT ON public.companies_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_wa_plan();
