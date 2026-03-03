
-- Prevent users from escalating their own role or unbanning themselves
-- by creating a trigger that blocks changes to sensitive fields
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admins to change role and banned fields
  -- If the current user is updating their own profile, preserve role and banned
  IF auth.uid() = NEW.id THEN
    -- Check if the user is an admin
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      -- Non-admin users cannot change their own role or banned status
      NEW.role := OLD.role;
      NEW.banned := OLD.banned;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();
