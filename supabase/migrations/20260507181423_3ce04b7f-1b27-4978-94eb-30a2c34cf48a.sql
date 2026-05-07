
-- 1. profiles.email_alias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_alias text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_alias_key ON public.profiles (email_alias) WHERE email_alias IS NOT NULL;

-- 2. coach_replies
CREATE TABLE IF NOT EXISTS public.coach_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  coach_email text,
  coach_name text,
  school_name text,
  reply_subject text,
  reply_body_text text,
  received_at timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS coach_replies_athlete_idx ON public.coach_replies (athlete_id, received_at DESC);

ALTER TABLE public.coach_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes view own replies" ON public.coach_replies;
CREATE POLICY "Athletes view own replies" ON public.coach_replies
  FOR SELECT TO authenticated USING (auth.uid() = athlete_id);

DROP POLICY IF EXISTS "Athletes update own replies" ON public.coach_replies;
CREATE POLICY "Athletes update own replies" ON public.coach_replies
  FOR UPDATE TO authenticated USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);

-- 3. email_send_counters
CREATE TABLE IF NOT EXISTS public.email_send_counters (
  user_id uuid NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
ALTER TABLE public.email_send_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own counters" ON public.email_send_counters;
CREATE POLICY "Users view own counters" ON public.email_send_counters
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. Alias generator
CREATE OR REPLACE FUNCTION public.generate_email_alias(_first text, _last text, _grad int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  suffix text := '';
  i int := 0;
  candidate text;
BEGIN
  IF _first IS NULL OR _last IS NULL OR _grad IS NULL THEN
    RETURN NULL;
  END IF;
  base := lower(regexp_replace(_first || _last, '[^a-zA-Z0-9]', '', 'g')) || _grad::text;
  IF base = '' THEN RETURN NULL; END IF;
  LOOP
    candidate := base || suffix;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email_alias = candidate) THEN
      RETURN candidate;
    END IF;
    i := i + 1;
    suffix := chr(97 + ((i - 1) % 26)) || (CASE WHEN i > 26 THEN ((i-1)/26)::text ELSE '' END);
    IF i > 200 THEN RETURN base || '_' || substr(md5(random()::text),1,4); END IF;
  END LOOP;
END;
$$;

-- 5. Trigger to auto-fill alias
CREATE OR REPLACE FUNCTION public.autofill_email_alias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_alias IS NULL
     AND NEW.first_name IS NOT NULL AND NEW.first_name <> ''
     AND NEW.last_name IS NOT NULL AND NEW.last_name <> ''
     AND NEW.grad_year IS NOT NULL THEN
    NEW.email_alias := public.generate_email_alias(NEW.first_name, NEW.last_name, NEW.grad_year);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_autofill_email_alias ON public.profiles;
CREATE TRIGGER trg_autofill_email_alias
BEFORE INSERT OR UPDATE OF first_name, last_name, grad_year ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.autofill_email_alias();

-- 6. Realtime
ALTER TABLE public.coach_replies REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_replies;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. Backfill aliases for existing profiles with name + grad year
UPDATE public.profiles
SET email_alias = public.generate_email_alias(first_name, last_name, grad_year)
WHERE email_alias IS NULL
  AND first_name IS NOT NULL AND first_name <> ''
  AND last_name IS NOT NULL AND last_name <> ''
  AND grad_year IS NOT NULL;
