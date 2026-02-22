
-- Add scoped anon read policy on settings - only for users with public booking pages
CREATE POLICY "Anon can view settings for public profiles"
ON public.settings
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = settings.user_id 
    AND profiles.slug IS NOT NULL
  )
);
