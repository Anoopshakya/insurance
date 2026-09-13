-- Give every customer a stable, human-readable code. New customer accounts
-- receive their code in the server-side registration flow.
begin;

alter table public.customers add column if not exists customer_code text;

update public.customers
set customer_code = 'MPC' ||
  substring(upper(regexp_replace(coalesce(name, 'Customer'), '[^A-Za-z]', '', 'g')) || 'XX' from 1 for 2) ||
  upper(substring(md5(id::text) from 1 for 6))
where customer_code is null;

alter table public.customers alter column customer_code set not null;
create unique index if not exists customers_customer_code_unique on public.customers(customer_code);

commit;
