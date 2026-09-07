alter table public.policies
  add column if not exists tenure_months integer
  check (tenure_months is null or tenure_months > 0);

update public.policies
set tenure_months = greatest(
  1,
  round((expiry_date - start_date)::numeric / 30.4375)::integer
)
where tenure_months is null;

notify pgrst, 'reload schema';
