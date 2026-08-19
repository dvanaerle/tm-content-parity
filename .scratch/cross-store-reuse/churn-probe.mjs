/**
 * Throwaway probe for ticket 01 — measure finding churn.
 * Reads only data already on disk. Writes nothing. Run from the repo root:
 *   node .scratch/cross-store-reuse/churn-probe.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { decodeRunLog } from '../../compare/run-log.mjs';

const out = (...a) => console.log(...a);

// ---- 1. The corpus: the run log, decoded by the module that owns its shape.
const raw = readFileSync('history/run-log.jsonl', 'utf8');
const log = decodeRunLog(raw);
out('# run log');
out('rows:', log.rows.length);
out('header observationId:', log.observationId);
out('header stores:', JSON.stringify(log.stores));

const runs = new Set();
for (const r of log.rows) {
  runs.add(r.firstSeen);
  runs.add(r.lastSeen);
  if (r.retiredAt) runs.add(r.retiredAt);
}
for (const v of Object.values(log.stores)) runs.add(v);
const ordered = [...runs].sort();
out('distinct observation ids in the corpus:', ordered.length);
ordered.forEach((id, i) => out(`  run ${i + 1}: ${id}`));

// ---- 2. Lifespan. The log stores no run list, so a lifespan in runs is only
// derivable by locating firstSeen and lastSeen in the ordered set above.
const rank = new Map(ordered.map((id, i) => [id, i]));
const life = new Map();
const byStoreLife = new Map();
for (const r of log.rows) {
  const n = rank.get(r.lastSeen) - rank.get(r.firstSeen) + 1;
  life.set(n, (life.get(n) || 0) + 1);
  const k = `${r.store}|${n}`;
  byStoreLife.set(k, (byStoreLife.get(k) || 0) + 1);
}
out('\n# lifespan in runs (lastSeen rank - firstSeen rank + 1)');
for (const n of [...life.keys()].sort((a, b) => a - b)) out(`  ${n} run(s): ${life.get(n)} ids`);

const stores = [...new Set(log.rows.map((r) => r.store))].sort();
out('\n# per store: rows / still seen / retired');
for (const s of stores) {
  const rows = log.rows.filter((r) => r.store === s);
  out(
    `  ${s}: ${rows.length} rows, ${rows.filter((r) => r.seen).length} still seen, ` +
      `${rows.filter((r) => !r.seen).length} not seen any more`,
  );
}

// ---- 3. The ids the last run stopped seeing.
const gone = log.rows.filter((r) => !r.seen);
out('\n# ids no longer seen (id, store, page, class, firstSeen, lastSeen, retiredAt)');
for (const r of gone) {
  out(`  ${r.id} ${r.store} ${r.page} ${r.class} ${r.firstSeen} ${r.lastSeen} ${r.retiredAt}`);
}
const goneByPage = new Map();
const goneByClass = new Map();
for (const r of gone) {
  const k = `${r.store}|${r.page}`;
  goneByPage.set(k, (goneByPage.get(k) || 0) + 1);
  goneByClass.set(r.class, (goneByClass.get(r.class) || 0) + 1);
}
out('\n# pages producing ids that stopped being seen, ranked');
for (const [k, n] of [...goneByPage].sort((a, b) => b[1] - a[1])) out(`  ${n}  ${k}`);
out('\n# classes those ids carry');
for (const [k, n] of [...goneByClass].sort((a, b) => b[1] - a[1])) out(`  ${n}  ${k}`);

// ---- 4. Ids new in the newest run (arrivals, the other half of churn).
const newest = ordered[ordered.length - 1];
const fresh = log.rows.filter((r) => r.firstSeen === newest);
out(`\n# ids first seen in the newest run (${fresh.length})`);
for (const r of fresh) out(`  ${r.id} ${r.store} ${r.page} ${r.class}`);

// ---- 5. The reports on disk, as a second witness of what exists now.
const dir = 'data/reports';
const liveIds = new Set();
const reportObs = new Map();
for (const f of readdirSync(dir)) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  reportObs.set(j.observationId, (reportObs.get(j.observationId) || 0) + 1);
  for (const fi of j.findings ?? []) liveIds.add(fi.id);
}
out('\n# data/reports');
out('report files:', readdirSync(dir).length, 'finding ids:', liveIds.size);
out('observation ids in reports:', JSON.stringify([...reportObs]));
const logSeen = new Set(log.rows.filter((r) => r.seen).map((r) => r.id));
out('run-log ids still seen:', logSeen.size);
out('in reports but not seen in run log:', [...liveIds].filter((i) => !logSeen.has(i)).length);
out('seen in run log but not in reports:', [...logSeen].filter((i) => !liveIds.has(i)).length);

// ---- 6. The dismissal side.
const dumps = readdirSync('data').filter((f) => f.startsWith('overrides-backup-')).sort();
out('\n# override backups on disk:', JSON.stringify(dumps));
const dump = dumps[dumps.length - 1];
const events = JSON.parse(readFileSync(`data/${dump}`, 'utf8'));
out('using:', dump, '/ events:', events.length);

// Latest event per key wins (overrides/state.mjs eventKey + latestByKey).
const key = (e) =>
  [e.scope, e.store, e.page, (e.scope === 'finding' ? e.finding_id : e.class) ?? ''].join('|');
const latest = new Map();
for (const e of events) {
  const k = key(e);
  const prev = latest.get(k);
  if (!prev || e.created_at > prev.created_at) latest.set(k, e);
}
const dismissals = [...latest.values()].filter(
  (e) => e.action === 'dismissed' && e.scope === 'finding',
);
out('standing dismissals (latest-per-key, scope=finding):', dismissals.length);
out('raw dismissed events:', events.filter((e) => e.action === 'dismissed').length);

const orphan = dismissals.filter((e) => !liveIds.has(e.finding_id));
const notInLogAtAll = dismissals.filter((e) => !log.rows.some((r) => r.id === e.finding_id));
out('dismissals keyed on an id absent from data/reports:', orphan.length);
out('dismissals keyed on an id absent from the run log entirely:', notInLogAtAll.length);
const logIds = new Map(log.rows.map((r) => [r.id, r]));
const orphanRetired = orphan.filter((e) => logIds.has(e.finding_id));
out('orphans the run log does hold as no-longer-seen:', orphanRetired.length);
for (const e of orphanRetired) {
  const r = logIds.get(e.finding_id);
  out(`  ${e.finding_id} ${e.store} ${e.page} ${r.class} written ${e.created_at} gone ${r.retiredAt}`);
}
const byStore = new Map();
for (const e of orphan) byStore.set(e.store, (byStore.get(e.store) || 0) + 1);
out('orphan dismissals per store:');
for (const s of stores) out(`  ${s}: ${byStore.get(s) || 0} of ${dismissals.filter((d) => d.store === s).length}`);
const pageOrphan = new Map();
for (const e of orphan) {
  const k = `${e.store}|${e.page}`;
  pageOrphan.set(k, (pageOrphan.get(k) || 0) + 1);
}
out('top pages by orphan dismissals:');
for (const [k, n] of [...pageOrphan].sort((a, b) => b[1] - a[1]).slice(0, 25)) out(`  ${n}  ${k}`);
out('earliest / latest dismissal written:',
  dismissals.map((d) => d.created_at).sort()[0],
  dismissals.map((d) => d.created_at).sort().at(-1));
const obsInDump = new Set(events.map((e) => e.observation_id).filter(Boolean));
out('distinct observation ids referenced by override events:', obsInDump.size);
out([...obsInDump].sort().join('\n'));
