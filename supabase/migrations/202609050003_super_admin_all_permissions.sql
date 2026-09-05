-- Super administrators always receive the complete permission catalog.
insert into public.role_permissions(role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.name = 'super_admin'
on conflict(role_id, permission_id) do nothing;

-- Repair role assignments for every identity explicitly designated as admin.
insert into public.user_roles(user_id, role_id)
select users.id, roles.id
from public.users users
cross join public.roles roles
where users.portal = 'admin'
  and roles.name = 'super_admin'
on conflict(user_id, role_id) do nothing;
