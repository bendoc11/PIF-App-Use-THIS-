
-- Table: weekly_schedule_templates
CREATE TABLE public.weekly_schedule_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  session_type TEXT NOT NULL DEFAULT 'rest',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_schedule_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule" ON public.weekly_schedule_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule" ON public.weekly_schedule_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule" ON public.weekly_schedule_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule" ON public.weekly_schedule_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: training_logs
CREATE TABLE public.training_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  duration_minutes INTEGER,
  intensity TEXT,
  notes TEXT,
  workout_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training logs" ON public.training_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training logs" ON public.training_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training logs" ON public.training_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training logs" ON public.training_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: practice_shot_logs
CREATE TABLE public.practice_shot_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_log_id UUID REFERENCES public.training_logs(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_makes INTEGER,
  total_attempts INTEGER,
  three_makes INTEGER,
  three_attempts INTEGER,
  midrange_makes INTEGER,
  midrange_attempts INTEGER,
  off_dribble_makes INTEGER,
  off_dribble_attempts INTEGER,
  ft_makes INTEGER,
  ft_attempts INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_shot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shot logs" ON public.practice_shot_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shot logs" ON public.practice_shot_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shot logs" ON public.practice_shot_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shot logs" ON public.practice_shot_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add schedule_setup_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schedule_setup_completed BOOLEAN NOT NULL DEFAULT false;
