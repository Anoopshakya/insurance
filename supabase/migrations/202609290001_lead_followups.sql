begin;
-- Link website conversions to policies without copying policy details into leads.
alter table public.policies add column source_website_lead_id uuid unique references public.website_quote_requests(id);
alter table public.leads add column lost_reason text, add column lost_note text, add column lost_at timestamptz, add column lost_by text references public.users(id), add column converted_at timestamptz, add column converted_by text references public.users(id);
alter table public.website_quote_requests add column lost_reason text, add column lost_note text, add column lost_at timestamptz, add column lost_by text references public.users(id), add column converted_at timestamptz, add column converted_by text references public.users(id);
alter table public.website_quote_requests drop constraint website_quote_requests_status_check;
update public.website_quote_requests set status='lost',lost_note='Migrated from Closed; original reason was not recorded.' where status='closed';
alter table public.website_quote_requests add constraint website_quote_requests_status_check check(status in ('new','contacted','qualified','proposal','converted','lost'));
-- Keep existing IDs, proposal codes and activity. Unknown historical actors/dates remain null.
create table public.lead_status_history (
 id uuid primary key default gen_random_uuid(),lead_id uuid references public.leads(id) on delete cascade,website_lead_id uuid references public.website_quote_requests(id) on delete cascade,
 previous_status text,new_status text not null,changed_by text references public.users(id),changed_at timestamptz not null default now(),check(num_nonnulls(lead_id,website_lead_id)=1));
create table public.lead_followups (
 id uuid primary key default gen_random_uuid(),lead_id uuid references public.leads(id) on delete cascade,website_lead_id uuid references public.website_quote_requests(id) on delete cascade,
 scheduled_at timestamptz not null,followup_type text not null check(followup_type in ('call','whatsapp','email','meeting','other')),note text not null default '',
 status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')),created_by text not null references public.users(id),created_at timestamptz not null default now(),
 completed_by text references public.users(id),completed_at timestamptz,updated_at timestamptz not null default now(),replaces_id uuid references public.lead_followups(id),request_id uuid not null unique,check(num_nonnulls(lead_id,website_lead_id)=1));
create index on public.lead_followups(lead_id,scheduled_at);
create index on public.lead_followups(website_lead_id,scheduled_at);
create index on public.lead_status_history(lead_id,changed_at);
create index on public.lead_status_history(website_lead_id,changed_at);
alter table public.lead_followups enable row level security;
alter table public.lead_status_history enable row level security;
revoke all on public.lead_followups,public.lead_status_history from anon,authenticated;
grant all on public.lead_followups,public.lead_status_history to service_role;
create function public.audit_lead_status() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare actor text:=nullif(current_setting('app.lead_actor',true),'');
begin
 if old.status is not distinct from new.status then return new;end if;
 if new.status='lost' and new.lost_reason is null then raise exception 'A lost reason is required';end if;
 if new.status='converted' then new.converted_at:=now();new.converted_by:=actor;end if;
 if new.status='lost' then new.lost_at:=now();new.lost_by:=actor;end if;
 insert into public.lead_status_history(lead_id,website_lead_id,previous_status,new_status,changed_by)
 values(case when TG_TABLE_NAME='leads' then new.id end,case when TG_TABLE_NAME='website_quote_requests' then new.id end,old.status,new.status,actor);
 return new;
end $$;
create trigger lead_status_audit before update of status on public.leads for each row execute function public.audit_lead_status();
create trigger website_lead_status_audit before update of status on public.website_quote_requests for each row execute function public.audit_lead_status();
create function public.manage_lead_activity(p_kind text,p_id uuid,p_actor text,p_action text,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare tbl text;current_status text;item public.lead_followups;new_id uuid;reason text;
begin
 if p_kind not in ('internal','website') then raise exception 'Invalid lead type';end if;
 tbl:=case when p_kind='internal' then 'leads' else 'website_quote_requests' end;
 execute format('select status from public.%I where id=$1 for update',tbl) into current_status using p_id;
 if current_status is null then raise exception 'Lead not found';end if;
 perform set_config('app.lead_actor',p_actor,true);
 if p_action='status' then
  if p_data->>'status' not in ('new','contacted','qualified','proposal','converted','lost') then raise exception 'Invalid status';end if;
  reason:=nullif(p_data->>'lostReason','');
  if p_data->>'status'='lost' and (reason is null or reason not in ('Not Interested','Premium Too High','Bought From Competitor','Unable to Contact','Invalid Lead','Duplicate Lead','Requirement Changed','Other') or (reason='Other' and nullif(trim(p_data->>'lostNote'),'') is null)) then raise exception 'Provide a lost reason and notes for Other';end if;
  execute format('update public.%I set status=$2,lost_reason=case when $2=''lost'' then $3 else lost_reason end,lost_note=case when $2=''lost'' then $4 else lost_note end,updated_at=now() where id=$1',tbl) using p_id,p_data->>'status',reason,p_data->>'lostNote';
  return jsonb_build_object('ok',true);
 end if;
 if p_action not in ('schedule','reschedule','complete','cancel') then raise exception 'Invalid action';end if;
 if p_action in ('schedule','reschedule') then
  select id into new_id from public.lead_followups where request_id=(p_data->>'requestId')::uuid and created_by=p_actor and (case when p_kind='internal' then lead_id else website_lead_id end)=p_id;
  if found then return jsonb_build_object('id',new_id);end if;
  if current_status in ('lost','converted') then raise exception 'Closed leads do not accept new follow-ups';end if;
  if (p_data->>'scheduledAt')::timestamptz<=now() then raise exception 'Select a future follow-up date and time';end if;
 end if;
 if p_action<>'schedule' then
  select * into item from public.lead_followups where id=(p_data->>'followupId')::uuid and (case when p_kind='internal' then lead_id else website_lead_id end)=p_id for update;
  if not found then raise exception 'Follow-up not found';end if;
  if item.status<>'scheduled' then raise exception 'This follow-up has already been completed or cancelled';end if;
  update public.lead_followups set status=case when p_action='complete' then 'completed' else 'cancelled' end,completed_by=case when p_action='complete' then p_actor end,completed_at=case when p_action='complete' then now() end,updated_at=now() where id=item.id;
 end if;
 if p_action in ('schedule','reschedule') then
  insert into public.lead_followups(lead_id,website_lead_id,scheduled_at,followup_type,note,created_by,replaces_id,request_id)
  values(case when p_kind='internal' then p_id end,case when p_kind='website' then p_id end,(p_data->>'scheduledAt')::timestamptz,p_data->>'followupType',coalesce(p_data->>'note',''),p_actor,item.id,(p_data->>'requestId')::uuid) returning id into new_id;
 end if;
 return jsonb_build_object('ok',true,'id',new_id);
end $$;
revoke all on function public.manage_lead_activity(text,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.manage_lead_activity(text,uuid,text,text,jsonb) to service_role;
do $patch$
declare body text;
begin
 select pg_get_functiondef('public.create_partner_lead_policy(text,uuid,jsonb)'::regprocedure) into body;
 body:=replace(body,'update public.leads set status=''converted''','perform set_config(''app.lead_actor'',p_user_id,true); update public.leads set status=''converted''');
 execute body;
end $patch$;
notify pgrst,'reload schema';
commit;
