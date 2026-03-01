
-- Tabela de configuração WhatsApp Business por empresa (multi-tenant)
CREATE TABLE public.companies_whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  business_account_id TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  phone_display TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.companies_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own whatsapp config"
  ON public.companies_whatsapp_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp config"
  ON public.companies_whatsapp_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp config"
  ON public.companies_whatsapp_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own whatsapp config"
  ON public.companies_whatsapp_config FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all whatsapp configs"
  ON public.companies_whatsapp_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Super admins can view all configs
CREATE POLICY "Super admins can view all whatsapp configs"
  ON public.companies_whatsapp_config FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Tabela de mensagens WhatsApp enviadas
CREATE TABLE public.whatsapp_business_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_number TEXT NOT NULL,
  message_id TEXT,
  template_name TEXT NOT NULL,
  template_params JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  status_updated_at TIMESTAMP WITH TIME ZONE,
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_business_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own messages"
  ON public.whatsapp_business_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all messages"
  ON public.whatsapp_business_messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Super admins can view all messages"
  ON public.whatsapp_business_messages FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_business_messages(user_id);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_business_messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_business_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_message_id ON public.whatsapp_business_messages(message_id);
CREATE INDEX idx_whatsapp_config_user_id ON public.companies_whatsapp_config(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_companies_whatsapp_config_updated_at
  BEFORE UPDATE ON public.companies_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_business_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_business_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
