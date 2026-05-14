-- Milestone tracking table
CREATE TABLE IF NOT EXISTS public.user_milestones (
  user_id UUID NOT NULL,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone_key)
);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own milestones"
  ON public.user_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestones"
  ON public.user_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Platform activity stats (anonymized aggregates) for the social proof ticker
CREATE OR REPLACE FUNCTION public.get_platform_activity_stats()
RETURNS TABLE(messages_this_week BIGINT, athletes_replied_this_week BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.outreach_history
       WHERE sent_at >= date_trunc('week', now())) AS messages_this_week,
    (SELECT COUNT(DISTINCT athlete_id) FROM public.coach_replies
       WHERE received_at >= date_trunc('week', now())) AS athletes_replied_this_week;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_activity_stats() TO authenticated;