-- 1. Create a function to check if email is the platform owner
CREATE OR REPLACE FUNCTION public.is_platform_owner_email(email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email = 'james.jhey025@gmail.com'
$$;

-- 2. Update the trigger function to assign super_admin to the owner email
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_role app_role;
BEGIN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    
    -- Determine role based on email
    IF public.is_platform_owner_email(user_email) THEN
        user_role := 'super_admin';
    ELSE
        user_role := 'user';
    END IF;

    -- Create subscription
    INSERT INTO public.subscriptions (user_id)
    VALUES (NEW.id);
    
    -- Create role (delete existing first to avoid conflicts)
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RETURN NEW;
END;
$$;

-- 3. Update existing user with owner email to super_admin
DO $$
DECLARE
    owner_user_id uuid;
BEGIN
    -- Find the user with the owner email
    SELECT id INTO owner_user_id 
    FROM auth.users 
    WHERE email = 'james.jhey025@gmail.com';
    
    -- If user exists, ensure they have super_admin role
    IF owner_user_id IS NOT NULL THEN
        -- Remove any existing roles
        DELETE FROM public.user_roles WHERE user_id = owner_user_id;
        
        -- Insert super_admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (owner_user_id, 'super_admin');
    END IF;
END $$;

-- 4. Create a function to ensure owner always has super_admin on login
CREATE OR REPLACE FUNCTION public.ensure_owner_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- If this is the platform owner, ensure super_admin
    IF public.is_platform_owner_email(user_email) AND NEW.role != 'super_admin' THEN
        NEW.role := 'super_admin';
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Create trigger to protect owner role
DROP TRIGGER IF EXISTS ensure_owner_role ON public.user_roles;
CREATE TRIGGER ensure_owner_role
    BEFORE INSERT OR UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_owner_super_admin();