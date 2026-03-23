
-- Create player_ratings table
CREATE TABLE public.player_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ball_handling integer NOT NULL DEFAULT 50,
  shooting integer NOT NULL DEFAULT 50,
  finishing integer NOT NULL DEFAULT 50,
  overall integer NOT NULL DEFAULT 50,
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ratings"
  ON public.player_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ratings"
  ON public.player_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.player_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add categories array column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS categories text[] DEFAULT NULL;
