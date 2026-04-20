-- Add recruiting profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grad_year INTEGER,
  ADD COLUMN IF NOT EXISTS gpa NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS high_school_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS highlight_film_url TEXT,
  ADD COLUMN IF NOT EXISTS aau_team TEXT;

-- Outreach history table
CREATE TABLE IF NOT EXISTS public.outreach_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  coach_name TEXT NOT NULL,
  coach_title TEXT,
  school_name TEXT NOT NULL,
  coach_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own outreach"
  ON public.outreach_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own outreach"
  ON public.outreach_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own outreach"
  ON public.outreach_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_outreach_user_sent
  ON public.outreach_history(user_id, sent_at DESC);

CREATE TRIGGER update_outreach_history_updated_at
  BEFORE UPDATE ON public.outreach_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();