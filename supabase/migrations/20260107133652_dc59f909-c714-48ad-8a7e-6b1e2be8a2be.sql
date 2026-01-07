-- Fix PUBLIC_DATA_EXPOSURE and MISSING_RLS issues for appointments table

-- 1. Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view appointments for availability" ON appointments;
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;

-- 2. Create a secure view for availability checking (no PII exposed)
CREATE OR REPLACE VIEW public.appointment_availability 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  date,
  time,
  status
FROM appointments
WHERE status NOT IN ('cancelado')
  AND date >= CURRENT_DATE;

-- 3. Allow public read access to the availability view
DROP POLICY IF EXISTS "Anyone can view appointment availability" ON appointments;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.appointment_availability TO anon;
GRANT SELECT ON public.appointment_availability TO authenticated;

-- 4. Create a secure function for public appointment creation
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_user_id UUID,
  p_service_id UUID,
  p_client_name TEXT,
  p_client_whatsapp TEXT,
  p_date DATE,
  p_time TIME
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id UUID;
  v_clean_name TEXT;
  v_clean_phone TEXT;
BEGIN
  -- Sanitize and validate inputs
  v_clean_name := TRIM(p_client_name);
  v_clean_phone := REGEXP_REPLACE(p_client_whatsapp, '[^0-9]', '', 'g');
  
  -- Validate client name (min 2 chars, max 100)
  IF LENGTH(v_clean_name) < 2 THEN
    RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
  END IF;
  
  IF LENGTH(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'Nome muito longo';
  END IF;
  
  -- Validate phone number (10-11 digits for Brazilian numbers)
  IF LENGTH(v_clean_phone) < 10 OR LENGTH(v_clean_phone) > 11 THEN
    RAISE EXCEPTION 'Número de WhatsApp inválido';
  END IF;
  
  -- Check if business/profile exists with a valid slug
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user_id 
      AND slug IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Estabelecimento não encontrado';
  END IF;
  
  -- Check if service exists, is active, and belongs to the business
  IF NOT EXISTS (
    SELECT 1 FROM services 
    WHERE id = p_service_id 
      AND user_id = p_user_id 
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Serviço não disponível';
  END IF;
  
  -- Check for conflicting appointments (same user, date, time, not cancelled)
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE user_id = p_user_id 
      AND date = p_date 
      AND time = p_time 
      AND status NOT IN ('cancelado')
  ) THEN
    RAISE EXCEPTION 'Horário já reservado';
  END IF;
  
  -- Insert the appointment
  INSERT INTO appointments (
    user_id, 
    service_id, 
    client_name, 
    client_whatsapp, 
    date, 
    time, 
    status, 
    confirmed_at
  ) VALUES (
    p_user_id, 
    p_service_id, 
    v_clean_name, 
    v_clean_phone,
    p_date, 
    p_time, 
    'confirmado', 
    NOW()
  ) RETURNING id INTO v_appointment_id;
  
  RETURN v_appointment_id;
END;
$$;

-- Grant execute permission to anonymous users for public booking
GRANT EXECUTE ON FUNCTION public.create_public_appointment(UUID, UUID, TEXT, TEXT, DATE, TIME) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(UUID, UUID, TEXT, TEXT, DATE, TIME) TO authenticated;