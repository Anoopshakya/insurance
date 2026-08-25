-- 002_agents_network.sql

create table commission_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id),
  agent_code text unique not null,
  sponsor_id uuid references agents(id),          -- self-referencing, nullable = root agent
  agent_type text,
  partner_type text,
  source text,
  region text,
  operations_manager_id text references users(id),
  status text not null default 'draft' check (status in
    ('draft','submitted','under_review','approved','active','suspended','rejected','deactivated')),
  kyc_status text not null default 'pending',
  joining_date date,
  commission_profile_id uuid references commission_profiles(id),
  performance_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_agents_sponsor on agents(sponsor_id);
create index idx_agents_status on agents(status);

create table agent_status_history (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text references users(id),
  reason text,
  created_at timestamptz not null default now()
);

create table agent_bank_details (
  agent_id uuid primary key references agents(id) on delete cascade,
  account_holder text not null,
  bank_name text not null,
  account_number text not null,        -- store encrypted at application layer
  ifsc text not null,
  verification_status text not null default 'pending'
);

create table agent_documents (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  doc_type text not null check (doc_type in ('agreement','kyc','certificate','other')),
  file_url text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Closure table: precomputed ancestor/descendant pairs for fast L1/L2/L3 reads
create table network_closure (
  ancestor_id uuid not null references agents(id) on delete cascade,
  descendant_id uuid not null references agents(id) on delete cascade,
  depth int not null,
  primary key (ancestor_id, descendant_id)
);

create index idx_closure_ancestor on network_closure(ancestor_id, depth);
create index idx_closure_descendant on network_closure(descendant_id, depth);

-- Self-row: every agent is its own ancestor at depth 0
-- Maintains closure table on insert/update of agents.sponsor_id
-- and REJECTS any change that would create depth > 3.
create or replace function fn_maintain_network_closure()
returns trigger as $$
declare
  v_max_depth int;
begin
  if TG_OP = 'INSERT' then
    -- self row
    insert into network_closure (ancestor_id, descendant_id, depth)
    values (new.id, new.id, 0);

    if new.sponsor_id is not null then
      -- check resulting depth before writing
      select coalesce(max(depth), 0) + 1 into v_max_depth
      from network_closure
      where descendant_id = new.sponsor_id;

      if v_max_depth > 3 then
        raise exception 'Network depth limit exceeded: max 3 levels allowed';
      end if;

      insert into network_closure (ancestor_id, descendant_id, depth)
      select p.ancestor_id, new.id, p.depth + 1
      from network_closure p
      where p.descendant_id = new.sponsor_id;
    end if;

  elsif TG_OP = 'UPDATE' and new.sponsor_id is distinct from old.sponsor_id then
    raise exception 'Changing sponsor_id after creation is not supported in this migration; build an explicit re-parent procedure if needed';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_agents_network_closure
after insert or update on agents
for each row execute function fn_maintain_network_closure();
