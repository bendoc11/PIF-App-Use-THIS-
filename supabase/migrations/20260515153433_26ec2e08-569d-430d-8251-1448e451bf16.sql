-- Ensure one subscription row per user so we can upsert reliably
DELETE FROM public.subscriptions s
USING public.subscriptions s2
WHERE s.user_id = s2.user_id
  AND s.created_at < s2.created_at;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
