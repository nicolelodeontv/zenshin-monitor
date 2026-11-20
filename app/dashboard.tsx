'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import type {Snapshot,Member} from '../lib/source.mjs';
type Progress={observedAt:string;windows:Record<string,{baselineAt:string;members:Record<string,number>}|null>};
const periods=[['1','1h'],['3','3h'],['6','6h'],['12','12h'],['24','24h'],['168','7d']];
const fmt=(n:number)=>n.toLocaleString('en-US');
export default function Dashboard({ids,stored}:{ids:string[],stored:boolean}){
 const [auto,setAuto]=useState(stored);
 const [now,setNow]=useState(0);
 const [health,setHealth]=useState<{status:string;last_success_at:string|null}|null>(null);
 const active=useRef<AbortController|null>(null);
 const latest=useRef<Snapshot|null>(null);
 const [id,setId]=useState(ids[0]??'');
 const [data,setData]=useState<Snapshot|null>(null);
 const [progress,setProgress]=useState<Progress|null>(null);
 const [previous,setPrevious]=useState<Snapshot|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
 if(!id||active.current)return;
 const controller=new AbortController();active.current=controller;setBusy(true);setError('');
 const opts={cache:'no-store' as const,signal:controller.signal};
 try{
 const r=await fetch('/api/clan?id='+encodeURIComponent(id),opts);
 if(!r.ok)throw new Error(r.status===404?'No stored snapshot yet. Run authorized sync first.':'Unable to refresh. Last valid snapshot retained.');
 const next:Snapshot=await r.json();
 if(controller.signal.aborted)return;
 const old=latest.current;
 if(!old||old.clanId!==next.clanId||Date.parse(old.observedAt)!==Date.parse(next.observedAt)){
 setPrevious(old?.clanId===next.clanId?old:null);setProgress(null);
 }
 latest.current=next;setData(next);
 if(stored){
 const [p,h]=await Promise.allSettled([fetch('/api/progress?id='+encodeURIComponent(id),opts).then(r=>r.ok?r.json():null),fetch('/api/health?id='+encodeURIComponent(id),opts).then(r=>r.ok?r.json():null)]);
 if(controller.signal.aborted)return;
 if(p.status==='fulfilled'&&p.value&&Date.parse(p.value.observedAt)===Date.parse(next.observedAt))setProgress(p.value);
 else setProgress(null);
 setHealth(h.status==='fulfilled'?h.value:null);
 }
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Refresh failed')}
 finally{if(active.current===controller){active.current=null;setBusy(false)}}
 },[id,stored]);
 useEffect(()=>{
 latest.current=null;setData(null);setPrevious(null);setProgress(null);setHealth(null);setBusy(false);
 if(stored)void refresh();
 return ()=>{active.current?.abort();active.current=null};
 },[refresh,stored]);
 useEffect(()=>{
 if(!auto||!stored)return;
 const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},60000);
 return ()=>clearInterval(timer);
 },[auto,stored,refresh]);
 useEffect(()=>{const tick=()=>setNow(Date.now());tick();const timer=setInterval(tick,1000);return ()=>clearInterval(timer)},[]);
 const age=data&&now?Math.max(0,Math.floor((now-Date.parse(data.observedAt))/1000)):null;
 const freshness=age===null?'NO SNAPSHOT':age<120?'RECENT':age<900?'AGING':'STALE';
 const delta=(m:Member)=>{const old=previous?.members.find(x=>x.name===m.name);return old?m.rep-old.rep:null};
 const gain=(name:string,h:string)=>{const members=progress?.windows[h]?.members;return members&&Object.hasOwn(members,name)?members[name]:null};
 const display=(value:number|null)=>value===null?'—':(value>0?'+':'')+fmt(value);
 const profile=data?.members.find(m=>m.name===selected);
 return <main><header><div><small>READ-ONLY / NINJA ZENSHIN</small><h1>Zenshin Monitor</h1></div><span className="pill" data-state={freshness}>{freshness} · {stored?'STORED DATA':'MANUAL SOURCE'}</span></header>
 <section className="toolbar"><label>Clan ID <select value={id} disabled={busy} onChange={e=>{setId(e.target.value);setSelected(null)}}>{ids.map(x=><option key={x}>{x}</option>)}</select></label><button disabled={busy||!id} onClick={refresh}>{busy?'Reading…':'Refresh snapshot'}</button>{stored&&<label><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/> Auto-refresh stored data (60s)</label>}</section>
 {!ids.length&&<p>Configure TRACKED_CLAN_IDS to start.</p>}{error&&<p role="alert">{error}</p>}
 {!data?<section className="panel">Select a configured clan and refresh to read actual game data. No sample data is shown.</section>:<>
 <h2>{data.name}</h2><p className="muted" aria-live="polite">Snapshot age: {age===null?'—':`${Math.floor(age/60)}m ${age%60}s`} · Collector: {health?.status??'unknown'} · {health?.last_success_at?'Last successful sync '+new Date(health.last_success_at).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})+' SGT':'No confirmed sync status'}</p><p className="muted">Observed {new Date(data.observedAt).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})} SGT · source update time unknown {id!==data.clanId?' · displaying previous clan':''}</p>
 {!data.consistent&&<p role="alert">Clan total and member sum differ; source may be updating.</p>}
 <section className="stats"><article><small>CLAN REP</small><strong>{fmt(data.reputation)}</strong></article><article><small>MEMBERS</small><strong>{data.members.length}</strong></article><article><small>MEMBER TOTAL</small><strong>{fmt(data.memberTotal)}</strong></article></section>
 <section className="panel"><div className="toolbar"><h2>Member rankings</h2><input aria-label="Search players" placeholder="Search IGN" value={query} onChange={e=>setQuery(e.target.value)}/></div>
 <div className="scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Level</th><th>REP</th><th>Change</th>{periods.map(([h,label])=><th key={h}>{label}</th>)}</tr></thead><tbody>{data.members.map((m,i)=>({m,i})).filter(({m})=>m.name.toLowerCase().includes(query.toLowerCase())).map(({m,i})=><tr key={m.name}><td>{i+1}</td><td><button className="link" onClick={()=>setSelected(m.name)}>{m.name}</button></td><td>{m.level}</td><td>{fmt(m.rep)}</td><td>{delta(m)===null?'—':(delta(m)!>0?'+':'')+fmt(delta(m)!)}</td>{periods.map(([h])=><td key={h} title={progress?.windows[h]?.baselineAt??'No baseline'}>{display(gain(m.name,h))}</td>)}</tr>)}</tbody></table></div></section>
 {profile&&<section className="panel"><div className="toolbar"><h2>{profile.name}</h2><button onClick={()=>setSelected(null)}>Close</button></div><p>Level {profile.level} · {fmt(profile.rep)} REP · Rank #{data.members.indexOf(profile)+1}</p><p>Contribution: {data.reputation?(100*profile.rep/data.reputation).toFixed(2)+'%':'—'}</p><div className="stats">{periods.map(([h,label])=><article key={h}><small>{label} REP GAIN</small><strong>{display(gain(profile.name,h))}</strong><small>{progress?.windows[h]?.baselineAt?new Date(progress.windows[h]!.baselineAt).toLocaleString('en-SG',{timeZone:'Asia/Singapore'})+' SGT baseline':'No baseline'}</small></article>)}</div></section>}
 <p className="muted">Historical gains use the last observed baseline at or before each interval; missing history is shown as —. Changes compare consecutive distinct observations in this tab. Auto-refresh reads stored data only and does not trigger game collection. No permanent character IDs, stamina, or exact attack events are supplied.</p></>}
 </main>
}
