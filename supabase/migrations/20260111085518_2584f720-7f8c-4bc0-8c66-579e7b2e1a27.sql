-- Create table to store conversation state for WhatsApp bot
CREATE TABLE public.bot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  business_user_id UUID NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'menu',
  selected_service_id UUID NULL REFERENCES public.services(id),
  selected_date DATE NULL,
  selected_time TIME NULL,
  client_name TEXT NULL,
  conversation_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone_number, business_user_id)
);

-- Enable RLS
ALTER TABLE public.bot_conversations ENABLE ROW LEVEL SECURITY;

-- Service role can manage all conversations (used by edge functions)
CREATE POLICY "Service role can manage conversations"
ON public.bot_conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_bot_conversations_phone ON public.bot_conversations(phone_number, business_user_id);
CREATE INDEX idx_bot_conversations_expires ON public.bot_conversations(expires_at);

-- Function to clean expired conversations
CREATE OR REPLACE FUNCTION clean_expired_conversations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.bot_conversations WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;