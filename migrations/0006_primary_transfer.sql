-- Normal Primary transfer (designation + acceptance) and Co-host delegation.
-- One pending designation per unit. Acceptance and admin replacement both end
-- the outgoing relationship and call establishPrimaryHost; they do not insert
-- a second kind of hosting relationship.

create table if not exists primary_designations (
  id text primary key,
  unit_id text not null,
  outgoing_identity_id text not null,
  recipient_identity_id text,
  recipient_email text not null,
  recipient_name text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  constraint primary_designations_status_chk
    check (status in ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'REPLACED'))
);

create unique index if not exists primary_designations_one_pending
  on primary_designations (unit_id)
  where status = 'PENDING';

create table if not exists cohost_invites (
  id text primary key,
  unit_id text not null,
  inviter_identity_id text not null,
  recipient_email text not null,
  recipient_name text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  constraint cohost_invites_status_chk
    check (status in ('PENDING', 'GRANTED', 'CANCELLED'))
);

create unique index if not exists cohost_invites_one_pending_email
  on cohost_invites (unit_id, lower(recipient_email))
  where status = 'PENDING';

create table if not exists hosting_audit (
  id text primary key,
  unit_id text not null,
  event text not null,
  basis text not null,
  actor text not null,
  subject_identity_id text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists hosting_audit_unit_idx on hosting_audit (unit_id, created_at);
