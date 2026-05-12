-- Ensure pg_net is available for HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_coach_reply_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  fn_url text;
BEGIN
  fn_url := 'https://feblgdfxkuegmjqsdycp.supabase.co/functions/v1/notify-reply-received';
  PERFORM extensions.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('reply_id', NEW.id::text)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block reply ingestion if notification fails
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS coach_reply_notify ON public.coach_replies;
CREATE TRIGGER coach_reply_notify
AFTER INSERT ON public.coach_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_coach_reply_received();