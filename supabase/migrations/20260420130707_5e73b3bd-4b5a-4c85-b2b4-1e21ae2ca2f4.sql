-- Gmail OAuth token storage (one connected Gmail account per user)
CREATE TABLE public.gmail_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- NO policies for anon/authenticated => only service-role (Edge Functions) can read/write tokens.
-- This prevents any client (even the owner) from reading raw tokens via the JS SDK.

-- A safe view exposing only non-sensitive connection metadata to the owner,
-- so the UI can show "Connected as foo@gmail.com" without touching tokens.
CREATE OR REPLACE VIEW public.gmail_connection_status
WITH (security_invoker = true)
AS
SELECT user_id, email, created_at, updated_at
FROM public.gmail_tokens;

-- Owner-only read on the view (RLS on the view evaluates against the underlying table,
-- but with security_invoker the check uses the caller's RLS — which denies. So we add a
-- dedicated SELECT policy on the table scoped to non-token columns via the view.)
-- Since RLS on the underlying table blocks SELECT for end users, expose status via an RPC:
CREATE OR REPLACE FUNCTION public.get_gmail_connection()
RETURNS TABLE (email TEXT, connected_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, created_at AS connected_at
  FROM public.gmail_tokens
  WHERE user_id = auth.uid();
$$;

-- Drop the view since the RPC is the cleaner path
DROP VIEW IF EXISTS public.gmail_connection_status;

-- updated_at trigger
CREATE TRIGGER update_gmail_tokens_updated_at
BEFORE UPDATE ON public.gmail_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();