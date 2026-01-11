-- Add WhatsApp bot control fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS whatsapp_bot_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_bot_override BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whatsapp_bot_trial_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create a function to check if WhatsApp bot is active for a user
CREATE OR REPLACE FUNCTION public.is_whatsapp_bot_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_profile RECORD;
  v_result BOOLEAN := false;
BEGIN
  -- Get subscription info
  SELECT * INTO v_subscription 
  FROM public.subscriptions 
  WHERE user_id = p_user_id;
  
  -- Get profile info (for WhatsApp number)
  SELECT * INTO v_profile 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- If no subscription or profile, return false
  IF v_subscription IS NULL OR v_profile IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if subscription is active
  IF v_subscription.status NOT IN ('active', 'trial') THEN
    RETURN false;
  END IF;
  
  -- Check if WhatsApp number is registered
  IF v_profile.whatsapp IS NULL OR v_profile.whatsapp = '' THEN
    RETURN false;
  END IF;
  
  -- Check for manual override (admin control)
  IF v_subscription.whatsapp_bot_override IS NOT NULL THEN
    -- Admin has explicitly set the bot status
    RETURN v_subscription.whatsapp_bot_override;
  END IF;
  
  -- Check for trial period
  IF v_subscription.whatsapp_bot_trial_until IS NOT NULL AND v_subscription.whatsapp_bot_trial_until > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check if plan allows bot (PRO or PREMIUM)
  IF v_subscription.plan IN ('pro', 'premium') THEN
    RETURN v_subscription.whatsapp_bot_enabled;
  END IF;
  
  -- Basic plan - bot not available
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-enable bot when upgrading to PRO/PREMIUM
CREATE OR REPLACE FUNCTION public.handle_subscription_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If upgrading to PRO or PREMIUM, auto-enable bot
  IF NEW.plan IN ('pro', 'premium') AND OLD.plan = 'basic' THEN
    NEW.whatsapp_bot_enabled := true;
    NEW.whatsapp_enabled := true;
    NEW.reminders_enabled := true;
  END IF;
  
  -- If downgrading to BASIC, disable bot
  IF NEW.plan = 'basic' AND OLD.plan IN ('pro', 'premium') THEN
    NEW.whatsapp_bot_enabled := false;
    NEW.whatsapp_enabled := false;
    NEW.reminders_enabled := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_subscription_plan_change ON public.subscriptions;
CREATE TRIGGER on_subscription_plan_change
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.handle_subscription_plan_change();

-- Update existing PRO/PREMIUM subscriptions to have bot enabled
UPDATE public.subscriptions 
SET whatsapp_bot_enabled = true 
WHERE plan IN ('pro', 'premium') 
AND status = 'active';