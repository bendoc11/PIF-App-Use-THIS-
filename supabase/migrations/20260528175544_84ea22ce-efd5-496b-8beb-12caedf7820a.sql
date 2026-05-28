
-- Partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  partner_name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#dc2626',
  contact_name text,
  contact_email text,
  commission_per_subscriber numeric NOT NULL DEFAULT 50.00,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners readable by everyone"
  ON public.partners FOR SELECT
  USING (true);

CREATE POLICY "Admins insert partners"
  ON public.partners FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update partners"
  ON public.partners FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete partners"
  ON public.partners FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Monthly commissions
CREATE TABLE public.monthly_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  month date NOT NULL,
  active_subscribers integer NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_commissions TO authenticated;
GRANT ALL ON public.monthly_commissions TO service_role;

ALTER TABLE public.monthly_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read commissions"
  ON public.monthly_commissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins insert commissions"
  ON public.monthly_commissions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update commissions"
  ON public.monthly_commissions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete commissions"
  ON public.monthly_commissions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles attribution
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id),
  ADD COLUMN IF NOT EXISTS referral_slug text;

-- Allow admins to read all profiles for attribution reports
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Partner logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-logos');

CREATE POLICY "Admins upload partner logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'partner-logos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins update partner logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'partner-logos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins delete partner logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'partner-logos' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed demo partner for testing
INSERT INTO public.partners (slug, partner_name, primary_color, commission_per_subscriber, active)
VALUES ('demo', 'Demo Program', '#dc2626', 50.00, true)
ON CONFLICT (slug) DO NOTHING;
