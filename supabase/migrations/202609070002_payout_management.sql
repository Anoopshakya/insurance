alter table public.payout_requests
  add column if not exists source text not null default 'manual'
    check (source in ('automatic','manual')),
  add column if not exists notes text,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists created_by text references public.users(id),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.payout_request_earnings (
  payout_request_id uuid not null references public.payout_requests(id) on delete cascade,
  earning_id uuid not null references public.earning_ledger(id) on delete restrict,
  amount numeric(12,2) not null,
  primary key (payout_request_id, earning_id),
  unique (earning_id)
);

create index if not exists payout_requests_agent_status_idx
  on public.payout_requests(agent_id,status,requested_at desc);

notify pgrst, 'reload schema';
