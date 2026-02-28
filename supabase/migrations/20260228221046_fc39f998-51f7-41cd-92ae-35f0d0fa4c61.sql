
-- Fix coaches: drop restrictive policy, create permissive one
DROP POLICY IF EXISTS "Coaches are viewable by everyone" ON public.coaches;
CREATE POLICY "Coaches are viewable by everyone" ON public.coaches FOR SELECT USING (true);

-- Fix courses: drop restrictive policy, create permissive one
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);

-- Fix drills: drop restrictive policy, create permissive one
DROP POLICY IF EXISTS "Drills are viewable by everyone" ON public.drills;
CREATE POLICY "Drills are viewable by everyone" ON public.drills FOR SELECT USING (true);
