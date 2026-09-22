-- Shared Stayora World (one JSON row). Auth-off, unowned.
create table if not exists world_state (
  id int primary key,
  version int not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
