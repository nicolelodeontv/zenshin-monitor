'use client';
import {useState} from 'react';
import type {Snapshot,Member} from '../lib/source.mjs';
const fmt=(n:number)=>n.toLocaleString('en-US');
export default function Dashboard({ids}:{ids:string[]}){
 const [id,setId]=useState(ids[0]??'');
 const [data,setData]=useState<Snapshot|null>(null);
 const [previous,setPrevious]=useState<Snapshot|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 async function refresh(){if(busy||!id)return;setBusy(true);setError('');try{
 const r=await fetch('/api/clan?id='+encodeURIComponent(id),{cache:'no-store'});
 if(!r.ok)throw new Error('Unable to refresh. Last valid snapshot retained.');
 const next:Snapshot=await r.json();
 setPrevious(data?.clanId===next.clanId?data:null);setData(next);
 }catch(e){setError(e instanceof Error?e.message:'Refresh failed')}finally{setBusy(false)}}
 const delta=(m:Member)=>{const old=previous?.members.find(x=>x.name===m.name);return old?m.rep-old.rep:null};
 const profile=data?.members.find(m=>m.name===selected);
 return <main><header><div><small>READ-ONLY / NINJA ZENSHIN</small><h1>Zenshin Monitor</h1></div><span className="pill">MANUAL SYNC</span></header>
 <section className="toolbar"><label>Clan ID <select value={id} disabled={busy} onChange={e=>{setId(e.target.value);setSelected(null)}}>{ids.map(x=><option key={x}>{x}</option>)}</select></label><button disabled={busy||!id} onClick={refresh}>{busy?'Reading…':'Refresh snapshot'}</button></section>
 {!ids.length&&<p>Configure TRACKED_CLAN_IDS to start.</p>}{error&&<p role="alert">{error}</p>}
 {!data?<section className="panel">Select a configured clan and refresh to read actual game data. No sample data is shown.</section>:<>
 <h2>{data.name}</h2><p className="muted">Observed {new Date(data.observedAt).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})} SGT · source update time unknown {id!==data.clanId?' · displaying previous clan':''}</p>
 {!data.consistent&&<p role="alert">Clan total and member sum differ; source may be updating.</p>}
 <section className="stats"><article><small>CLAN REP</small><strong>{fmt(data.reputation)}</strong></article><article><small>MEMBERS</small><strong>{data.members.length}</strong></article><article><small>MEMBER TOTAL</small><strong>{fmt(data.memberTotal)}</strong></article></section>
 <section className="panel"><div className="toolbar"><h2>Member rankings</h2><input aria-label="Search players" placeholder="Search IGN" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Level</th><th>REP</th><th>Change</th></tr></thead><tbody>{data.members.map((m,i)=>({m,i})).filter(({m})=>m.name.toLowerCase().includes(query.toLowerCase())).map(({m,i})=><tr key={m.name}><td>{i+1}</td><td><button className="link" onClick={()=>setSelected(m.name)}>{m.name}</button></td><td>{m.level}</td><td>{fmt(m.rep)}</td><td>{delta(m)===null?'—':(delta(m)!>0?'+':'')+fmt(delta(m)!)}</td></tr>)}</tbody></table></div></section>
 {profile&&<section className="panel"><div className="toolbar"><h2>{profile.name}</h2><button onClick={()=>setSelected(null)}>Close</button></div><p>Level {profile.level} · {fmt(profile.rep)} REP · Rank #{data.members.indexOf(profile)+1}</p><p>Contribution: {data.reputation?(100*profile.rep/data.reputation).toFixed(2)+'%':'—'}</p></section>}
 <p className="muted">Changes compare consecutive manual observations in this tab. No permanent character IDs, stamina, or exact attack events are supplied.</p></>}
 </main>
}
