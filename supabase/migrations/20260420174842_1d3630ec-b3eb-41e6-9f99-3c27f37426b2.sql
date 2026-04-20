CREATE TABLE public.college_coaches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_name TEXT,
  city TEXT,
  state TEXT,
  conference TEXT,
  division TEXT,
  public_private TEXT,
  school_size TEXT,
  avg_gpa TEXT,
  acceptance_rate TEXT,
  yearly_cost TEXT,
  undergrad_enrollment TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  twitter_individual TEXT,
  instagram_individual TEXT,
  twitter_team TEXT,
  instagram_team TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_college_coaches_state ON public.college_coaches(state);
CREATE INDEX idx_college_coaches_division ON public.college_coaches(division);
CREATE INDEX idx_college_coaches_school_name ON public.college_coaches(school_name);
CREATE INDEX idx_college_coaches_email ON public.college_coaches(email);

ALTER TABLE public.college_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College coaches are viewable by everyone"
ON public.college_coaches
FOR SELECT
USING (true);
