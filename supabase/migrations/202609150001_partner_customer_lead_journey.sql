begin;
alter table public.leads add column if not exists customer_id uuid references public.customers(id);
alter table public.policies add column if not exists policy_document_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('policy-documents','policy-documents',false,5242880,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create or replace function public.create_partner_lead_policy(p_user_id text, p_lead_id uuid, p_details jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  owner_id uuid; lead_row public.leads; customer_id_value uuid; policy_row public.policies;
  sector_id uuid := (p_details->>'sectorId')::uuid;
  type_id uuid := (p_details->>'productTypeId')::uuid;
  insurer_id_value uuid := (p_details->>'insurerId')::uuid;
  starts date := (p_details->>'startDate')::date;
  tenure integer := (p_details->>'tenureMonths')::integer;
  expires date := ((p_details->>'startDate')::date + make_interval(months => tenure) - interval '1 day')::date;
  product uuid := nullif(p_details->>'productId','')::uuid;
  plan uuid := nullif(p_details->>'planId','')::uuid;
  premium_value numeric := (p_details->>'premium')::numeric;
  coverage_value numeric := nullif(p_details->>'coverage','')::numeric;
begin
  select a.id into owner_id from public.agents a join public.users u on u.id=a.user_id
  where a.user_id=p_user_id and a.status in ('active','approved') and u.status not in ('suspended','inactive') for share of a;
  if owner_id is null then raise exception 'Only approved partners can create policies'; end if;
  select * into lead_row from public.leads where id=p_lead_id and agent_id=owner_id for update;
  if not found then raise exception 'Select one of your leads'; end if;
  select * into policy_row from public.policies where source_lead_id=p_lead_id;
  if found then return to_jsonb(policy_row); end if;
  if tenure is null or tenure not between 1 and 360 or starts is null or expires is null or expires < starts or premium_value is null or premium_value <= 0 or coverage_value < 0
     or coalesce(length(trim(p_details->>'policyNumber')),0) not between 3 and 80
     or coalesce(p_details->>'businessType','') not in ('fresh','port','renew') then raise exception 'Enter valid policy details'; end if;
  if not exists(select 1 from public.product_types t join public.categories c on c.id=t.category_id where t.id=type_id and c.id=sector_id and t.active and c.active)
     then raise exception 'Select a valid product sector and type'; end if;
  if not exists(select 1 from public.insurers where id=insurer_id_value and active) then raise exception 'Select a valid insurer'; end if;
  if product is not null and not exists(select 1 from public.products where id=product and category_id=sector_id) then raise exception 'Select a product in this sector'; end if;
  if plan is not null and not exists(select 1 from public.plans where id=plan and product_id=product and insurer_id=insurer_id_value) then raise exception 'Select a plan for this product and insurer'; end if;
  -- A customer is created only if there is no matching customer owned by this partner.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || ':' || coalesce(lead_row.contact,lead_row.id::text),0));
  select id into customer_id_value from public.customers where agent_id=owner_id and
    (id=lead_row.customer_id or created_from_lead_id=p_lead_id or (nullif(lead_row.contact,'') is not null and contact in (lead_row.contact,'+91' || lead_row.contact)))
    order by (id=lead_row.customer_id) desc nulls last, (created_from_lead_id=p_lead_id) desc nulls last, created_at, id limit 1;
  if customer_id_value is null then
    insert into public.customers(agent_id,name,contact,created_from_lead_id,customer_code)
    values(owner_id,lead_row.name,lead_row.contact,p_lead_id,'MPC' || substring(upper(regexp_replace(lead_row.name,'[^A-Za-z]','','g')) || 'XX' from 1 for 2) || upper(substring(replace(gen_random_uuid()::text,'-','') from 1 for 6))) returning id into customer_id_value;
  end if;
  insert into public.policies(source_lead_id,policy_number,customer_id,agent_id,category_id,product_type_id,insurer_id,premium,coverage,start_date,expiry_date,business_type,status,product_id,plan_id,tenure_months,review_status,policy_document_path)
  values(p_lead_id,trim(p_details->>'policyNumber'),customer_id_value,owner_id,sector_id,type_id,insurer_id_value,premium_value,coverage_value,starts,expires,p_details->>'businessType','pending',product,plan,tenure,'pending',nullif(p_details->>'documentPath','')) returning * into policy_row;
  insert into public.policy_status_history(policy_id,from_status,to_status,changed_by) values(policy_row.id,null,'pending',p_user_id);
  update public.leads set status='converted',customer_id=customer_id_value,updated_at=now() where id=p_lead_id;
  return to_jsonb(policy_row);
end $$;
revoke all on function public.create_partner_lead_policy(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_partner_lead_policy(text,uuid,jsonb) to service_role;

notify pgrst,'reload schema';
commit;
