create or replace function public.auto_unschedule_discovery()
returns boolean
language plpgsql
security definer
set search_path = public, cron
as $$
begin
  perform cron.unschedule('roster-url-discovery');
  return true;
exception when others then
  return false;
end;
$$;

revoke all on function public.auto_unschedule_discovery() from public, anon, authenticated;