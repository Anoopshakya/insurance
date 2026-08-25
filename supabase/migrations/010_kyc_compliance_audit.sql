-- 010_kyc_compliance_audit.sql

create table kyc_documents (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  doc_type text not null,
  file_url text not null,
  status text not null default 'pending'
);

create table kyc_verifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  verified_by text references users(id),
  verified_at timestamptz,
  notes text
);

create table risk_flags (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  flag_type text not null,
  severity text not null default 'low',
  status text not null default 'open'
);

create table fraud_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  reviewer_id text references users(id),
  outcome text,
  notes text
);

-- Generic, append-only audit log. Every financial/business-critical mutation
-- (agent status change, policy status change, commission rule change,
-- earning status change, payout transitions) should insert here.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id text references users(id),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_entity on audit_logs(entity_type, entity_id);
revoke delete, update on audit_logs from public;
