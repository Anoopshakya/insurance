begin;
-- Save the category and company assignments together, preserving the edited ID.
create or replace function public.save_commission_category_mapping(p_id uuid,p_details jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 target uuid:=p_id;
 sector uuid:=(p_details->>'categoryId')::uuid;
 product_type uuid:=(p_details->>'productTypeId')::uuid;
 category_name text:=trim(p_details->>'name');
 tier text;
 company text;
 old_sector uuid;
begin
 if category_name is null or length(category_name) not between 2 and 100 then raise exception 'Enter a category name between 2 and 100 characters'; end if;
 if not exists(select 1 from public.product_types where id=product_type and category_id=sector) then raise exception 'Select a product type belonging to this sector'; end if;
 if target is not null then
  select category_id into old_sector from public.company_commission_categories where id=target for update;
  if not found then raise exception 'Commission category not found'; end if;
  if old_sector<>sector and exists(select 1 from public.partner_commission_slabs where commission_category_id=target) then raise exception 'Reassign linked commission slabs before changing this category sector'; end if;
  update public.company_commission_categories set name=category_name,category_id=sector,product_type_id=product_type,updated_at=now() where id=target;
 else
  insert into public.company_commission_categories(name,category_id,product_type_id) values(category_name,sector,product_type) returning id into target;
 end if;
 delete from public.commission_category_company_mappings where commission_category_id=target;
 foreach tier in array array['high','average','low'] loop
  for company in select jsonb_array_elements_text(p_details->tier) loop
   insert into public.commission_category_company_mappings(commission_category_id,insurer_id,commission_tier) values(target,company::uuid,tier);
  end loop;
 end loop;
 update public.company_commission_categories set high_commission_companies=jsonb_array_length(p_details->'high'),average_commission_companies=jsonb_array_length(p_details->'average'),low_commission_companies=jsonb_array_length(p_details->'low') where id=target;
 return jsonb_build_object('id',target);
end $$;
revoke all on function public.save_commission_category_mapping(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_commission_category_mapping(uuid,jsonb) to service_role;
notify pgrst,'reload schema';
commit;
