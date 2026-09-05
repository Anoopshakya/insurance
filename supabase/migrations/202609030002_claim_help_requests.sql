create table if not exists claim_help_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp_number text not null,
  claim_amount numeric(14,2) not null check (claim_amount > 0),
  claim_failure_reason text not null,
  location text not null,
  policy_document_path text not null,
  failure_document_path text not null,
  status text not null default 'new' check (status in ('new','reviewing','contacted','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_claim_help_requests_status
  on claim_help_requests(status, created_at desc);

alter table claim_help_requests enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-help-documents',
  'claim-help-documents',
  false,
  5242880,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

