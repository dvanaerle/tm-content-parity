/**
 * Ticket 11, measurement 2 — the pairing. The agreement share per page pair, both ways
 * round, as a distribution. Throwaway probe over `data/extract/`. No network, no writes.
 *
 * `blockReading()` is reused rather than rewritten: it already is this measurement
 * (`share`, `mutual`, `unmeasured`), and a second alignment here would be a second
 * definition of *how much two stores agree*.
 */
import { readFileSync } from 'node:fs';
import { blockReading } from '../../web/src/lib/blocks.mjs';
import { LANGUAGE_BLOCKS } from '../../web/src/lib/language-blocks.mjs';

const ROOT = new URL('../../', import.meta.url);
const rows = JSON.parse(readFileSync(new URL('data/10-store-seeds.json', ROOT), 'utf8')).rows;

/** Production content-unit norms of one store page, or null where no extract covers it. */
const unitsOf = (store, page) => {
  let file;
  try {
    file = readFileSync(new URL(`data/extract/${store}/${page}.json`, ROOT), 'utf8');
  } catch {
    return null;
  }
  const side = JSON.parse(file).production;
  if (!side || side.status !== 200 || !side.elements) return null;
  return side.elements.map((unit) => unit.norm);
};

const BUCKETS = [
  ['1.00 (identical, mutual)', (s, r) => r.kind === 'identical'],
  ['1.00 (contained, not mutual)', (s, r) => s === 1 && r.kind !== 'identical'],
  ['0.90–0.99', (s) => s >= 0.9],
  ['0.75–0.89', (s) => s >= 0.75],
  ['0.50–0.74', (s) => s >= 0.5],
  ['0.25–0.49', (s) => s >= 0.25],
  ['0.01–0.24', (s) => s > 0],
  ['0.00', () => true],
];

for (const block of LANGUAGE_BLOCKS) {
  for (const store of block.stores) {
    const reading = blockReading({ rows, store, unitsOf });
    const measured = reading.shared.filter((one) => one.share !== null);
    const counts = new Map(BUCKETS.map(([name]) => [name, []]));
    for (const row of measured) {
      const bucket = BUCKETS.find(([, test]) => test(row.share, row))[0];
      counts.get(bucket).push(row);
    }
    const shares = measured.map((one) => one.share).sort((a, b) => a - b);
    const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
    const median = shares[Math.floor(shares.length / 2)];
    console.log(`\n=== ${store} → ${reading.sibling} (${reading.language}) side=${reading.side}`);
    console.log(
      `pages this store has: ${reading.rows.length - reading.absentHere.length}` +
        ` · with a sibling: ${reading.shared.length + 0}` +
        ` · sibling absent: ${reading.absentThere.length}` +
        ` · only in sibling: ${reading.absentHere.length}`,
    );
    console.log(
      `shared: ${reading.shared.length} · measured: ${measured.length}` +
        ` · unmeasured: ${reading.shared.filter((o) => o.share === null).length}` +
        ` · identical (mutual): ${reading.identical}`,
    );
    console.log(`mean share ${mean.toFixed(3)} · median ${median?.toFixed(3)}`);
    for (const [name] of BUCKETS) {
      const got = counts.get(name);
      const pct = ((100 * got.length) / measured.length).toFixed(1);
      console.log(`  ${name.padEnd(30)} ${String(got.length).padStart(4)}  ${pct}%`);
    }
  }
}
