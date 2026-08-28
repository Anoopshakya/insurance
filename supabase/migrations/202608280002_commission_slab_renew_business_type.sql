alter table public.partner_commission_slabs
  drop constraint if exists partner_commission_slabs_business_type_check;

alter table public.partner_commission_slabs
  add constraint partner_commission_slabs_business_type_check
  check (business_type in ('fresh', 'port', 'renew'));

notify pgrst, 'reload schema';
