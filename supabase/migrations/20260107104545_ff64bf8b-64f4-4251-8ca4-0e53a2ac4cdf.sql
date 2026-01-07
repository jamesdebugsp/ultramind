-- Fix SECURITY DEFINER view warning by using SECURITY INVOKER (default)
-- Drop and recreate the view without SECURITY DEFINER

DROP VIEW IF EXISTS public.public_business_info;

CREATE VIEW public.public_business_info 
WITH (security_invoker = true)
AS
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

-- Also create an RLS policy for anon to read profiles through the view
-- This ensures the view works for anonymous users accessing public business info
CREATE POLICY "Anon can view profiles for public_business_info view"
ON public.profiles
FOR SELECT
TO anon
USING (business_name IS NOT NULL);