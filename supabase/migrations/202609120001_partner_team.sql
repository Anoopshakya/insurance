-- Apply manually after the existing migrations. Fails rather than deleting duplicate identities.
begin;
create unique index if not exists agents_user_id_unique on public.agents(user_id);
alter table public.agents add column if not exists invite_code text not null default replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
create unique index if not exists agents_invite_code_unique on public.agents(invite_code);
alter table public.agents add column if not exists invite_enabled boolean not null default true;
alter table public.agents add column if not exists invite_expires_at timestamptz;
alter table public.agents add constraint agents_no_self_sponsor check (sponsor_id is distinct from id);

-- Team data is served through authenticated, scoped server endpoints only.
revoke all on public.agents, public.network_closure from anon, authenticated;
grant all on public.agents, public.network_closure to service_role;

-- The caller must be the trusted server; referral input never supplies a role.
create or replace function public.register_partner(p_user_id text, p_email text, p_phone text, p_name text, p_agent_code text, p_invite text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare existing public.agents; inviter public.agents; identity public.users; role_id_value uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id,0));
 select * into identity from public.users where id=p_user_id for update;
 if found and (identity.portal not in ('partner','agent') or identity.status in ('suspended','inactive')) then
   raise exception 'This account cannot register as a partner';
 end if;
 select * into existing from public.agents where user_id=p_user_id;
 if p_invite is not null then
   select * into inviter from public.agents where invite_code=p_invite and invite_enabled
    and (invite_expires_at is null or invite_expires_at>now())
    and status not in ('suspended','rejected','deactivated') for share;
   if inviter.id is null then raise exception 'This invitation is invalid or expired. Ask for a new invite link.'; end if;
   if inviter.user_id=p_user_id then raise exception 'You cannot refer yourself. Sign in to your existing partner account.'; end if;
   if existing.id is not null and existing.sponsor_id is distinct from inviter.id then
     raise exception 'This account is already registered. Its team relationship cannot be changed.';
   end if;
 end if;
 select id into role_id_value from public.roles where name='partner';
 if role_id_value is null then raise exception 'Partner role is not configured'; end if;
 if existing.id is null then
   if p_invite is not null and (select coalesce(max(depth),0) from public.network_closure where descendant_id=inviter.id)>=3 then
     raise exception 'This team has reached the supported three-level limit.';
   end if;
   if p_phone is not null and exists(select 1 from public.users where phone=p_phone and id<>p_user_id) then raise exception 'This mobile number is already registered.'; end if;
   insert into public.users(id,email,phone,full_name,portal,status)
   values(p_user_id,p_email,p_phone,p_name,'partner','profile_pending') on conflict(id) do nothing;
   insert into public.agents(user_id,agent_code,sponsor_id,agent_type,partner_type,source,status,kyc_status,performance_level)
   values(p_user_id,p_agent_code,inviter.id,'partner','standard','self_registration','draft','not_started','starter') returning * into existing;
 end if;
 insert into public.user_roles(user_id,role_id) values(p_user_id,role_id_value) on conflict do nothing;
 return jsonb_build_object('id',existing.id,'status',existing.status);
end $$;
revoke all on function public.register_partner(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.register_partner(text,text,text,text,text,text) to service_role;
commit;
