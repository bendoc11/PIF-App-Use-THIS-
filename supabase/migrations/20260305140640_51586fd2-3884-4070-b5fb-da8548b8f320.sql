
-- Create the workout_drills junction table
CREATE TABLE public.workout_drills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  drill_id uuid NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_drills ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Workout drills viewable by non-banned users"
  ON public.workout_drills FOR SELECT
  USING ((auth.uid() IS NULL) OR (NOT is_user_banned(auth.uid())));

CREATE POLICY "Admins can insert workout drills"
  ON public.workout_drills FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin','creator'])
  ));

CREATE POLICY "Admins can update workout drills"
  ON public.workout_drills FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin','creator'])
  ));

CREATE POLICY "Admins can delete workout drills"
  ON public.workout_drills FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin','creator'])
  ));

-- Migrate existing drill-to-course relationships into the junction table
INSERT INTO public.workout_drills (workout_id, drill_id, position)
SELECT course_id, id, sort_order
FROM public.drills
WHERE course_id IS NOT NULL;
