ALTER TABLE public.courses ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.drills ADD COLUMN is_featured boolean NOT NULL DEFAULT false;