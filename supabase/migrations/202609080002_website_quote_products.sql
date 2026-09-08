-- Allow enquiries for every product listed on the public website.
begin;
alter table public.website_quote_requests
  drop constraint if exists website_quote_requests_product_type_check;
alter table public.website_quote_requests
  add constraint website_quote_requests_product_type_check
  check (product_type in ('health','motor','term','life','travel','investment','car','bike','family','personal-accident'));
notify pgrst, 'reload schema';
commit;
