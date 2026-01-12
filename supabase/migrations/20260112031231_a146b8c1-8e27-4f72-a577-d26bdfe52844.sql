-- Create whatsapp_message_logs table for monitoring
CREATE TABLE public.whatsapp_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
  recipient_phone TEXT NOT NULL,
  recipient_type TEXT NOT NULL DEFAULT 'client', -- 'client' or 'owner'
  message_type TEXT NOT NULL DEFAULT 'confirmation', -- 'confirmation', 'reminder_24h', 'reminder_2h', 'bot_reply'
  message_content TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own message logs"
  ON public.whatsapp_message_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all message logs"
  ON public.whatsapp_message_logs
  FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Service role can manage logs"
  ON public.whatsapp_message_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_whatsapp_logs_user_id ON public.whatsapp_message_logs(user_id);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_message_logs(status);
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_message_logs(created_at DESC);

-- Enable pg_cron extension for scheduled jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run every hour
SELECT cron.schedule(
  'process-scheduled-reminders',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := (SELECT value FROM vault.secrets WHERE name = 'supabase_url') || '/functions/v1/process-scheduled-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Enable pg_net for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net;