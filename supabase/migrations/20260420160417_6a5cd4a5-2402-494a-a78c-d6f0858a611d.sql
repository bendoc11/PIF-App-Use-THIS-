CREATE TABLE public.recruiting_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  school_name TEXT NOT NULL,
  coach_name TEXT NOT NULL,
  offer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recruiting_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own offers"
  ON public.recruiting_offers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own offers"
  ON public.recruiting_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own offers"
  ON public.recruiting_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own offers"
  ON public.recruiting_offers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_recruiting_offers_user ON public.recruiting_offers(user_id, offer_date DESC);