-- Apply after 202609120001_partner_team.sql. Old invite links are retired.
begin;
lock table public.agents in access exclusive mode;

create or replace function public.generate_partner_invite_code()
returns text language plpgsql volatile security definer set search_path=public,pg_temp as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bits bit(40);
  candidate text;
  position integer;
begin
  -- Serialize generation until commit so concurrent inserts cannot select the same code.
  perform pg_advisory_xact_lock(20260913, 3);
  loop
    -- The first 40 UUID bits are random (before its version/variant bits).
    random_bits := ('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))::bit(40);
    candidate := '';
    for position in 0..7 loop
      candidate := candidate || substr(alphabet, substring(random_bits from position * 5 + 1 for 5)::integer + 1, 1);
    end loop;
    if not exists (select 1 from public.agents where invite_code = candidate) then
      return candidate;
    end if;
  end loop;
end $$;
revoke all on function public.generate_partner_invite_code() from public, anon, authenticated;
grant execute on function public.generate_partner_invite_code() to service_role;

alter table public.agents alter column invite_code set default public.generate_partner_invite_code();
-- All legacy codes are regenerated. Reapplying does not rotate already-short codes.
update public.agents
set invite_code = public.generate_partner_invite_code(), updated_at = now()
where invite_code !~ '^[A-Z0-9]{8}$';

alter table public.agents drop constraint if exists agents_invite_code_format;
alter table public.agents add constraint agents_invite_code_format check (invite_code ~ '^[A-Z0-9]{8}$');
notify pgrst, 'reload schema';
commit;
