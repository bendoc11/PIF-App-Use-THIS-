ALTER TABLE public.college_coaches
ADD COLUMN IF NOT EXISTS roster_url text,
ADD COLUMN IF NOT EXISTS roster_url_status text DEFAULT 'pending';