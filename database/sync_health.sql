create table if not exists public.sync_health (
 clan_id text not null, season text not null, attempt_at timestamptz not null,
 finished_at timestamptz, status text not null check(status in ('running','ok','error')),
 last_success_at timestamptz, lease_token uuid not null,
 primary key(clan_id,season)
);
alter table public.sync_health enable row level security;
revoke all on public.sync_health from public,anon,authenticated;
grant select,insert,update on public.sync_health to service_role;
create or replace function public.begin_clan_sync(p_id text,p_season text,p_token uuid)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
declare acquired boolean;
begin
 insert into public.sync_health(clan_id,season,attempt_at,status,lease_token) values(p_id,p_season,clock_timestamp(),'running',p_token)
 on conflict(clan_id,season) do update set attempt_at=excluded.attempt_at,finished_at=null,status='running',lease_token=excluded.lease_token
 where sync_health.attempt_at < clock_timestamp()-interval '60 seconds'
 and (sync_health.status <> 'running' or sync_health.attempt_at < clock_timestamp()-interval '2 minutes')
 returning true into acquired;
 return coalesce(acquired,false);
end $$;
create or replace function public.finish_clan_sync(p_id text,p_season text,p_token uuid,p_ok boolean)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 update public.sync_health set status=case when p_ok then 'ok' else 'error' end,finished_at=clock_timestamp(),last_success_at=case when p_ok then clock_timestamp() else last_success_at end
 where clan_id=p_id and season=p_season and lease_token=p_token and status='running';
 return found;
end $$;
create or replace function public.prune_clan_history()
returns bigint language plpgsql security invoker set search_path=public,pg_temp as $$
declare affected bigint;
begin
 delete from public.clan_observations where observed_at < now()-interval '30 days';
 get diagnostics affected=row_count; return affected;
end $$;
revoke all on function public.begin_clan_sync(text,text,uuid),public.finish_clan_sync(text,text,uuid,boolean),public.prune_clan_history() from public,anon,authenticated;
grant execute on function public.begin_clan_sync(text,text,uuid),public.finish_clan_sync(text,text,uuid,boolean),public.prune_clan_history() to service_role;
