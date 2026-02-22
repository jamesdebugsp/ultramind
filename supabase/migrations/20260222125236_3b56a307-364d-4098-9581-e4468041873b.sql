
-- Fix 1: Create a restricted view for public booking settings
CREATE OR REPLACE VIEW public.public_booking_settings AS
SELECT 
  user_id,
  working_days,
  working_hours_start,
  working_hours_end,
  appointment_interval
FROM public.settings;

-- Grant access to the view
GRANT SELECT ON public.public_booking_settings TO anon, authenticated;

-- Drop the overly permissive anon policy on settings
DROP POLICY IF EXISTS "Anyone can view public settings" ON public.settings;

-- Fix 2: Fix service role policies - scope to service_role instead of public
DROP POLICY IF EXISTS "Service role can manage alerts" ON public.admin_alerts;
CREATE POLICY "Service role can manage alerts"
ON public.admin_alerts FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage conversations" ON public.bot_conversations;
CREATE POLICY "Service role can manage conversations"
ON public.bot_conversations FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage all payments" ON public.payments;
CREATE POLICY "Service role can manage all payments"
ON public.payments FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage webhook logs" ON public.webhook_logs;
CREATE POLICY "Service role can manage webhook logs"
ON public.webhook_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage logs" ON public.whatsapp_message_logs;
CREATE POLICY "Service role can manage logs"
ON public.whatsapp_message_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);
