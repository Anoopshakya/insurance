-- 003_crm.sql

create table customers (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  name text not null,
  contact text,
  email text,
  address text,
  created_from_lead_id uuid,           -- fk added after leads table exists
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  referral_code_id uuid,               -- fk added in 007_referrals.sql
  name text not null,
  contact text,
  source text,
  priority text default 'medium',
  status text not null default 'new' check (status in
    ('new','contacted','qualified','proposal','converted','lost')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table customers
  add constraint fk_customers_lead foreign key (created_from_lead_id) references leads(id);

create index idx_leads_agent on leads(agent_id);
create index idx_leads_status on leads(status);

create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  actor_id text references users(id),
  type text not null check (type in ('call','note','email','status_change')),
  body text,
  created_at timestamptz not null default now()
);

create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  actor_id text references users(id),
  body text not null,
  created_at timestamptz not null default now()
);
