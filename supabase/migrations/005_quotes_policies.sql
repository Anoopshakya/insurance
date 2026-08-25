-- 005_quotes_policies.sql

create table quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  agent_id uuid not null references agents(id),
  product_id uuid not null references products(id),
  insurer_id uuid not null references insurers(id),
  plan_id uuid not null references plans(id),
  quote_reference text unique not null,
  premium numeric(12,2),
  coverage numeric(14,2),
  validity_date date,
  status text not null default 'draft' check (status in
    ('draft','submitted','received','selected','converted','expired','rejected')),
  created_at timestamptz not null default now()
);

create table policies (
  id uuid primary key default gen_random_uuid(),
  policy_number text unique not null,
  customer_id uuid not null references customers(id),
  agent_id uuid not null references agents(id),
  quote_id uuid references quotes(id),
  product_id uuid not null references products(id),
  insurer_id uuid not null references insurers(id),
  plan_id uuid not null references plans(id),
  premium numeric(12,2) not null,
  coverage numeric(14,2),
  start_date date not null,
  expiry_date date not null,
  status text not null default 'proposal' check (status in
    ('proposal','pending','issued','active','expired','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_policies_agent on policies(agent_id);
create index idx_policies_status on policies(status);
create index idx_policies_expiry on policies(expiry_date);

create table policy_status_history (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text references users(id),
  created_at timestamptz not null default now()
);

create table policy_endorsements (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  type text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table policy_documents (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  doc_type text not null,
  file_url text not null
);
