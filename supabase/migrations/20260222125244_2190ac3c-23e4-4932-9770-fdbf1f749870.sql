
-- Fix the SECURITY DEFINER view warning by recreating with SECURITY INVOKER
CREATE OR REPLACE VIEW public.public_booking_settings
WITH (security_invoker = true) AS
SELECT 
  user_id,
  working_days,
  working_hours_start,
  working_hours_end,
  appointment_interval
FROM public.settings;
