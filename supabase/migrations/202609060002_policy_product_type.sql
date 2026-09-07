alter table public.policies
  add column if not exists product_type_id uuid
  references public.product_types(id) on delete restrict;

create index if not exists policies_product_type_idx
  on public.policies(product_type_id);

notify pgrst, 'reload schema';
