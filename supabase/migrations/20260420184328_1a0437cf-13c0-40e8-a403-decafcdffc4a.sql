ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recruit_onboarding_completed boolean NOT NULL DEFAULT false;