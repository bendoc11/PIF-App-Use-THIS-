-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'user';

-- Update all existing records to 'user' (redundant with default but explicit)
UPDATE public.profiles SET role = 'user' WHERE role IS NULL OR role = '';

-- Add status column to courses for draft/live
ALTER TABLE public.courses ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Add hidden column to community_posts for moderation
ALTER TABLE public.community_posts ADD COLUMN hidden boolean NOT NULL DEFAULT false;

-- Add banned column to profiles for ban/suspend
ALTER TABLE public.profiles ADD COLUMN banned boolean NOT NULL DEFAULT false;