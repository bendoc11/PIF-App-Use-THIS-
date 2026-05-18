-- 1. Extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Logs table
create table if not exists public.discovery_logs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  schools_processed integer not null default 0,
  confirmed integer not null default 0,
  failed integer not null default 0,
  mode text not null default 'pending'
);

alter table public.discovery_logs enable row level security;

create policy "Admins read discovery logs"
on public.discovery_logs for select
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 3. Admin helpers for cron management
create or replace function public.admin_get_cron_jobs(_names text[])
returns table(jobname text, schedule text, active boolean)
language sql
security definer
set search_path = public, cron
as $$
  select j.jobname::text, j.schedule::text, j.active
  from cron.job j
  where j.jobname = any(_names)
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.admin_pause_discovery_cron()
returns boolean
language plpgsql
security definer
set search_path = public, cron
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  perform cron.unschedule('roster-url-discovery');
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.admin_resume_discovery_cron()
returns boolean
language plpgsql
security definer
set search_path = public, cron
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'admin only';
  end if;
  perform cron.schedule(
    'roster-url-discovery',
    '*/10 * * * *',
    $cron$
    select net.http_post(
      url := 'https://feblgdfxkuegmjqsdycp.supabase.co/functions/v1/discover-roster-urls',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlYmxnZGZ4a3VlZ21qcXNkeWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDkxNTIsImV4cCI6MjA4NzgyNTE1Mn0.0K8Pf_TWt3lopDwcbWJgkTREl9f04fCFVgaPyAoJMRI'
      ),
      body := '{"batch_size": 20, "auto": true}'::jsonb
    );
    $cron$
  );
  return true;
end;
$$;

-- 4. Schedule jobs (drop if exist then create)
do $$ begin
  perform cron.unschedule('roster-url-discovery');
exception when others then null; end $$;

select cron.schedule(
  'roster-url-discovery',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url := 'https://feblgdfxkuegmjqsdycp.supabase.co/functions/v1/discover-roster-urls',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlYmxnZGZ4a3VlZ21qcXNkeWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDkxNTIsImV4cCI6MjA4NzgyNTE1Mn0.0K8Pf_TWt3lopDwcbWJgkTREl9f04fCFVgaPyAoJMRI'
    ),
    body := '{"batch_size": 20, "auto": true}'::jsonb
  );
  $cron$
);

do $$ begin
  perform cron.unschedule('weekly-roster-refresh');
exception when others then null; end $$;

select cron.schedule(
  'weekly-roster-refresh',
  '0 2 * * 0',
  $cron$
  select net.http_post(
    url := 'https://feblgdfxkuegmjqsdycp.supabase.co/functions/v1/bulk-scrape-rosters',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlYmxnZGZ4a3VlZ21qcXNkeWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDkxNTIsImV4cCI6MjA4NzgyNTE1Mn0.0K8Pf_TWt3lopDwcbWJgkTREl9f04fCFVgaPyAoJMRI'
    ),
    body := '{"mode": "refresh_all"}'::jsonb
  );
  $cron$
);