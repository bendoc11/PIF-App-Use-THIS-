-- Add recruiting profile columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS intended_major text,
  ADD COLUMN IF NOT EXISTS weight text,
  ADD COLUMN IF NOT EXISTS wingspan text,
  ADD COLUMN IF NOT EXISTS jersey_number text,
  ADD COLUMN IF NOT EXISTS positions text[],
  ADD COLUMN IF NOT EXISTS hs_team_name text,
  ADD COLUMN IF NOT EXISTS hs_coach_name text,
  ADD COLUMN IF NOT EXISTS hs_coach_email text,
  ADD COLUMN IF NOT EXISTS hs_coach_phone text,
  ADD COLUMN IF NOT EXISTS aau_coach_name text,
  ADD COLUMN IF NOT EXISTS aau_coach_email text,
  ADD COLUMN IF NOT EXISTS gpa_unweighted numeric,
  ADD COLUMN IF NOT EXISTS sat_score integer,
  ADD COLUMN IF NOT EXISTS act_score integer,
  ADD COLUMN IF NOT EXISTS academic_honors text,
  ADD COLUMN IF NOT EXISTS parent_name text,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_phone text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS additional_film_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS upcoming_events jsonb DEFAULT '[]'::jsonb;

-- Unique index on username (only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username) WHERE username IS NOT NULL;

-- Create target_schools table
CREATE TABLE public.target_schools (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  school_name text NOT NULL,
  division text,
  state text,
  classification text NOT NULL DEFAULT 'target',
  status text NOT NULL DEFAULT 'interested',
  college_coach_id uuid REFERENCES public.college_coaches(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.target_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own target schools"
  ON public.target_schools FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own target schools"
  ON public.target_schools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own target schools"
  ON public.target_schools FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own target schools"
  ON public.target_schools FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_target_schools_updated_at
  BEFORE UPDATE ON public.target_schools
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();