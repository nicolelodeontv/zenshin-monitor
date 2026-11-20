import {configuredIds} from '../../../lib/source.mjs';import {readProgress} from '../../../lib/storage';
export const dynamic='force-dynamic';
export async function GET(request:Request){const id=new URL(request.url).searchParams.get('id')??'';if(!configuredIds().includes(id))return Response.json({error:'Invalid clan'},{status:400});try{return Response.json(await readProgress(id),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Progress unavailable'},{status:502})}}
