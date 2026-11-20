import {timingSafeEqual,randomUUID} from 'node:crypto';
import {configuredIds,readClan} from '../../../lib/source.mjs';
import {storeSnapshot,beginSync,finishSync,pruneHistory} from '../../../lib/storage';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const secret=process.env.SYNC_SECRET;
 const provided=request.headers.get('authorization')??'';
 const expected='Bearer '+secret;
 if(!secret||secret.length<32||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return Response.json({error:'Unauthorized'},{status:401});
 const id=new URL(request.url).searchParams.get('id')??'';
 if(!configuredIds().includes(id))return Response.json({error:'Clan not configured'},{status:400});
 const token=randomUUID();let acquired=false;
 try{
 acquired=await beginSync(id,token);
 if(!acquired)return Response.json({error:'Sync busy or cooling down'},{status:429,headers:{'Retry-After':'60'}});
 const snapshot=await readClan(id);await storeSnapshot(snapshot);
 if(!await finishSync(id,token,true))throw new Error('Lease lost');
 let retentionWarning=false;try{await pruneHistory()}catch{retentionWarning=true}
 return Response.json({ok:true,observedAt:snapshot.observedAt,retentionWarning},{headers:{'Cache-Control':'no-store'}})
 }catch{if(acquired)try{await finishSync(id,token,false)}catch{/* lease expires */}return Response.json({error:'Collection or storage failed'},{status:502})}
}
