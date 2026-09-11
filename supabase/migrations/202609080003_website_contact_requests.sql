-- Apply manually in the Supabase SQL Editor.
create table if not exists public.website_contact_requests (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 2 and 100),
 mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
 email text not null check (char_length(email) <= 254),
 state text not null default '',
 message text not null check (char_length(message) between 10 and 4000),
 consent boolean not null check (consent = true),
 status text not null default 'new',
 created_at timestamptz not null default now()
);
alter table public.website_contact_requests enable row level security;
revoke all on public.website_contact_requests from anon, authenticated;
grant all on public.website_contact_requests to service_role;
