-- Customer authentication/profile support. Supabase Auth remains the identity provider;
-- users/customers store the application identity and customer profile.
alter table public.users drop constraint if exists users_portal_check;
alter table public.users add constraint users_portal_check check (portal in ('admin','agent','partner','customer'));

alter table public.users drop constraint if exists users_status_check;
alter table public.users add constraint users_status_check check (status in ('active','suspended','profile_pending'));

alter table public.customers alter column agent_id drop not null;
alter table public.customers add column if not exists user_id text references public.users(id) on delete cascade;
alter table public.customers add column if not exists updated_at timestamptz not null default now();
create unique index if not exists customers_user_id_unique on public.customers(user_id) where user_id is not null;
create unique index if not exists customers_email_unique on public.customers(lower(email)) where email is not null;
create unique index if not exists customers_contact_unique on public.customers(contact) where contact is not null;

insert into public.roles(name) values ('customer') on conflict(name) do nothing;
insert into public.permissions(module, action) values
  ('customer_profile','view'), ('customer_profile','edit'),
  ('customer_policies','view'), ('customer_claims','view')
on conflict(module, action) do nothing;
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.name = 'customer' and p.module in ('customer_profile','customer_policies','customer_claims')
on conflict do nothing;
