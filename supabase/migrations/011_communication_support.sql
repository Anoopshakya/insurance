-- 011_communication_support.sql

create table notification_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email','sms','whatsapp','in_app')),
  body text not null
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id),
  channel text not null,
  template_id uuid references notification_templates(id),
  status text not null default 'pending',
  sent_at timestamptz
);

create table message_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  recipient text not null,
  template_id uuid references notification_templates(id),
  status text not null default 'pending',
  sent_at timestamptz
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  raised_by text not null references users(id),
  subject text not null,
  status text not null default 'open',
  priority text default 'medium',
  assigned_to text references users(id),
  created_at timestamptz not null default now()
);

create table complaints (
  id uuid primary key default gen_random_uuid(),
  raised_by text not null references users(id),
  subject text not null,
  status text not null default 'open',
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);
