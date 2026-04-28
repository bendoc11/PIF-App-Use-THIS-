ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS dominant_hand text,
  ADD COLUMN IF NOT EXISTS target_division text,
  ADD COLUMN IF NOT EXISTS geo_preference text,
  ADD COLUMN IF NOT EXISTS recruiting_timeline text;