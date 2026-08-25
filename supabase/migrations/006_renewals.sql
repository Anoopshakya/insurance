-- 006_renewals.sql

create table renewal_reminder_config (
  id uuid primary key default gen_random_uuid(),
  days_before int not null unique,     -- 90/60/30/15/7/3/1
  enabled boolean not null default true
);

insert into renewal_reminder_config (days_before) values (90),(60),(30),(15),(7),(3),(1);

create table renewals (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references policies(id) on delete cascade,
  due_date date not null,
  status text not null default 'upcoming' check (status in
    ('upcoming','due','contacted','proposal','renewed','lost','overdue')),
  created_at timestamptz not null default now()
);

create index idx_renewals_due on renewals(due_date);
create index idx_renewals_status on renewals(status);
