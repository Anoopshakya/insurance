-- Restore the optional second address line for partner profile step saves.
alter table public.partner_personal_details add column if not exists address_line2 text;
notify pgrst, 'reload schema';
