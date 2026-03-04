ALTER TABLE public.drills
  ADD COLUMN IF NOT EXISTS drill_type text,
  ADD COLUMN IF NOT EXISTS reps integer,
  ADD COLUMN IF NOT EXISTS sets integer;