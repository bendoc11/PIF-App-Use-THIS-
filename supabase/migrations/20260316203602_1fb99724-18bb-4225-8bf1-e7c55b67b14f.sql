
CREATE TABLE public.game_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_date date NOT NULL DEFAULT CURRENT_DATE,
  opponent text,
  game_type text NOT NULL DEFAULT 'Pickup',
  result text NOT NULL DEFAULT 'W',
  minutes_played integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  rebounds integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  steals integer NOT NULL DEFAULT 0,
  blocks integer NOT NULL DEFAULT 0,
  turnovers integer NOT NULL DEFAULT 0,
  fg_made integer NOT NULL DEFAULT 0,
  fg_missed integer NOT NULL DEFAULT 0,
  three_made integer NOT NULL DEFAULT 0,
  three_missed integer NOT NULL DEFAULT 0,
  ft_made integer NOT NULL DEFAULT 0,
  ft_missed integer NOT NULL DEFAULT 0,
  fg_percentage numeric DEFAULT 0,
  three_percentage numeric DEFAULT 0,
  ft_percentage numeric DEFAULT 0,
  efficiency integer DEFAULT 0,
  game_rating numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.game_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game logs" ON public.game_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game logs" ON public.game_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game logs" ON public.game_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game logs" ON public.game_logs
  FOR DELETE USING (auth.uid() = user_id);
