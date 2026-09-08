-- 001_identity_rbac.sql
-- Extensions
create extension if not exists "pgcrypto";

-- Users (mirrors Supabase-authenticated identities)
create table users (
  id text primary key,                    -- = Supabase Auth user ID
  email text unique,
  phone text,
  full_name text not null,
  portal text not null check (portal in ('admin','agent')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null            -- super_admin, operations, finance, compliance, agent...
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,                -- e.g. 'agents', 'commission_rules'
  action text not null,                -- view/create/edit/approve/delete
  unique (module, action)
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id text not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create index idx_user_roles_user on user_roles(user_id);
