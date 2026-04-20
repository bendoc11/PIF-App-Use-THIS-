-- Update the protection function to also lock plan & stripe_customer_id
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() = NEW.id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      NEW.role := OLD.role;
      NEW.banned := OLD.banned;
      NEW.plan := OLD.plan;
      NEW.stripe_customer_id := OLD.stripe_customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach the trigger (it wasn't actually wired up before)
DROP TRIGGER IF EXISTS protect_sensitive_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_sensitive_profile_fields();