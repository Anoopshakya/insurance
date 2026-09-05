-- Supabase Auth is the identity source; application authorization remains here.
alter table public.users drop constraint if exists users_portal_check;
alter table public.users add constraint users_portal_check check (portal in ('admin','agent','partner','customer','employee'));
alter table public.roles add column if not exists user_type text;
update public.roles set user_type=case when name in ('agent','partner') then 'partner' when name='customer' then 'customer' else 'employee' end where user_type is null;
alter table public.roles alter column user_type set not null;
alter table public.roles add constraint roles_user_type_check check (user_type in ('partner','customer','employee'));
alter table public.roles add column if not exists description text;
alter table public.roles add column if not exists is_default boolean not null default false;

insert into public.roles(name,user_type,description,is_default) values
  ('partner','partner','Default access for insurance partners',true),
  ('customer','customer','Default access for policy customers',true),
  ('employee','employee','Default access for internal employees',true)
on conflict(name) do update set user_type=excluded.user_type,description=excluded.description;
update public.roles set is_default=false where name='agent';

insert into public.role_permissions(role_id,permission_id)
select target.id,rp.permission_id from public.roles source
join public.role_permissions rp on rp.role_id=source.id
cross join public.roles target
where source.name='agent' and target.name='partner'
on conflict do nothing;

create unique index if not exists roles_one_default_per_type on public.roles(user_type) where is_default;
