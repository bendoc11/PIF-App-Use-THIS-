
-- Trigger function to auto-populate display_name and display_avatar_url on community_posts
CREATE OR REPLACE FUNCTION public.populate_community_post_display()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.display_name IS NULL THEN
    SELECT 
      COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), 'Anonymous'),
      avatar_url
    INTO NEW.display_name, NEW.display_avatar_url
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_populate_post_display
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_community_post_display();

-- Same for community_replies
CREATE OR REPLACE FUNCTION public.populate_community_reply_display()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.display_name IS NULL THEN
    SELECT 
      COALESCE(NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''), 'Anonymous'),
      avatar_url
    INTO NEW.display_name, NEW.display_avatar_url
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_populate_reply_display
  BEFORE INSERT ON public.community_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_community_reply_display();

-- Backfill existing posts that have null display_name
UPDATE public.community_posts cp
SET display_name = COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Anonymous'),
    display_avatar_url = COALESCE(cp.display_avatar_url, p.avatar_url)
FROM public.profiles p
WHERE cp.user_id = p.id AND cp.display_name IS NULL;

-- Backfill existing replies
UPDATE public.community_replies cr
SET display_name = COALESCE(NULLIF(TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')), ''), 'Anonymous'),
    display_avatar_url = COALESCE(cr.display_avatar_url, p.avatar_url)
FROM public.profiles p
WHERE cr.user_id = p.id AND cr.display_name IS NULL;
