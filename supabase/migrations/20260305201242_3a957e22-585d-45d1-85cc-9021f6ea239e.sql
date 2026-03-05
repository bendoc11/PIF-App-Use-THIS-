-- Fix community_posts FK to point to profiles instead of auth.users
ALTER TABLE public.community_posts DROP CONSTRAINT community_posts_user_id_fkey;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix community_replies FK similarly
ALTER TABLE public.community_replies DROP CONSTRAINT IF EXISTS community_replies_user_id_fkey;
ALTER TABLE public.community_replies
  ADD CONSTRAINT community_replies_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;