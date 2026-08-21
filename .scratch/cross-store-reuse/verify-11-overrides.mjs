// Independent reimplementation of the documented key rule (state.mjs:118-133, 160-173),
// reading the snake_case rows directly. No import of state.mjs.
import { readFileSync, readdirSync } from 'node:fs';
const R='C:/Users/d.aerle/Desktop/github/tm-content-parity/';
const ev=JSON.parse(readFileSync(R+'data/overrides-backup-2026-08-18T09-46-51-393Z.json','utf8'));
const PAGE_KEY={prioritised:'priority',noted:'note'};
const key=r=>{const k=r.scope==='finding'?r.finding_id:(r.scope==='page'?(PAGE_KEY[r.action]??''):null)??r.class;
 return [r.scope,r.store,r.page,k??''].join('|');};
const later=(a,b)=>a.created_at===b.created_at?String(a.id??'')>String(b.id??''):a.created_at>b.created_at;
const cur=new Map();
for(const r of ev){const k=key(r);const h=cur.get(k); if(!h||later(r,h)) cur.set(k,r);}
const standing=[...cur.values()];
console.log('events',ev.length,'standing',standing.length);
const claims=standing.filter(r=>r.scope==='finding'&&r.action==='fixed');
const dis=standing.filter(r=>r.scope==='finding'&&r.action==='dismissed');
console.log('standing fix claims',claims.length,'dismissals',dis.length);
const per={};for(const c of claims)per[c.store]=(per[c.store]??0)+1;console.log('claims per store',per);
const perD={};for(const c of dis)perD[c.store]=(perD[c.store]??0)+1;console.log('dismissals per store',perD);
// finding ids present in the whole corpus
const ids=new Set();
for(const f of readdirSync(R+'data/reports')){const rep=JSON.parse(readFileSync(R+'data/reports/'+f,'utf8'));
 for(const one of rep.findings) ids.add(one.id);}
console.log('distinct finding ids in corpus',ids.size);
const detachedC=claims.filter(c=>!ids.has(c.finding_id)).length;
const detachedD=dis.filter(c=>!ids.has(c.finding_id)).length;
console.log('claims detached (id absent anywhere)',detachedC,'of',claims.length);
console.log('dismissals detached',detachedD,'of',dis.length,(100*detachedD/dis.length).toFixed(1)+'%');
// also: id absent from THAT page's report (probe 3's actual test)
const onPage=new Map();
for(const f of readdirSync(R+'data/reports')){const rep=JSON.parse(readFileSync(R+'data/reports/'+f,'utf8'));
 onPage.set(rep.store+'|'+rep.page,new Set(rep.findings.map(o=>o.id)));}
const notOnPage=claims.filter(c=>!(onPage.get(c.store+'|'+c.page)?.has(c.finding_id))).length;
console.log('claims whose id is not on its own page report',notOnPage);
const blocked=claims.filter(c=>['nl','be','be_fr','fr'].includes(c.store));
console.log('claims in a store with a block',blocked.length);
