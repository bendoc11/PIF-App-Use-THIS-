
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  position TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  streak_days INT NOT NULL DEFAULT 0,
  total_drills_completed INT NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school TEXT,
  position TEXT,
  focus_area TEXT,
  bio TEXT,
  initials TEXT,
  avatar_color TEXT,
  avatar_text_color TEXT DEFAULT 'white',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches are viewable by everyone" ON public.coaches FOR SELECT USING (true);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  coach_id UUID REFERENCES public.coaches(id),
  category TEXT,
  description TEXT,
  thumbnail_url TEXT,
  level TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  drill_count INT NOT NULL DEFAULT 0,
  total_duration_seconds INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- Drills table
CREATE TABLE public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  coach_id UUID REFERENCES public.coaches(id),
  category TEXT NOT NULL,
  vimeo_id TEXT,
  duration_seconds INT,
  level TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  coaching_tips JSONB,
  equipment_needed TEXT[],
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drills are viewable by everyone" ON public.drills FOR SELECT USING (true);

-- User course progress
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  current_drill_index INT NOT NULL DEFAULT 1,
  drills_completed INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own course progress" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course progress" ON public.user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course progress" ON public.user_course_progress FOR UPDATE USING (auth.uid() = user_id);

-- User drill progress
CREATE TABLE public.user_drill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  drill_id UUID REFERENCES public.drills(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, drill_id)
);

ALTER TABLE public.user_drill_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own drill progress" ON public.user_drill_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drill progress" ON public.user_drill_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drill progress" ON public.user_drill_progress FOR UPDATE USING (auth.uid() = user_id);

-- Saved drills
CREATE TABLE public.saved_drills (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  drill_id UUID REFERENCES public.drills(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, drill_id)
);

ALTER TABLE public.saved_drills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved drills" ON public.saved_drills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved drills" ON public.saved_drills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved drills" ON public.saved_drills FOR DELETE USING (auth.uid() = user_id);
