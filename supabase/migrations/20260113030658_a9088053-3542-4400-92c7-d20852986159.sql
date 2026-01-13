-- =============================================
-- SISTEMA DE CRÉDITOS WHATSAPP - ULTRAMIND
-- =============================================

-- 1. Adicionar campos de créditos na tabela subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS monthly_credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP WITH TIME ZONE;

-- 2. Atualizar créditos baseado no plano atual
UPDATE public.subscriptions 
SET monthly_credits = CASE 
    WHEN plan = 'pro' THEN 600
    WHEN plan = 'premium' THEN 2500
    ELSE 0
END,
credits_reset_at = COALESCE(current_period_start, now())
WHERE monthly_credits = 0;

-- 3. Função para verificar créditos disponíveis
CREATE OR REPLACE FUNCTION public.get_available_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_credits INTEGER;
  v_extra_credits INTEGER;
  v_credits_used INTEGER;
  v_available INTEGER;
BEGIN
  SELECT monthly_credits, extra_credits, credits_used
  INTO v_monthly_credits, v_extra_credits, v_credits_used
  FROM public.subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_available := (v_monthly_credits + v_extra_credits) - v_credits_used;
  
  RETURN GREATEST(0, v_available);
END;
$$;

-- 4. Função para consumir crédito
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  v_available := public.get_available_credits(p_user_id);
  
  IF v_available < p_amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.subscriptions
  SET credits_used = credits_used + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- 5. Função para adicionar créditos extras
CREATE OR REPLACE FUNCTION public.add_extra_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET extra_credits = extra_credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- 6. Função para resetar créditos mensais (chamada quando muda o período)
CREATE OR REPLACE FUNCTION public.reset_monthly_credits(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET credits_used = 0,
      credits_reset_at = now(),
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- 7. Trigger para atualizar créditos quando muda o plano
CREATE OR REPLACE FUNCTION public.handle_subscription_credits_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar créditos mensais baseado no novo plano
  IF NEW.plan = 'pro' THEN
    NEW.monthly_credits := 600;
  ELSIF NEW.plan = 'premium' THEN
    NEW.monthly_credits := 2500;
  ELSE
    NEW.monthly_credits := 0;
  END IF;
  
  -- Se mudou de período, resetar créditos usados
  IF OLD.current_period_start IS DISTINCT FROM NEW.current_period_start THEN
    NEW.credits_used := 0;
    NEW.credits_reset_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver conflito
DROP TRIGGER IF EXISTS on_subscription_credits_change ON public.subscriptions;

-- Criar novo trigger
CREATE TRIGGER on_subscription_credits_change
BEFORE UPDATE OF plan, current_period_start ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_subscription_credits_change();

-- 8. Verificar se o bot pode enviar mensagem (inclui créditos)
CREATE OR REPLACE FUNCTION public.can_send_whatsapp_message(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot_active BOOLEAN;
  v_credits INTEGER;
BEGIN
  -- Verificar se bot está ativo
  v_bot_active := public.is_whatsapp_bot_active(p_user_id);
  IF NOT v_bot_active THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar créditos
  v_credits := public.get_available_credits(p_user_id);
  
  RETURN v_credits > 0;
END;
$$;