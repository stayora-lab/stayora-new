-- Dev-only identities. Not production accounts. Fictional people only.
create table if not exists dev_identity (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists dev_session (
  token_hash text primary key,
  user_id text not null references dev_identity (id) on delete cascade,
  expires_at timestamptz not null
);

create index if not exists dev_session_user_id_idx on dev_session (user_id);
