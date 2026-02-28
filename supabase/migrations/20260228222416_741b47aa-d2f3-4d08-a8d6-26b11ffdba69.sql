
-- Community posts table
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  upvote_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Community replies table
CREATE TABLE public.community_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read replies" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert own replies" ON public.community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.community_replies FOR DELETE USING (auth.uid() = user_id);

-- Community upvotes table
CREATE TABLE public.community_upvotes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read upvotes" ON public.community_upvotes FOR SELECT USING (true);
CREATE POLICY "Users can insert own upvotes" ON public.community_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own upvotes" ON public.community_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Function to sync upvote/reply counts
CREATE OR REPLACE FUNCTION public.update_post_upvote_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET upvote_count = upvote_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_upvote_change
AFTER INSERT OR DELETE ON public.community_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_post_upvote_count();

CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET reply_count = reply_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_reply_change
AFTER INSERT OR DELETE ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.update_post_reply_count();
