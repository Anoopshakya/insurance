alter table public.policies
  alter column product_id drop not null,
  alter column plan_id drop not null;

notify pgrst, 'reload schema';
