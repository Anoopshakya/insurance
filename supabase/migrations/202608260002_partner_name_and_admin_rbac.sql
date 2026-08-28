-- Add the requested display name directly to agents while keeping users.full_name
-- as the canonical login identity name.
alter table public.agents add column if not exists name text;

update public.agents a
set name = u.full_name
from public.users u
where u.id = a.user_id
  and (a.name is null or btrim(a.name) = '');

-- Make the RBAC seed safe for databases where it was only partially applied.
insert into public.roles (name)
select 'super_admin'
where not exists (select 1 from public.roles where name = 'super_admin');

insert into public.permissions (module, action)
select values_to_add.module, values_to_add.action
from (values
  ('agents','view'), ('agents','create'), ('agents','edit'),
  ('agents','approve'), ('agents','delete')
) as values_to_add(module, action)
where not exists (
  select 1 from public.permissions p
  where p.module = values_to_add.module and p.action = values_to_add.action
);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'super_admin'
  and p.module = 'agents'
  and not exists (
    select 1 from public.role_permissions rp
    where rp.role_id = r.id and rp.permission_id = p.id
  );

-- All identities explicitly stored as admin users receive the administrator role.
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
cross join public.roles r
where u.portal = 'admin' and r.name = 'super_admin'
on conflict (user_id, role_id) do nothing;

notify pgrst, 'reload schema';
