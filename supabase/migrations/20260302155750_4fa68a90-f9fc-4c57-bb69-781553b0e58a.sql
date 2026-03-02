-- Allow banned users to still read their own profile row (so client can detect banned status)
-- But block them from everything else
DROP POLICY IF EXISTS "Users can view profiles if not banned" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Keep a public read for non-authenticated (e.g. for coach display)
CREATE POLICY "Public profiles viewable"
ON public.profiles FOR SELECT
USING (auth.uid() IS NULL);