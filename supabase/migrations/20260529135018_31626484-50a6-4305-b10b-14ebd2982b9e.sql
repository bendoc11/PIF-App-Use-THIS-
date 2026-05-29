CREATE OR REPLACE FUNCTION public.get_ticker_openings()
RETURNS TABLE(school_name text, pos text, graduating_count bigint, graduation_year int, division text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sr.school_name, sr.position AS pos, COUNT(*)::bigint as graduating_count, sr.graduation_year, cc.division
  FROM public.school_rosters sr
  JOIN public.college_coaches cc ON sr.school_name = cc.school_name
  WHERE sr.class_year IN ('SR','JR')
    AND sr.graduation_year IN (2025, 2026)
  GROUP BY sr.school_name, sr.position, sr.graduation_year, cc.division
  HAVING COUNT(*) >= 2
  ORDER BY RANDOM()
  LIMIT 30;
$$;

GRANT EXECUTE ON FUNCTION public.get_ticker_openings() TO anon, authenticated;