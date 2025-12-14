-- Allow anonymous users to view public profile information (limited columns enforced in code)
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (business_name IS NOT NULL);

-- Allow anonymous users to view active services for booking
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
TO anon
USING (status = 'active');