UPDATE public.profiles p
SET
  plan = 'free',
  subscription_status = 'inactive'
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s
  WHERE s.user_id = p.id AND s.status = 'active'
)
AND (
  p.plan <> 'free'
  OR p.subscription_status IS NULL
  OR p.subscription_status NOT IN ('inactive','active','trialing','trial','past_due','canceled')
);