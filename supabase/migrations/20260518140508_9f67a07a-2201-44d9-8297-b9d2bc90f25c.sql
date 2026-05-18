ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS calendly_url text,
ADD COLUMN IF NOT EXISTS credential_badge text;