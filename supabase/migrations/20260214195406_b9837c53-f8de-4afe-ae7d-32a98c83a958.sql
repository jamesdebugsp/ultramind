
-- Webhook event logs for full audit trail
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_action TEXT,
  external_payment_id TEXT,
  external_reference TEXT,
  payment_id UUID,
  status TEXT NOT NULL DEFAULT 'received',
  severity TEXT NOT NULL DEFAULT 'info',
  payload JSONB,
  response_data JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin alerts for critical events
CREATE TABLE public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view webhook logs
CREATE POLICY "Super admins can view webhook logs"
ON public.webhook_logs FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Service role can insert webhook logs
CREATE POLICY "Service role can manage webhook logs"
ON public.webhook_logs FOR ALL
USING (true) WITH CHECK (true);

-- Super admins can view and manage alerts
CREATE POLICY "Super admins can view alerts"
ON public.admin_alerts FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update alerts"
ON public.admin_alerts FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can manage alerts"
ON public.admin_alerts FOR ALL
USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_severity ON public.webhook_logs(severity);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_webhook_logs_external_ref ON public.webhook_logs(external_reference);
CREATE INDEX idx_admin_alerts_is_read ON public.admin_alerts(is_read);
CREATE INDEX idx_admin_alerts_severity ON public.admin_alerts(severity);
CREATE INDEX idx_admin_alerts_created_at ON public.admin_alerts(created_at DESC);
