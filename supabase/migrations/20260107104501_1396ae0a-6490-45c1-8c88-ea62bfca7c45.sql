-- Fix PUBLIC_DATA_EXPOSURE: Create a restricted view for public profile data
-- This view only exposes non-PII business information

-- Create a view with only safe public fields (no email, phone, whatsapp, owner_name)
CREATE OR REPLACE VIEW public.public_business_info AS
SELECT 
  id,
  user_id,
  business_name,
  address,
  instagram,
  description,
  logo_url,
  slug
FROM public.profiles
WHERE business_name IS NOT NULL;

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.public_business_info TO anon, authenticated;

-- Drop the overly permissive policy that exposes PII
DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;

-- Create a new restrictive policy that only allows authenticated users or owners
-- Anonymous users should use the public_business_info view instead
CREATE POLICY "Authenticated users can view profiles with business_name"
ON public.profiles
FOR SELECT
TO authenticated
USING (business_name IS NOT NULL);

-- Keep owner access policies intact
-- Users can view their own profile (already exists)
-- Users can update their own profile (already exists)