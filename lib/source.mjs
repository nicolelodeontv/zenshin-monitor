export function configuredIds(value = process.env.TRACKED_CLAN_IDS ?? '') {
  return [...new Set(value.split(',').map(x=>x.trim()).filter(x=>/^[1-9]\d{0,8}$/.test(x)))];
}
export function validate(data) {
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  if (!data || typeof data.name !== 'string' || !data.name.trim() || !integer(data.reputation) || !Array.isArray(data.members) || !data.members.length) throw new Error('Invalid clan response');
  const seen = new Set();
  const members = data.members.map(m => {
    if (!m || typeof m.name !== 'string' || !m.name.trim() || seen.has(m.name) || !integer(m.level) || !integer(m.rep)) throw new Error('Invalid member response');
    seen.add(m.name);
    return {name:m.name,level:m.level,rep:m.rep};
  }).sort((a,b)=>b.rep-a.rep);
  const memberTotal = members.reduce((sum,m)=>sum+m.rep,0);
  return {name:data.name,reputation:data.reputation,members,memberTotal,consistent:memberTotal===data.reputation};
}
export async function readClan(id, fetcher=fetch) {
  if (!configuredIds().includes(id)) throw new Error('Clan not configured');
  const response = await fetcher('https://ninjazenshin.online/clan-ranking/members/'+id,{cache:'no-store',signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error('Source HTTP '+response.status);
  return {...validate(await response.json()), clanId:id, observedAt:new Date().toISOString()};
}
