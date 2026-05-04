
-- 1. Restrict college_coaches to authenticated users only
DROP POLICY IF EXISTS "College coaches are viewable by everyone" ON public.college_coaches;
CREATE POLICY "College coaches viewable by authenticated users"
  ON public.college_coaches
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Prevent users from escalating role/banned/plan/subscription/stripe_customer_id on their own profile.
-- Attach the existing protect_sensitive_profile_fields() function as a BEFORE UPDATE trigger.
DROP TRIGGER IF EXISTS protect_sensitive_profile_fields_trigger ON public.profiles;
CREATE TRIGGER protect_sensitive_profile_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- Also extend the function to protect subscription_status (already handles role, banned, plan, stripe_customer_id)
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
      NEW.subscription_status := OLD.subscription_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Add explicit RLS policies for gmail_tokens (only the user can manage their own row;
--    edge functions use the service role and bypass RLS).
CREATE POLICY "Users can view own gmail tokens"
  ON public.gmail_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail tokens"
  ON public.gmail_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail tokens"
  ON public.gmail_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail tokens"
  ON public.gmail_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Restrict community_upvotes SELECT to authenticated users to prevent
--    anonymous enumeration of which users upvoted which posts.
DROP POLICY IF EXISTS "Anyone can read upvotes" ON public.community_upvotes;
CREATE POLICY "Authenticated users can read upvotes"
  ON public.community_upvotes
  FOR SELECT
  TO authenticated
  USING (true);
