-- Accountless guest credential (ADR-P077 prototype evidence, not a policy choice).
-- Stores only a hash of an opaque bearer. The raw credential is not a resource id.
-- No expiry or recovery: those remain unresolved in the spec.

create table if not exists guest_credentials (
  request_id text primary key,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
