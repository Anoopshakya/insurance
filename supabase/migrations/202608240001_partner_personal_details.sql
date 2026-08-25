-- Partner personal/KYC details. Apply in Supabase before deploying the profile form.
create table if not exists public.partner_personal_details (
  agent_id uuid primary key references public.agents(id) on delete cascade,
  date_of_birth date not null,
  gender text,
  father_or_spouse_name text,
  occupation text,
  pan_number varchar(10) not null,
  aadhaar_last4 char(4) not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code varchar(6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_personal_details_pan_format check (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  constraint partner_personal_details_aadhaar_last4 check (aadhaar_last4 ~ '^[0-9]{4}$'),
  constraint partner_personal_details_postal_code check (postal_code ~ '^[1-9][0-9]{5}$'),
  constraint partner_personal_details_adult check (date_of_birth <= (current_date - interval '18 years')::date)
);

alter table public.agent_bank_details add column if not exists account_type text;
alter table public.agent_bank_details add column if not exists branch_name text;

alter table public.partner_personal_details enable row level security;
-- The application uses server-side authorization and the service role for this table.
-- No browser-facing RLS policy is intentionally granted.

create unique index if not exists partner_personal_details_pan_idx on public.partner_personal_details (pan_number);
