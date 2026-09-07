alter table public.policies
  add column if not exists category_id uuid
  references public.categories(id) on delete restrict;

update public.policies policy
set category_id = coalesce(
  (select product.category_id from public.products product where product.id = policy.product_id),
  (select product_type.category_id from public.product_types product_type where product_type.id = policy.product_type_id)
)
where policy.category_id is null;

create index if not exists policies_category_idx on public.policies(category_id);
notify pgrst, 'reload schema';
