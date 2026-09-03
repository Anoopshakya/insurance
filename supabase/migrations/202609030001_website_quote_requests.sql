create table if not exists website_quote_requests (
  id uuid primary key default gen_random_uuid(),
  product_type text not null check (product_type in ('health', 'motor', 'term')),
  customer_name text not null,
  mobile text not null,
  selections jsonb not null default '{}'::jsonb,
  source text not null default 'homepage_quote_widget',
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_quote_requests_status
  on website_quote_requests(status, created_at desc);

alter table website_quote_requests enable row level security;

