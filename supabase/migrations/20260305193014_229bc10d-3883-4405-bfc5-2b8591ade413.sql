
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS strengths text[],
  ADD COLUMN IF NOT EXISTS weaknesses text[],
  ADD COLUMN IF NOT EXISTS primary_goal text,
  ADD COLUMN IF NOT EXISTS training_days_per_week integer,
  ADD COLUMN IF NOT EXISTS training_hours_per_session text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
