-- 004_catalog.sql

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id),
  name text not null
);

create table insurers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  api_status text default 'not_integrated',
  active boolean not null default true
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  insurer_id uuid not null references insurers(id),
  name text not null,
  base_premium_rules jsonb default '{}'::jsonb
);

create table eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  rule jsonb not null default '{}'::jsonb
);

create table product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  file_url text not null
);
