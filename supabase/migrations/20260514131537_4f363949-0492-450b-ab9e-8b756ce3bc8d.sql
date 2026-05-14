ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

-- Allow users to write their own terms acceptance (existing UPDATE policy on profiles already covers this).
-- Protect terms_accepted_at from being cleared/forged after the fact: once set, it can only stay set.
CREATE OR REPLACE FUNCTION public.protect_terms_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Once accepted, the timestamp cannot be cleared by the user.
  IF auth.uid() = NEW.id
     AND OLD.terms_accepted_at IS NOT NULL
     AND NEW.terms_accepted_at IS NULL THEN
    NEW.terms_accepted_at := OLD.terms_accepted_at;
    NEW.terms_version := OLD.terms_version;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_terms_acceptance_trg ON public.profiles;
CREATE TRIGGER protect_terms_acceptance_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_terms_acceptance();