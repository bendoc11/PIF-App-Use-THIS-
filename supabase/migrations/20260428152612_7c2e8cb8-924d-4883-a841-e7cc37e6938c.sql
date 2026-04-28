
-- Public athlete profile RPC: returns sanitized profile + recent games + offers for a given identifier
-- Identifier can be a username or a profile UUID.

CREATE OR REPLACE FUNCTION public.get_public_athlete_profile(_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _games jsonb;
  _offers jsonb;
  _averages jsonb;
BEGIN
  -- Look up profile by username first, then by id (if identifier looks like uuid)
  SELECT * INTO _profile
  FROM public.profiles
  WHERE username = _identifier
  LIMIT 1;

  IF NOT FOUND THEN
    BEGIN
      SELECT * INTO _profile
      FROM public.profiles
      WHERE id = _identifier::uuid
      LIMIT 1;
    EXCEPTION WHEN invalid_text_representation THEN
      RETURN NULL;
    END;
  END IF;

  IF _profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF COALESCE(_profile.banned, false) THEN
    RETURN NULL;
  END IF;

  -- Recent games (last 10)
  SELECT COALESCE(jsonb_agg(g ORDER BY g.game_date DESC), '[]'::jsonb)
  INTO _games
  FROM (
    SELECT
      id, game_date, opponent, game_type, result,
      minutes_played, points, rebounds, assists, steals, blocks, turnovers,
      fg_made, fg_attempted, three_made, three_attempted, ft_made, ft_attempted,
      fg_percentage, three_percentage, ft_percentage
    FROM public.game_logs
    WHERE user_id = _profile.id
    ORDER BY game_date DESC
    LIMIT 10
  ) g;

  -- Season averages across ALL games
  SELECT jsonb_build_object(
    'gp',  COUNT(*),
    'ppg', ROUND(AVG(points)::numeric, 1),
    'rpg', ROUND(AVG(rebounds)::numeric, 1),
    'apg', ROUND(AVG(assists)::numeric, 1),
    'spg', ROUND(AVG(steals)::numeric, 1),
    'bpg', ROUND(AVG(blocks)::numeric, 1),
    'fg_pct', CASE WHEN SUM(fg_attempted) > 0 THEN ROUND((SUM(fg_made)::numeric / SUM(fg_attempted)) * 100, 1) ELSE 0 END,
    'three_pct', CASE WHEN SUM(three_attempted) > 0 THEN ROUND((SUM(three_made)::numeric / SUM(three_attempted)) * 100, 1) ELSE 0 END,
    'ft_pct', CASE WHEN SUM(ft_attempted) > 0 THEN ROUND((SUM(ft_made)::numeric / SUM(ft_attempted)) * 100, 1) ELSE 0 END
  )
  INTO _averages
  FROM public.game_logs
  WHERE user_id = _profile.id;

  -- Offers
  SELECT COALESCE(jsonb_agg(o ORDER BY o.offer_date DESC), '[]'::jsonb)
  INTO _offers
  FROM (
    SELECT id, school_name, coach_name, offer_date
    FROM public.recruiting_offers
    WHERE user_id = _profile.id
    ORDER BY offer_date DESC
  ) o;

  RETURN jsonb_build_object(
    'profile', jsonb_build_object(
      'id', _profile.id,
      'first_name', _profile.first_name,
      'last_name', _profile.last_name,
      'username', _profile.username,
      'avatar_url', _profile.avatar_url,
      'position', _profile.position,
      'positions', _profile.positions,
      'jersey_number', _profile.jersey_number,
      'grad_year', _profile.grad_year,
      'height', _profile.height,
      'weight', _profile.weight,
      'wingspan', _profile.wingspan,
      'gpa', _profile.gpa,
      'gpa_unweighted', _profile.gpa_unweighted,
      'sat_score', _profile.sat_score,
      'act_score', _profile.act_score,
      'city', _profile.city,
      'state', _profile.state,
      'high_school_name', _profile.high_school_name,
      'hs_team_name', _profile.hs_team_name,
      'aau_team', _profile.aau_team,
      'bio', _profile.bio,
      'intended_major', _profile.intended_major,
      'highlight_film_url', _profile.highlight_film_url,
      'additional_film_links', _profile.additional_film_links,
      'hs_coach_name', _profile.hs_coach_name,
      'hs_coach_email', _profile.hs_coach_email,
      'hs_coach_phone', _profile.hs_coach_phone,
      'aau_coach_name', _profile.aau_coach_name,
      'aau_coach_email', _profile.aau_coach_email
    ),
    'averages', _averages,
    'games', _games,
    'offers', _offers
  );
END;
$$;

-- Allow anonymous + authenticated callers to invoke
GRANT EXECUTE ON FUNCTION public.get_public_athlete_profile(text) TO anon, authenticated;
