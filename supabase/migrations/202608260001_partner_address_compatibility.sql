-- Keep admin partner creation compatible with databases that have or have not
-- applied the earlier partner form migration.
alter table public.agents add column if not exists agency_name text;
alter table public.agents add column if not exists designation text;

alter table public.partner_personal_details add column if not exists address_line1 text;
alter table public.partner_personal_details alter column address_line1 drop not null;

-- Ask PostgREST to refresh its schema cache immediately after this migration.
notify pgrst, 'reload schema';
