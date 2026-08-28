alter table public.company_commission_categories
  add column if not exists name text;

update public.company_commission_categories c
set name = concat_ws(' - ', sector.name, product_type.name)
from public.categories sector, public.product_types product_type
where c.category_id = sector.id
  and c.product_type_id = product_type.id
  and (c.name is null or btrim(c.name) = '');

alter table public.company_commission_categories
  alter column name set not null;

alter table public.partner_commission_slabs
  add column if not exists commission_category_id uuid
  references public.company_commission_categories(id) on delete restrict;

update public.partner_commission_slabs slab
set commission_category_id = (
  select category.id
  from public.company_commission_categories category
  where category.category_id = slab.category_id
  order by category.active desc, category.updated_at desc
  limit 1
)
where slab.commission_category_id is null;

create index if not exists partner_commission_slabs_commission_category_idx
  on public.partner_commission_slabs(commission_category_id, business_type, active);

notify pgrst, 'reload schema';
