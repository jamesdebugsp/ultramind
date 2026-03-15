-- Remove duplicate trigger that calls handle_new_user() twice
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;