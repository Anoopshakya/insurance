-- 008_commission.sql

create table performance_slabs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_business_volume numeric(14,2) not null,
  max_business_volume numeric(14,2),
  multiplier numeric(6,4) not null default 1.0
);

create table commission_rules (
  id uuid primary key default gen_random_uuid(),
  rule_group_id uuid not null,          -- groups all versions of "the same" rule
  version_no int not null,
  effective_from date not null,
  effective_to date,                    -- null = currently active
  product_id uuid references products(id),
  insurer_id uuid references insurers(id),
  business_type text check (business_type in ('new','renewal')),
  agent_type text,
  generation_level int not null check (generation_level in (0,1,2,3)),
  performance_slab_id uuid references performance_slabs(id),
  calculation_type text not null check (calculation_type in ('flat','percentage','tiered')),
  value jsonb not null,                 -- shape depends on calculation_type
  status text not null default 'draft' check (status in ('draft','active','superseded')),
  created_by text references users(id),
  created_at timestamptz not null default now(),
  unique (rule_group_id, version_no)
);

create index idx_commission_rules_lookup on commission_rules
  (product_id, insurer_id, business_type, generation_level, status);

create table campaigns (          -- commission-boost campaigns
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  rule_id uuid references commission_rules(id)
);

-- Enforce: only one 'active' version per rule_group_id at a time.
create unique index uq_one_active_rule_per_group
  on commission_rules (rule_group_id)
  where status = 'active';
