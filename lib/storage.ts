import type {Snapshot} from './source.mjs';
function config(){
 const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY, season=process.env.ZENSHIN_SEASON;
 if(!url||!key||!season) throw new Error('Storage not configured');
 const parsed=new URL(url);if(parsed.protocol!=='https:')throw new Error('HTTPS required');
 return {url:parsed.origin,key,season};
}
async function request(path:string,init:RequestInit={}){
 const {url,key}=config();
 const response=await fetch(url+'/rest/v1/'+path,{...init,cache:'no-store',signal:AbortSignal.timeout(15000),headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...init.headers}});
 if(!response.ok)throw new Error('Storage request failed: '+response.status);
 return response;
}
export async function storeSnapshot(snapshot:Snapshot){
 const {season}=config();
 if(!snapshot.consistent)throw new Error('Inconsistent snapshot');
 await request('clan_observations',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({clan_id:snapshot.clanId,season,observed_at:snapshot.observedAt,reputation:snapshot.reputation,members:snapshot.members,clan_name:snapshot.name})});
}
export async function latestSnapshot(id:string):Promise<Snapshot|null>{
 const {season}=config();
 const q=new URLSearchParams({clan_id:'eq.'+id,season:'eq.'+season,order:'observed_at.desc',limit:'1',select:'clan_id,observed_at,reputation,members,clan_name'});
 const rows=await (await request('clan_observations?'+q)).json();
 if(!rows.length)return null;
 const row=rows[0];const {validate}=await import('./source.mjs');
 // Name is preserved on each record by the schema below.
 return {...validate({name:row.clan_name,reputation:row.reputation,members:row.members}),clanId:id,observedAt:row.observed_at};
}
