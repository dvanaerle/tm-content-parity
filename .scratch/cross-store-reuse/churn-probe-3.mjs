/** Third part of the ticket-01 probe: the comparator — how much repetition today's corpus holds. */
import { readFileSync } from 'node:fs';
import { decodeRunLog } from '../../compare/run-log.mjs';
import { isWork, visibilityOf } from '../../compare/vocabulary.mjs';

const log = decodeRunLog(readFileSync('history/run-log.jsonl', 'utf8'));
const seen = log.rows.filter((r) => r.seen);
console.log('run-log rows still seen:', seen.length);
const byVis = new Map();
for (const r of seen) byVis.set(visibilityOf(r.class), (byVis.get(visibilityOf(r.class)) || 0) + 1);
console.log('by visibility:', JSON.stringify([...byVis]));
console.log('work findings:', seen.filter((r) => isWork(r.class)).length);
const perStore = new Map();
for (const r of seen) {
  if (!isWork(r.class)) continue;
  perStore.set(r.store, (perStore.get(r.store) || 0) + 1);
}
console.log('work findings per store:', JSON.stringify([...perStore].sort()));
