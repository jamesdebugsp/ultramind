-- Add super admin policies for profiles table
-- This allows super admins to view and manage all profiles in the admin panel

-- Policy for super admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Policy for super admins to update all profiles (for admin management)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));