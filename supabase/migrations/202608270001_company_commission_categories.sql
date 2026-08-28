create table if not exists public.company_commission_categories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  product_type_id uuid not null references public.product_types(id) on delete restrict,
  high_commission_companies integer not null default 0 check (high_commission_companies >= 0),
  average_commission_companies integer not null default 0 check (average_commission_companies >= 0),
  low_commission_companies integer not null default 0 check (low_commission_companies >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, product_type_id)
);
create index if not exists company_commission_categories_lookup_idx on public.company_commission_categories(category_id,product_type_id,active);
notify pgrst, 'reload schema';
