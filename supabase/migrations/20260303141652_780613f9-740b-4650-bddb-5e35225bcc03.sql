ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS subscription_checked_at timestamptz DEFAULT NULL;