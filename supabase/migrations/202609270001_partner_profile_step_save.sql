-- Step 1 saves personal details before identity is supplied in step 2.
-- Format constraints and the API's final-submission checks remain in place.
begin;
alter table public.partner_personal_details
  alter column pan_number drop not null,
  alter column aadhaar_last4 drop not null;
alter table public.partner_personal_details add column if not exists address_line2 text;
notify pgrst, 'reload schema';
commit;
