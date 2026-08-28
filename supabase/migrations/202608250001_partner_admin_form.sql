-- Fields used by the admin create/edit partner experience.
alter table public.agents add column if not exists agency_name text;
alter table public.agents add column if not exists designation text;

-- Admin invitations may start with partial personal information. Partners complete
-- any missing KYC data before approval.
alter table public.partner_personal_details alter column date_of_birth drop not null;
alter table public.partner_personal_details alter column pan_number drop not null;
alter table public.partner_personal_details alter column aadhaar_last4 drop not null;
alter table public.partner_personal_details alter column address_line1 drop not null;
alter table public.partner_personal_details alter column city drop not null;
alter table public.partner_personal_details alter column state drop not null;
alter table public.partner_personal_details alter column postal_code drop not null;

alter table public.partner_personal_details drop column if exists address_line2;
