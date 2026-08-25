-- 007_referrals.sql

create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id),
  code text unique not null,
  qr_code_url text
);

alter table leads
  add constraint fk_leads_referral foreign key (referral_code_id) references referral_codes(id);

create table referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references referral_codes(id),
  lead_id uuid references leads(id),
  customer_id uuid references customers(id),
  attributed_at timestamptz not null default now(),
  check (lead_id is not null or customer_id is not null)
);
