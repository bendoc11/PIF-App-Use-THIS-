-- Create a security definer function to check if user is banned
-- This runs with elevated privileges and avoids RLS recursion
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT banned FROM public.profiles WHERE id = _user_id),
    false
  );
$$;

-- Block banned users from reading their own profile
-- Drop existing permissive select policies and recreate with banned check
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles if not banned"
ON public.profiles FOR SELECT TO authenticated
USING (
  NOT public.is_user_banned(auth.uid())
);

-- Block banned users from viewing courses (they get signed out client-side,
-- but this prevents API-level access)
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses viewable by non-banned users"
ON public.courses FOR SELECT
USING (
  auth.uid() IS NULL OR NOT public.is_user_banned(auth.uid())
);

-- Block banned users from viewing drills
DROP POLICY IF EXISTS "Drills are viewable by everyone" ON public.drills;
CREATE POLICY "Drills viewable by non-banned users"
ON public.drills FOR SELECT
USING (
  auth.uid() IS NULL OR NOT public.is_user_banned(auth.uid())
);