-- Add calendar integration fields to appointments table
-- This prepares for future Google Calendar integration

-- Add calendar event fields
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Create index for calendar sync queries
CREATE INDEX IF NOT EXISTS idx_appointments_calendar_event 
ON public.appointments(calendar_event_id) 
WHERE calendar_event_id IS NOT NULL;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.appointments.calendar_event_id IS 'External calendar event ID (e.g., Google Calendar event ID)';
COMMENT ON COLUMN public.appointments.calendar_synced_at IS 'When the appointment was last synced to external calendar';
COMMENT ON COLUMN public.appointments.duration_minutes IS 'Duration of the appointment in minutes';

-- Create calendar_integrations table for storing user calendar connections
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on calendar_integrations
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own calendar integrations
CREATE POLICY "Users can view their own calendar integrations"
ON public.calendar_integrations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar integrations"
ON public.calendar_integrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations"
ON public.calendar_integrations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations"
ON public.calendar_integrations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_calendar_integrations_updated_at
BEFORE UPDATE ON public.calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();