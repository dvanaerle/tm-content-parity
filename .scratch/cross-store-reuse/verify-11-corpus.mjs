import { readFileSync, readdirSync } from 'node:fs';
const R='C:/Users/d.aerle/Desktop/github/tm-content-parity/';
const files=readdirSync(R+'data/reports').filter(f=>f.endsWith('.json'));
let findings=0; const obs=new Map(); const built=new Set(); const perStore={};
for(const f of files){const r=JSON.parse(readFileSync(R+'data/reports/'+f,'utf8'));
 findings+=r.findings.length; obs.set(r.observationId??r.observation_id??'?', (obs.get(r.observationId??r.observation_id??'?')??0)+1);
 if(r.builtAt) built.add(String(r.builtAt).slice(0,10));
 perStore[r.store]=(perStore[r.store]??0)+r.findings.length;}
console.log('report files',files.length,'findings',findings);
console.log('observations',[...obs]);
console.log('builtAt days',[...built]);
console.log('findings per store',perStore);
const log=readFileSync(R+'history/run-log.jsonl','utf8').split('\n').filter(l=>l.trim());
console.log('run-log rows',log.length);
const seeds=JSON.parse(readFileSync(R+'data/10-store-seeds.json','utf8'));
console.log('seed rows',seeds.rows.length, Object.keys(seeds));
const ev=JSON.parse(readFileSync(R+'data/overrides-backup-2026-08-18T09-46-51-393Z.json','utf8'));
console.log('override events',ev.length,'keys of row0',Object.keys(ev[0]));
