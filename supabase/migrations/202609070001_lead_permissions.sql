insert into public.permissions(module,action) values
  ('leads','view'),('leads','create'),('leads','edit')
on conflict(module,action) do nothing;

insert into public.role_permissions(role_id,permission_id)
select role.id,permission.id
from public.roles role
cross join public.permissions permission
where permission.module='leads'
  and role.name in ('super_admin','operations','employee','partner','agent')
on conflict(role_id,permission_id) do nothing;
