/**
 * The measurement gate of ticket 05, run against the **emitted** search indexes.
 *
 * Ticket 03's gate asked its question of `loadSummaries()`, because the thing it changed
 * was the dashboard's grouping. This one asks it of `dist/search-index/<store>.json`,
 * because the thing this ticket changes is which index the search scans — and the index is
 * not the summaries. It holds `work` findings on comparable pages, cut to nine fields, and
 * measuring the hole off the summaries would be measuring the neighbouring set.
 *
 * Read the emitted files and not a fresh build, for `probe-search-index.mjs`' reason: the
 * bytes an editor's browser downloads are the bytes the build wrote, and the second number
 * this gate asks for is a byte count.
 *
 * Run it after `npm run build`:
 *
 *   node .scratch/language-blocks/measure-05.mjs
 */

import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { repeatsInStore } from '../../web/src/lib/view.mjs';
import { siblingOf } from '../../web/src/lib/language-blocks.mjs';
import { storesInLog } from '../../web/src/lib/reports.mjs';

const EMITTED = new URL('../../dist/search-index/', import.meta.url);

const stores = await storesInLog();

/** @type {Map<string, { index: any, gzip: number, raw: number }>} */
const byStore = new Map();
for (const store of stores) {
  const bytes = await readFile(new URL(`${store}.json`, EMITTED));
  byStore.set(store, {
    index: JSON.parse(bytes.toString('utf8')),
    raw: bytes.length,
    gzip: gzipSync(bytes).length,
  });
}

/** The index's entries as `repeatsInStore()` takes them: one entry per page, per store. */
const pagesOf = (store) => {
  /** @type {Map<string, any[]>} */
  const byPage = new Map();
  for (const entry of byStore.get(store).index.findings) {
    const held = byPage.get(entry.page);
    if (held) held.push(entry);
    else byPage.set(entry.page, [entry]);
  }
  return [...byPage].map(([page, findings]) => ({ store, page, findings }));
};

const pad = (value, width) => String(value).padStart(width);
const thousands = (n) => n.toLocaleString('en-GB');

console.log('\n1. The size of the hole — over the emitted indexes, per dashboard.\n');
console.log('store    entries  rows before  rows after  spanning  span share  sibling findings');

let reachedTotal = 0;
for (const store of stores) {
  const sibling = siblingOf(store);
  const mine = pagesOf(store);

  const before = repeatsInStore(mine).length;
  const after = repeatsInStore([...mine, ...(sibling ? pagesOf(sibling) : [])]);
  const spanning = after.filter((repeat) => repeat.stores.length > 1);

  // The numerator this gate is about: of the findings in a spanning row, the ones that are
  // the **sibling's**. Those are the pages a searched row on this dashboard does not hold
  // today and would hold after this ticket. This store's own findings in the row were
  // always here, so they are not the hole.
  const reached = spanning.reduce(
    (sum, repeat) => sum + repeat.on.filter((entry) => entry.store !== store).length,
    0,
  );
  reachedTotal += reached;

  console.log(
    [
      store.padEnd(9),
      pad(thousands(byStore.get(store).index.findings.length), 7),
      pad(before, 13),
      pad(after.length, 12),
      pad(spanning.length, 10),
      pad(`${((100 * spanning.length) / after.length).toFixed(1)}%`, 12),
      pad(thousands(reached), 18),
    ].join(''),
  );
}

console.log('');
console.log(`sibling findings a searched row would gain, over the six: ${thousands(reachedTotal)}`);
console.log('');
console.log('`span share` is the number to read against "what a search reaches": a term reaches');
console.log('a subset of the rows, and this is the share of them that gains a sibling page. It');
console.log('is not weighted by how likely a row is to be searched, because nothing here knows');
console.log('that — it is the share of the rows, and a term reaching one row hits it or misses');
console.log('it at about that rate.');

console.log('\n2. What it costs — the second fetch, priced as ADR 0018 priced the second read.\n');
console.log('store      raw bytes     gzip bytes    the sibling fetched');
for (const store of stores) {
  const sibling = siblingOf(store);
  const one = byStore.get(store);
  console.log(
    [
      store.padEnd(9),
      pad(thousands(one.raw), 12),
      pad(thousands(one.gzip), 15),
      '    ' +
        (sibling
          ? `${sibling} — ${(one.gzip / 1024).toFixed(0)} kB → ${((one.gzip + byStore.get(sibling).gzip) / 1024).toFixed(0)} kB`
          : 'none — unchanged'),
    ].join(''),
  );
}
console.log('');
