-- Draft schema; not applied. Service-role access only.
create table public.clan_observations (
  id bigint generated always as identity primary key,
  clan_id text not null,
  season text not null,
  observed_at timestamptz not null,
  reputation bigint not null check (reputation >= 0),
  members jsonb not null check (jsonb_typeof(members) = 'array'),
  unique (clan_id, season, observed_at)
);
create index clan_observations_lookup on public.clan_observations (clan_id, season, observed_at desc);
alter table public.clan_observations enable row level security;
revoke all on public.clan_observations from anon, authenticated;
grant select, insert, delete on public.clan_observations to service_role;
grant usage, select on sequence public.clan_observations_id_seq to service_role;
