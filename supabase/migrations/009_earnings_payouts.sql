-- 009_earnings_payouts.sql

create table earning_ledger (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id),
  agent_id uuid not null references agents(id),
  generation_level int not null check (generation_level in (0,1,2,3)),
  commission_rule_id uuid not null references commission_rules(id),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in
    ('pending','under_review','eligible','payable','paid')),
  created_at timestamptz not null default now()
);

create index idx_earnings_agent on earning_ledger(agent_id, status);
create index idx_earnings_policy on earning_ledger(policy_id);

-- Append-only guard: block UPDATE/DELETE at the DB level.
-- Status transitions happen via new rows + a status column update through
-- a dedicated function only (fn_transition_earning_status), never raw SQL.
revoke delete on earning_ledger from public;

create table earning_adjustments (
  id uuid primary key default gen_random_uuid(),
  earning_id uuid not null references earning_ledger(id),
  amount_delta numeric(12,2) not null,
  reason text not null,
  approved_by text references users(id),
  created_at timestamptz not null default now()
);

create table clawbacks (
  id uuid primary key default gen_random_uuid(),
  earning_id uuid not null references earning_ledger(id),
  policy_id uuid not null references policies(id),   -- cancellation that triggered this
  amount numeric(12,2) not null,
  reason text not null,
  approved_by text references users(id),
  created_at timestamptz not null default now()
);

create table payout_requests (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  amount_requested numeric(12,2) not null,
  status text not null default 'pending_approval' check (status in
    ('pending_approval','approved','processing','completed','failed')),
  requested_at timestamptz not null default now()
);

create table payout_transactions (
  id uuid primary key default gen_random_uuid(),
  payout_request_id uuid not null references payout_requests(id),
  provider_ref text,
  amount numeric(12,2) not null,
  status text not null default 'initiated',
  processed_at timestamptz
);

create table reconciliation_entries (
  id uuid primary key default gen_random_uuid(),
  payout_transaction_id uuid not null references payout_transactions(id),
  matched boolean not null default false,
  notes text
);
