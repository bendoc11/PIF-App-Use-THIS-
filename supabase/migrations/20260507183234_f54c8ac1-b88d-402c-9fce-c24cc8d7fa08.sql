
ALTER TABLE public.outreach_history
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS pipeline_stage text NOT NULL DEFAULT 'contacted';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_reply_celebrated_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_coach_reply_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.outreach_history
  SET
    replied_at = COALESCE(replied_at, now()),
    status = 'replied',
    pipeline_stage = CASE WHEN pipeline_stage = 'contacted' THEN 'replied' ELSE pipeline_stage END,
    updated_at = now()
  WHERE user_id = NEW.athlete_id
    AND lower(coach_email) = lower(NEW.coach_email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coach_reply_received ON public.coach_replies;
CREATE TRIGGER coach_reply_received
AFTER INSERT ON public.coach_replies
FOR EACH ROW EXECUTE FUNCTION public.handle_coach_reply_received();
