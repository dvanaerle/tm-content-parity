// Independent measurement 3: own key rule (state.mjs:130-133), own sibling rule
// (blocks.mjs:67-96), own repeat key (view.mjs:804-814). No imports from the repo.
import { readFileSync, readdirSync } from 'node:fs';
const R='C:/Users/d.aerle/Desktop/github/tm-content-parity/';
const ev=JSON.parse(readFileSync(R+'data/overrides-backup-2026-08-18T09-46-51-393Z.json','utf8'));
const PAGE_KEY={prioritised:'priority',noted:'note'};
const ekey=r=>{const k=r.scope==='finding'?r.finding_id:(r.scope==='page'?(PAGE_KEY[r.action]??''):null)??r.class;return [r.scope,r.store,r.page,k??''].join('|');};
const later=(a,b)=>a.created_at===b.created_at?String(a.id??'')>String(b.id??''):a.created_at>b.created_at;
const cur=new Map();for(const r of ev){const k=ekey(r);const h=cur.get(k);if(!h||later(r,h))cur.set(k,r);}
const standing=[...cur.values()];
const claims=standing.filter(r=>r.scope==='finding'&&r.action==='fixed');
const dis=standing.filter(r=>r.scope==='finding'&&r.action==='dismissed');
const rows=JSON.parse(readFileSync(R+'data/10-store-seeds.json','utf8')).rows;
const cp=p=>p.startsWith('fr/')?p.slice(3):p;
const sib=new Map();
for(const [s,o] of [['nl','be'],['be','nl'],['be_fr','fr'],['fr','be_fr']]){
  const byPath=new Map();
  for(const r of rows){const c=r.stores?.[o];if(c&&!r.stores?.[s])byPath.set(cp(c.path??''),r.page);}
  for(const r of rows){const c=r.stores?.[s];if(!c)continue;
    if(r.stores?.[o]){sib.set(s+'|'+r.page,r.page);continue;}
    const f=byPath.get(cp(c.path??''));if(f)sib.set(s+'|'+r.page,f);}
}
const SEP='__';
const fname=(s,p)=>s+SEP+p.replaceAll('/',SEP)+'.json';
const cache=new Map();
const fin=(s,p)=>{const k=s+'|'+p;if(cache.has(k))return cache.get(k);
 let v=null;try{v=JSON.parse(readFileSync(R+'data/reports/'+fname(s,p),'utf8')).findings;}catch{v=null;}
 cache.set(k,v);return v;};
const lang=s=>({nl:'nl',be:'nl',be_fr:'fr',fr:'fr'})[s]??s;
const rkey=(s,f)=>JSON.stringify([lang(s),f.class,f.prod,f.new,f.detail]);
const other=s=>({nl:'be',be:'nl',be_fr:'fr',fr:'be_fr'})[s];
const standingClaimId=new Set(claims.map(c=>c.store+'|'+c.page+'|'+c.finding_id));
const standingDecidedId=new Set([...claims,...dis].map(c=>c.store+'|'+c.page+'|'+c.finding_id));
const everFixedId=new Set(ev.filter(r=>r.scope==='finding'&&r.action==='fixed').map(c=>c.store+'|'+c.page+'|'+c.finding_id));
const everDecidedId=new Set(ev.filter(r=>r.scope==='finding'&&['fixed','dismissed'].includes(r.action)).map(c=>c.store+'|'+c.page+'|'+c.finding_id));
const t={inBlock:0,findingOnPage:0,hasSibling:0,sibReport:0,sameFinding:0,twinStandingClaim:0,twinStandingDecided:0,twinEverFixed:0,twinEverDecided:0};
const seven=[];
for(const c of claims){
  const o=other(c.store); if(!o) continue; t.inBlock++;
  const here=fin(c.store,c.page); const f=here?.find(x=>x.id===c.finding_id); if(!f) continue; t.findingOnPage++;
  const sp=sib.get(c.store+'|'+c.page); if(!sp) continue; t.hasSibling++;
  const there=fin(o,sp); if(!there) continue; t.sibReport++;
  const k=rkey(c.store,f); const twin=there.find(x=>rkey(o,x)===k); if(!twin) continue; t.sameFinding++;
  const tid=o+'|'+sp+'|'+twin.id;
  if(standingClaimId.has(tid))t.twinStandingClaim++;
  if(standingDecidedId.has(tid))t.twinStandingDecided++;
  if(everFixedId.has(tid))t.twinEverFixed++;
  if(everDecidedId.has(tid))t.twinEverDecided++;
  seven.push([c.store,c.page,'->',o,sp,f.class,c.created_at.slice(0,10),c.editor,'twinEverFixed',everFixedId.has(tid)]);
}
console.log('standing',standing.length,'claims',claims.length,'dismissals',dis.length);
console.log(t);
for(const s of seven)console.log(s.join(' '));
