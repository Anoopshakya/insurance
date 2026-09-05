-- Keep application identities and their role-specific profiles in sync.
-- This also repairs identities created before profile insertion errors were surfaced.

alter table public.customers alter column agent_id drop not null;
alter table public.customers add column if not exists user_id text references public.users(id) on delete cascade;
alter table public.customers add column if not exists updated_at timestamptz not null default now();

create unique index if not exists customers_user_id_unique
  on public.customers(user_id) where user_id is not null;

update public.customers c
set user_id = u.id,
    name = coalesce(nullif(c.name, ''), u.full_name),
    contact = coalesce(c.contact, u.phone),
    updated_at = now()
from public.users u
where u.portal = 'customer'
  and c.user_id is null
  and u.email is not null
  and c.email is not null
  and lower(c.email) = lower(u.email)
  and not exists (
    select 1 from public.customers linked where linked.user_id = u.id
  );

insert into public.customers (user_id, agent_id, name, contact, email, created_at, updated_at)
select u.id, null, coalesce(nullif(u.full_name, ''), split_part(u.email, '@', 1), 'Customer'),
       u.phone, u.email, now(), now()
from public.users u
where u.portal = 'customer'
  and not exists (select 1 from public.customers c where c.user_id = u.id)
  and not exists (
    select 1 from public.customers c
    where u.email is not null and c.email is not null and lower(c.email) = lower(u.email)
  );

insert into public.agents
  (user_id, agent_code, agent_type, partner_type, source, status, kyc_status,
   performance_level, created_at, updated_at)
select u.id, 'MP-' || upper(substr(md5(u.id), 1, 10)), 'partner', 'standard',
       'self_registration', 'draft', 'not_started', 'starter', now(), now()
from public.users u
where u.portal in ('partner', 'agent')
  and not exists (select 1 from public.agents a where a.user_id = u.id)
on conflict (agent_code) do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r
  on r.name = case when u.portal in ('partner', 'agent') then 'partner' else 'customer' end
where u.portal in ('partner', 'agent', 'customer')
on conflict do nothing;
