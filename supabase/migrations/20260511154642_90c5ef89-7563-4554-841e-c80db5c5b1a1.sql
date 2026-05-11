-- 1. Add sport column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sport text DEFAULT 'mens_basketball';

UPDATE public.profiles SET sport = 'mens_basketball' WHERE sport IS NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_sport_check
  CHECK (sport IN ('mens_basketball', 'womens_basketball'));

-- 2. Create women's coaches table mirroring college_coaches
CREATE TABLE public.coaches_womens_basketball (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  school_name text,
  city text,
  state text,
  conference text,
  division text,
  public_private text,
  school_size text,
  avg_gpa text,
  acceptance_rate text,
  yearly_cost text,
  undergrad_enrollment text,
  first_name text,
  last_name text,
  full_name text,
  title text,
  email text,
  phone text,
  gender text,
  latitude double precision,
  longitude double precision,
  twitter_individual text,
  instagram_individual text,
  twitter_team text,
  instagram_team text
);

ALTER TABLE public.coaches_womens_basketball ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Womens coaches viewable by authenticated users"
  ON public.coaches_womens_basketball
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_womens_coaches_division ON public.coaches_womens_basketball(division);
CREATE INDEX idx_womens_coaches_state ON public.coaches_womens_basketball(state);