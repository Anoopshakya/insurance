alter table public.policies
  add column if not exists business_type text not null default 'fresh'
  check (business_type in ('fresh','port','renew'));

alter table public.earning_ledger
  alter column commission_rule_id drop not null,
  add column if not exists partner_commission_slab_id uuid references public.partner_commission_slabs(id) on delete restrict,
  add column if not exists base_amount numeric(12,2),
  add column if not exists rate_percent numeric(7,4),
  add column if not exists gst_percent numeric(5,2) not null default 18;

create unique index if not exists earning_ledger_policy_agent_generation_idx
  on public.earning_ledger(policy_id,agent_id,generation_level);

notify pgrst, 'reload schema';
