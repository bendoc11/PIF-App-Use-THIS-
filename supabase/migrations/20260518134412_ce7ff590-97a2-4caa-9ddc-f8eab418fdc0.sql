
create table if not exists public.test_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  notes text,
  added_by uuid,
  times_emailed integer not null default 0,
  last_replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.test_email_sends (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.test_contacts(id) on delete set null,
  recipient_name text,
  recipient_email text not null,
  template text not null,
  subject text,
  body_preview text,
  sent_by uuid,
  sent_at timestamptz not null default now(),
  replied boolean not null default false,
  replied_at timestamptz
);

create index if not exists idx_test_email_sends_recipient on public.test_email_sends (lower(recipient_email));
create index if not exists idx_test_email_sends_sent_at on public.test_email_sends (sent_at desc);
create index if not exists idx_test_contacts_email_lower on public.test_contacts (lower(email));

alter table public.test_contacts enable row level security;
alter table public.test_email_sends enable row level security;

create policy "Admins manage test_contacts select" on public.test_contacts
  for select to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins manage test_contacts insert" on public.test_contacts
  for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins manage test_contacts update" on public.test_contacts
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins manage test_contacts delete" on public.test_contacts
  for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create policy "Admins manage test_email_sends select" on public.test_email_sends
  for select to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins manage test_email_sends insert" on public.test_email_sends
  for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins manage test_email_sends update" on public.test_email_sends
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
