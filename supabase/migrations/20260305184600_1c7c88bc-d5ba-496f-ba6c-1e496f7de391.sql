CREATE POLICY "Admins can delete coaches"
ON public.coaches
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('admin', 'creator')
));