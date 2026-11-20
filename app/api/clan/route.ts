import {readClan,configuredIds} from '../../../lib/source.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!configuredIds().includes(id)) return Response.json({error:'Clan not configured'},{status:400});
 try{return Response.json(await readClan(id),{headers:{'Cache-Control':'no-store'}})}
 catch{return Response.json({error:'Source unavailable or invalid response'},{status:502,headers:{'Cache-Control':'no-store'}})}
}
