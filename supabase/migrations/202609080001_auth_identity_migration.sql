-- Preserve every FK reference when replacing an old application ID with its Auth UUID.
-- This does not provision accounts or send messages. The accompanying script does
-- account provisioning through the supported Supabase Admin API.
begin;
do $$
declare constraint_row record; definition text;
begin
  for constraint_row in
    select c.conrelid::regclass as relation, c.conname, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c
    where c.contype = 'f' and c.confrelid = 'public.users'::regclass
  loop
    definition := regexp_replace(constraint_row.definition, ' ON UPDATE (NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)', '');
    definition := replace(definition, 'REFERENCES users(id)', 'REFERENCES public.users(id)');
    definition := replace(definition, 'REFERENCES public.users(id)', 'REFERENCES public.users(id) ON UPDATE CASCADE');
    execute format('alter table %s drop constraint %I', constraint_row.relation, constraint_row.conname);
    execute format('alter table %s add constraint %I %s', constraint_row.relation, constraint_row.conname, definition);
  end loop;
end $$;

create or replace function public.migrate_application_identity(legacy_id text, auth_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare legacy_email text; account_email text; confirmed_at timestamptz; imported_id text;
begin
  select email into legacy_email from public.users where id = legacy_id for update;
  if not found then
    if exists(select 1 from public.users where id = auth_id::text) then return; end if;
    raise exception 'Application identity not found';
  end if;
  select email, email_confirmed_at, raw_app_meta_data->>'imported_application_id'
    into account_email, confirmed_at, imported_id from auth.users where id = auth_id;
  if legacy_email is null or account_email is null or lower(legacy_email) <> lower(account_email) then
    raise exception 'Account email does not match the application identity';
  end if;
  if confirmed_at is null and imported_id is distinct from legacy_id then
    raise exception 'Existing account must verify its email before linking';
  end if;
  if exists(select 1 from public.users where id = auth_id::text and id <> legacy_id) then
    raise exception 'Target identity already exists; resolve duplicate records first';
  end if;
  update public.users set id = auth_id::text, updated_at = now() where id = legacy_id;
  update public.audit_logs set entity_id = auth_id where entity_type = 'user' and entity_id::text = legacy_id;
end $$;
revoke all on function public.migrate_application_identity(text, uuid) from public, anon, authenticated;
grant execute on function public.migrate_application_identity(text, uuid) to service_role;
notify pgrst, 'reload schema';
commit;
