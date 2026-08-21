// Independent re-implementation of the sibling rules (blocks.mjs:67-96) and of
// set-equality "identical", reading the seed file and extracts directly.
import { readFileSync } from 'node:fs';
const R='C:/Users/d.aerle/Desktop/github/tm-content-parity/';
const rows=JSON.parse(readFileSync(R+'data/10-store-seeds.json','utf8')).rows;
const cp=p=>p.startsWith('fr/')?p.slice(3):p;
const sibs=(store,other)=>{
  const byPath=new Map();
  for(const row of rows){const c=row.stores?.[other]; if(c&&!row.stores?.[store]) byPath.set(cp(c.path??''),row.page);}
  const out=[];
  for(const row of rows){const c=row.stores?.[store]; if(!c) continue;
    if(row.stores?.[other]){out.push([row.page,row.page,'alternate']);continue;}
    const f=byPath.get(cp(c.path??'')); out.push([row.page, f??null, f?'path':null]);}
  return out;};
const units=(store,page)=>{let f;try{f=readFileSync(R+`data/extract/${store}/${page}.json`,'utf8');}catch{return null;}
  const s=JSON.parse(f).production; if(!s||s.status!==200||!s.elements)return null; return s.elements.map(e=>e.norm);};
for(const [a,b] of [['nl','be'],['be','nl'],['be_fr','fr'],['fr','be_fr']]){
  const list=sibs(a,b); const withSib=list.filter(x=>x[1]);
  let identical=0,measured=0,shares=[];const pairs=[];
  for(const [p,q] of withSib){const m=units(a,p),t=units(b,q);
    if(!m||!t||m.length===0){continue;}
    const over=new Set(t),here=new Set(m);
    const found=m.filter(x=>over.has(x)).length;
    const share=found/m.length; shares.push(share); measured++;
    const mutual=found===m.length&&[...over].every(x=>here.has(x));
    if(mutual){identical++;pairs.push(p+'|'+q);}
  }
  shares.sort((x,y)=>x-y);
  const mean=shares.reduce((s,v)=>s+v,0)/shares.length;
  const band=[0,0,0,0,0,0,0];
  for(const s of shares){ if(s===1)band[0]++;else if(s>=0.9)band[1]++;else if(s>=0.75)band[2]++;else if(s>=0.5)band[3]++;else if(s>=0.25)band[4]++;else if(s>0)band[5]++;else band[6]++;}
  console.log(a,'->',b,'total pages',list.length,'with sibling',withSib.length,'measured',measured,
   'identical(setequal)',identical,'mean',mean.toFixed(3),'median',shares[Math.floor(shares.length/2)].toFixed(3),
   'bands[1.00,.90-.99,.75-.89,.50-.74,.25-.49,.01-.24,0]',band.join(','));
  globalThis['P'+a]=new Set(pairs);
}
// Are the identical sets the same pairs both ways?
const norm=s=>new Set([...s].map(x=>x.split('|').sort().join('|')));
console.log('nl/be identical sets equal:', JSON.stringify([...norm(globalThis.Pnl)].sort())===JSON.stringify([...norm(globalThis.Pbe)].sort()));
console.log('be_fr/fr identical sets equal:', JSON.stringify([...norm(globalThis.Pbe_fr)].sort())===JSON.stringify([...norm(globalThis.Pfr)].sort()));
