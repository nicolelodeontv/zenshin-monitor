create table if not exists public.clan_latest (clan_id text not null, season text not null, clan_name text not null, observed_at timestamptz not null, reputation bigint not null check(reputation>=0), members jsonb not null, primary key(clan_id,season));
alter table public.clan_latest enable row level security;
revoke all on public.clan_latest from public,anon,authenticated;
grant select,insert,update on public.clan_latest to service_role;
CREATE OR REPLACE FUNCTION public.clan_progress(p_clan_id text, p_season text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
select jsonb_build_object('observedAt',l.observed_at,'windows',(
 select jsonb_object_agg(w.hours::text,case when b.observed_at is null then null else jsonb_build_object('baselineAt',b.observed_at,'members',(
 select coalesce(jsonb_object_agg(m->>'name', (m->>'rep')::bigint-(old->>'rep')::bigint),'{}'::jsonb)
 from jsonb_array_elements(l.members) m join jsonb_array_elements(b.members) old on m->>'name'=old->>'name'
 )) end)
 from (values(1),(3),(6),(12),(24),(168)) w(hours)
 left join lateral (select observed_at,members from public.clan_observations where clan_id=p_clan_id and season=p_season and observed_at<=l.observed_at-make_interval(hours=>w.hours) order by observed_at desc limit 1) b on true
)) from public.clan_latest l where l.clan_id=p_clan_id and l.season=p_season;
$function$
;
CREATE OR REPLACE FUNCTION public.record_clan_snapshot(p_clan_id text, p_season text, p_clan_name text, p_observed_at timestamp with time zone, p_reputation bigint, p_members jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare prior public.clan_latest%rowtype; last_point timestamptz; canonical jsonb; saved boolean;
begin
 if jsonb_typeof(p_members) is distinct from 'array' or jsonb_array_length(p_members)=0 then raise exception 'Empty roster'; end if;
 if (select sum((m->>'rep')::bigint) from jsonb_array_elements(p_members) m) is distinct from p_reputation then raise exception 'Inconsistent reputation'; end if;
 select jsonb_agg(m order by m->>'name' collate "C") into canonical from jsonb_array_elements(p_members) m;
 perform pg_advisory_xact_lock(hashtextextended(p_clan_id||':'||p_season,0));
 select * into prior from public.clan_latest where clan_id=p_clan_id and season=p_season;
 if prior.observed_at >= p_observed_at then return false; end if;
 select max(observed_at) into last_point from public.clan_observations where clan_id=p_clan_id and season=p_season;
 saved := last_point is null or prior.members is distinct from canonical or prior.reputation is distinct from p_reputation or prior.clan_name is distinct from p_clan_name or last_point <= p_observed_at-interval '15 minutes';
 if saved then insert into public.clan_observations(clan_id,season,clan_name,observed_at,reputation,members) values(p_clan_id,p_season,p_clan_name,p_observed_at,p_reputation,canonical); end if;
 insert into public.clan_latest values(p_clan_id,p_season,p_clan_name,p_observed_at,p_reputation,canonical)
 on conflict(clan_id,season) do update set clan_name=excluded.clan_name,observed_at=excluded.observed_at,reputation=excluded.reputation,members=excluded.members;
 return saved;
end $function$
;
revoke all on function public.record_clan_snapshot(text,text,text,timestamptz,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.record_clan_snapshot(text,text,text,timestamptz,bigint,jsonb) to service_role;
revoke all on function public.clan_progress(text,text) from public,anon,authenticated;
grant execute on function public.clan_progress(text,text) to service_role;
