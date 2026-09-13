create table if not exists public.site_settings (key text primary key,value jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now(),updated_by text references public.users(id));
insert into public.site_settings(key,value) values('announcement','{"message":"Become a Partner & Grow Magically. Join thousands of successful partners with MagikPolicy!","linkText":"Know More","linkUrl":"/for-partners","active":true}'::jsonb) on conflict(key) do nothing;
alter table public.site_settings enable row level security;
notify pgrst,'reload schema';
