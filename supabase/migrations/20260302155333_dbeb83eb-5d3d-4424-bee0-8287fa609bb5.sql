-- Allow admins to insert courses
CREATE POLICY "Admins can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'creator')
);

-- Allow admins to update courses
CREATE POLICY "Admins can update courses"
ON public.courses FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'creator')
);

-- Allow admins to delete courses
CREATE POLICY "Admins can delete courses"
ON public.courses FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins/creators to insert coaches
CREATE POLICY "Admins can insert coaches"
ON public.coaches FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'creator'))
);

-- Allow admins/creators to update coaches
CREATE POLICY "Admins can update coaches"
ON public.coaches FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'creator'))
);

-- Allow admins/creators to insert drills
CREATE POLICY "Admins can insert drills"
ON public.drills FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'creator'))
);

-- Allow admins/creators to update drills
CREATE POLICY "Admins can update drills"
ON public.drills FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'creator'))
);

-- Allow admins to delete drills
CREATE POLICY "Admins can delete drills"
ON public.drills FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to delete community posts (for moderation)
CREATE POLICY "Admins can delete any post"
ON public.community_posts FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update community posts (for hide/restore)
CREATE POLICY "Admins can update any post"
ON public.community_posts FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);