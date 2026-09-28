-- Hosting relationship requests and Primary Host relationships.
-- Identity ≠ Capacity ≠ Hosting Relationship ≠ Authority.
-- At most one active PRIMARY per unit (partial unique index; PGLite and Neon).

create table if not exists hosting_requests (
  id text primary key,
  applicant_user_id text not null,
  destination_id text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  created_at timestamptz not null default now()
);

create index if not exists hosting_requests_applicant_idx
  on hosting_requests (applicant_user_id);

create table if not exists hosting_request_units (
  id text primary key,
  request_id text not null references hosting_requests (id),
  unit_id text not null,
  status text not null default 'PENDING',
  actor text,
  decided_at timestamptz,
  basis text,
  reason text,
  constraint hosting_request_units_status_chk
    check (status in ('PENDING', 'APPROVED', 'REJECTED'))
);

create index if not exists hosting_request_units_request_idx
  on hosting_request_units (request_id);

create table if not exists hosting_relationships (
  id text primary key,
  unit_id text not null,
  identity_id text not null,
  kind text not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  constraint hosting_relationships_kind_chk check (kind = 'PRIMARY')
);

create unique index if not exists hosting_relationships_one_active_primary
  on hosting_relationships (unit_id)
  where kind = 'PRIMARY' and valid_to is null;
