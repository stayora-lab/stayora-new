-- Identity ≠ role. Grants are issued by Stayora, never self-assigned.
create table if not exists role_grants (
  id text primary key,
  user_id text not null,
  role text not null,
  scope_ref text,
  status text not null default 'active',
  granted_by text,
  granted_at timestamptz not null default now()
);

create index if not exists role_grants_user_id_idx on role_grants (user_id);
create index if not exists role_grants_status_idx on role_grants (status);
