
-- Add shot tracking columns to drills table
ALTER TABLE public.drills ADD COLUMN IF NOT EXISTS enable_shot_tracking boolean NOT NULL DEFAULT false;
ALTER TABLE public.drills ADD COLUMN IF NOT EXISTS shot_attempts integer NULL;

-- Create drill_shot_results table
CREATE TABLE public.drill_shot_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_id uuid NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  workout_id uuid NULL REFERENCES public.courses(id) ON DELETE SET NULL,
  shots_made integer NOT NULL,
  shots_attempted integer NOT NULL,
  shooting_percentage decimal NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.drill_shot_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shot results" ON public.drill_shot_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shot results" ON public.drill_shot_results FOR INSERT WITH CHECK (auth.uid() = user_id);
