-- Re-create triggers for new user signup
-- Trigger 1: Create profile and settings on new user
CREATE OR REPLACE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2: Create subscription and role on new user
CREATE OR REPLACE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Trigger 3: Ensure owner stays super_admin
CREATE OR REPLACE TRIGGER ensure_owner_role
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_super_admin();

-- Trigger 4: Handle subscription plan changes
CREATE OR REPLACE TRIGGER on_subscription_plan_change
  BEFORE UPDATE OF plan ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_plan_change();

-- Trigger 5: Handle subscription credits changes
CREATE OR REPLACE TRIGGER on_subscription_credits_change
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_credits_change();

-- Trigger 6: Auto-create WhatsApp plan when WhatsApp config is created
CREATE OR REPLACE TRIGGER auto_create_wa_plan_trigger
  AFTER INSERT ON public.companies_whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_wa_plan();

-- Trigger 7: Updated_at triggers
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();