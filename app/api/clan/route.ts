import {readClan,configuredIds} from '../../../lib/source.mjs';
import {latestSnapshot} from '../../../lib/storage';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!configuredIds().includes(id)) return Response.json({error:'Clan not configured'},{status:400});
 try{
 const configured=!!(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.ZENSHIN_SEASON);
 const data=configured?await latestSnapshot(id):await readClan(id);
 if(!data)return Response.json({error:'No stored snapshot; run authorized sync first'},{status:404});
 return Response.json(data,{headers:{'Cache-Control':'no-store'}})}
 catch{return Response.json({error:'Source or storage unavailable'},{status:502,headers:{'Cache-Control':'no-store'}})}
}
