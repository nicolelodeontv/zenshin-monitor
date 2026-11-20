import {timingSafeEqual} from 'node:crypto';
import {configuredIds,readClan} from '../../../lib/source.mjs';
import {storeSnapshot} from '../../../lib/storage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const secret=process.env.SYNC_SECRET;
 const provided=request.headers.get('authorization')??'';
 const expected='Bearer '+secret;
 if(!secret||secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return Response.json({error:'Unauthorized'},{status:401});
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!configuredIds().includes(id))return Response.json({error:'Clan not configured'},{status:400});
 try{const snapshot=await readClan(id);await storeSnapshot(snapshot);return Response.json({ok:true,observedAt:snapshot.observedAt},{headers:{'Cache-Control':'no-store'}})}
 catch{return Response.json({error:'Collection or storage failed'},{status:502})}
}
