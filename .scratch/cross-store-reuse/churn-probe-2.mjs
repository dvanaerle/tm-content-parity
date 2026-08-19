/** Second half of the ticket-01 probe: what the 132 orphan dismissals actually are. */
import { readFileSync, readdirSync } from 'node:fs';
import { decodeRunLog } from '../../compare/run-log.mjs';
import { FINDING_CLASSES } from '../../compare/vocabulary.mjs';

const log = decodeRunLog(readFileSync('history/run-log.jsonl', 'utf8'));
const liveIds = new Set();
const livePages = new Set();
for (const f of readdirSync('data/reports')) {
  const j = JSON.parse(readFileSync(`data/reports/${f}`, 'utf8'));
  livePages.add(`${j.store}|${j.page}`);
  for (const fi of j.findings ?? []) liveIds.add(fi.id);
}
const events = JSON.parse(
  readFileSync('data/overrides-backup-2026-08-18T09-46-51-393Z.json', 'utf8'),
);
const key = (e) =>
  [e.scope, e.store, e.page, (e.scope === 'finding' ? e.finding_id : e.class) ?? ''].join('|');
const latest = new Map();
for (const e of events) {
  const k = key(e);
  const p = latest.get(k);
  if (!p || e.created_at > p.created_at) latest.set(k, e);
}
const dismissals = [...latest.values()].filter((e) => e.action === 'dismissed' && e.scope === 'finding');
const orphan = dismissals.filter((e) => !liveIds.has(e.finding_id));
console.log('standing dismissals', dismissals.length, 'orphans', orphan.length);

const onLivePage = orphan.filter((e) => livePages.has(`${e.store}|${e.page}`));
console.log('orphans whose page is still compared:', onLivePage.length);
console.log('orphans whose page has left the corpus:', orphan.length - onLivePage.length);
const gonePages = new Map();
for (const e of orphan) {
  if (!livePages.has(`${e.store}|${e.page}`)) {
    const k = `${e.store}|${e.page}`;
    gonePages.set(k, (gonePages.get(k) || 0) + 1);
  }
}
console.log('pages no longer compared, with orphan count:');
for (const [k, n] of [...gonePages].sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${k}`);

const day = (e) => e.created_at.slice(0, 10);
const buckets = new Map();
for (const e of dismissals) {
  const d = day(e);
  const b = buckets.get(d) ?? { total: 0, orphan: 0 };
  b.total += 1;
  if (!liveIds.has(e.finding_id)) b.orphan += 1;
  buckets.set(d, b);
}
console.log('\ndismissals by day written -> orphan / total (share)');
for (const d of [...buckets.keys()].sort()) {
  const b = buckets.get(d);
  console.log(`  ${d}: ${b.orphan}/${b.total}  ${((100 * b.orphan) / b.total).toFixed(1)}%`);
}

console.log('\nclass vocabulary size:', FINDING_CLASSES.length);
// The dismissal row carries no class, so an orphan's class is not recoverable from the dump.
console.log('orphan rows carrying a class value:', orphan.filter((e) => e.class).length);

// Per store totals in the corpus, plus pages per store.
const stores = ['be', 'be_fr', 'de', 'fr', 'nl', 'uk'];
console.log('\nstore: run-log rows / pages compared / standing dismissals / orphans');
for (const s of stores) {
  console.log(
    `  ${s}: ${log.rows.filter((r) => r.store === s).length} / ` +
      `${[...livePages].filter((p) => p.startsWith(`${s}|`)).length} / ` +
      `${dismissals.filter((d) => d.store === s).length} / ` +
      `${orphan.filter((d) => d.store === s).length}`,
  );
}
console.log('\nclasses in the corpus, by rows');
const cls = new Map();
for (const r of log.rows) cls.set(r.class, (cls.get(r.class) || 0) + 1);
for (const [k, n] of [...cls].sort((a, b) => b[1] - a[1])) console.log(`  ${n}  ${k}`);
