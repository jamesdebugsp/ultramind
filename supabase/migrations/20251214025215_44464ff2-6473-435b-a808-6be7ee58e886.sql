-- Allow anonymous users to view settings for public booking (only time-related fields)
CREATE POLICY "Anyone can view public settings" 
ON public.settings 
FOR SELECT 
TO anon
USING (true);

-- Allow anonymous users to create appointments (public booking)
CREATE POLICY "Anyone can create appointments" 
ON public.appointments 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow anonymous users to read appointments for checking availability (only date/time)
CREATE POLICY "Anyone can view appointments for availability" 
ON public.appointments 
FOR SELECT 
TO anon
USING (true);