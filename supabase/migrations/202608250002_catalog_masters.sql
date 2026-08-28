-- Admin-managed catalog masters.
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists icon text;
alter table public.categories add column if not exists active boolean not null default true;
alter table public.categories add column if not exists sort_order integer not null default 0;
update public.categories set slug=lower(regexp_replace(name,'[^a-zA-Z0-9]+','-','g')) where slug is null;
create unique index if not exists categories_slug_idx on public.categories(slug);

alter table public.insurers add column if not exists slug text;
alter table public.insurers add column if not exists logo_url text;
alter table public.insurers add column if not exists website_url text;
alter table public.insurers add column if not exists description text;
update public.insurers set slug=lower(regexp_replace(name,'[^a-zA-Z0-9]+','-','g')) where slug is null;
create unique index if not exists insurers_slug_idx on public.insurers(slug);

create table if not exists public.product_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id,name), unique(category_id,slug)
);
create index if not exists product_types_category_idx on public.product_types(category_id,active,sort_order);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('provider-logos','provider-logos',true,2097152,array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
