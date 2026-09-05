alter table public.leads
  add column if not exists product_sector_id uuid references public.categories(id) on delete set null,
  add column if not exists product_type_id uuid references public.product_types(id) on delete set null,
  add column if not exists purchase_timeline text;

alter table public.leads drop constraint if exists leads_purchase_timeline_check;
alter table public.leads add constraint leads_purchase_timeline_check
  check (purchase_timeline is null or purchase_timeline in
    ('immediately','within_7_days','within_30_days','within_3_months','researching'));

create index if not exists leads_product_sector_idx on public.leads(product_sector_id);
create index if not exists leads_product_type_idx on public.leads(product_type_id);
