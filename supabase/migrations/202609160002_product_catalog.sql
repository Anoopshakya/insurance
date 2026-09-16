begin;
alter table public.products add column if not exists product_type_id uuid references public.product_types(id);
alter table public.products add column if not exists insurer_id uuid references public.insurers(id);
alter table public.products add column if not exists slug text unique;
alter table public.products add column if not exists product_code text;
alter table public.products add column if not exists template text check(template in ('health','motor'));
alter table public.products add column if not exists publication_status text not null default 'draft' check(publication_status in ('draft','review','published','archived'));
alter table public.products add column if not exists content jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists reviewed_at timestamptz;
alter table public.products add column if not exists reviewed_by text references public.users(id);
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists catalog_managed boolean not null default false;
alter table public.plans add column if not exists catalog_active boolean not null default true;
alter table public.product_documents add column if not exists name text;
alter table public.product_documents add column if not exists document_type text;
alter table public.product_documents add column if not exists extracted_pages jsonb not null default '[]'::jsonb;
-- Populate relationships only when existing records identify a single answer.
update public.products p set insurer_id=x.insurer_id from (select product_id,(array_agg(distinct insurer_id))[1] insurer_id from public.plans group by product_id having count(distinct insurer_id)=1) x where p.id=x.product_id and p.insurer_id is null;
update public.products p set product_type_id=x.type_id from (select category_id,(array_agg(id))[1] type_id from public.product_types group by category_id having count(*)=1) x where p.category_id=x.category_id and p.product_type_id is null;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-documents','product-documents',false,10485760,array['application/pdf']) on conflict(id) do nothing;

-- A document upload invalidates any outstanding publication review.
create or replace function public.guard_catalog_document_upload()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare state text; managed boolean;
begin
 select publication_status,catalog_managed into state,managed from public.products where id=new.product_id for update;
 if managed and state='published' then raise exception 'Save as draft before adding documents'; end if;
 if managed then update public.products set updated_at=now(),reviewed_at=null,reviewed_by=null where id=new.product_id; end if;
 return new;
end $$;
create trigger guard_catalog_document_upload before insert on public.product_documents for each row execute function public.guard_catalog_document_upload();

create or replace function public.save_catalog_product(p_id uuid,p_actor text,p_data jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare target uuid:=p_id; variant jsonb; variant_id uuid; existing public.products; sector uuid:=(p_data->>'categoryId')::uuid; provider uuid:=(p_data->>'insurerId')::uuid; kind uuid:=(p_data->>'productTypeId')::uuid;
begin
 if not exists(select 1 from public.product_types where id=kind and category_id=sector) then raise exception 'Product type does not belong to the selected category'; end if;
 if not exists(select 1 from public.insurers where id=provider) then raise exception 'Select an insurer'; end if;
 if target is not null then
  select * into existing from public.products where id=target for update;
  if not found then raise exception 'Product not found'; end if;
  if (existing.category_id<>sector or (existing.insurer_id is not null and existing.insurer_id<>provider)) and exists(select 1 from public.policies where product_id=target) then raise exception 'Category and insurer cannot change for a product used by policies'; end if;
 else
  insert into public.products(name,category_id) values(p_data->>'name',sector) returning id into target;
 end if;
 if exists(select 1 from public.plans where product_id=target and insurer_id<>provider) then raise exception 'Existing plans belong to a different insurer. Keep their insurer or create a separate product'; end if;
 update public.products set name=p_data->>'name',category_id=sector,product_type_id=kind,insurer_id=provider,slug=p_data->>'slug',product_code=nullif(p_data->>'productCode',''),template=p_data->>'template',content=p_data->'content',publication_status=case when p_data->>'status'='review' then 'review' else 'draft' end,catalog_managed=true,reviewed_at=null,reviewed_by=null,updated_at=now() where id=target;
 update public.plans set catalog_active=false where product_id=target;
 for variant in select jsonb_array_elements(p_data->'plans') loop
  variant_id:=nullif(variant->>'id','')::uuid;
  if variant_id is null then
   insert into public.plans(product_id,insurer_id,name,base_premium_rules) values(target,provider,variant->>'name',jsonb_build_object('description',variant->>'description','premiumMode','quotation'));
  else
   update public.plans set name=variant->>'name',base_premium_rules=base_premium_rules||jsonb_build_object('description',variant->>'description'),catalog_active=true where id=variant_id and product_id=target and insurer_id=provider;
   if not found then raise exception 'Plan does not belong to this product and insurer'; end if;
  end if;
 end loop;
 return target;
end $$;
revoke all on function public.save_catalog_product(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_catalog_product(uuid,text,jsonb) to service_role;
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
  if product is not null and not exists(select 1 from public.products where id=product and category_id=sector_id and (product_type_id is null or product_type_id=type_id) and (insurer_id is null or insurer_id=insurer_id_value) and (not catalog_managed or publication_status='published')) then raise exception 'Select a product in this sector'; end if;
  if plan is not null and not exists(select 1 from public.plans where id=plan and product_id=product and insurer_id=insurer_id_value and catalog_active) then raise exception 'Select a plan for this product and insurer'; end if;
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
