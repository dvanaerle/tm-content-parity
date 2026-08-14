/**
 * What the search index costs and what a query on the largest store takes (ticket 82).
 *
 * `crawl/probes/` holds crawl measurements. This measures `web/`, so it lives here.
 * It is evidence and never an import.
 *
 * Ticket 82 adds no search dependency: one index per store, emitted at build time and
 * scanned linearly by `searchStore()`. This file is the measurement that says a linear
 * pass is fast enough, and it is what a later reader re-runs before adding a library.
 * `search.mjs`' module docblock points here for exactly that.
 *
 * It reads the **emitted** files under `dist/search-index/`, not a freshly built index. The
 * bytes an editor's browser downloads are the bytes the build wrote, so a size measured
 * off `JSON.stringify()` in this process would be measuring something else.
 *
 * **Worst case is the query that matches everything**, not the one that matches nothing.
 * Both scan all findings and both fold all six fields — `matchedFields()` filters over
 * the whole field list and never leaves early — so matching is a constant. Matching then
 * *adds* the grouping: every hit is pushed onto its page, `repeatsInStore()` keys and
 * sorts them all, and the field union runs per repeat. So the letter `e` is the ceiling
 * and a term that hits nothing is the floor, and both are measured to show the gap.
 *
 * Run it after `npm run build`:
 *
 *   node web/probes/probe-search-index.mjs
 *   node web/probes/probe-search-index.mjs nl
 */

import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { repeatsInStore } from '../src/lib/view.mjs';
import { searchStore } from '../src/lib/search.mjs';

const EMITTED = new URL('../../dist/search-index/', import.meta.url);

/** Kept runs per query. The median is the number to read and the worst is the tail. */
const RUNS = 20;

/** @param {number[]} numbers */
const median = (numbers) => {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const thousands = (/** @type {number} */ number) => number.toLocaleString('en-GB');
const kb = (/** @type {number} */ bytes) => `${(bytes / 1024).toFixed(1)} kB`;

/**
 * One query, timed end to end.
 *
 * `searchStore()` is timed whole — matching *and* grouping — because grouping is what an
 * editor waits for: a term on 6,000 findings is not answered until the repeats are keyed
 * and sorted. Timing `matchedFields()` alone would report the cheap half.
 *
 * The default `stateOf` answers `open` for every finding, which is the slow side of the
 * only branch in the loop: nothing is filtered out, so every hit reaches the grouping.
 *
 * @param {import('../src/lib/search.mjs').SearchIndex} index
 * @param {string} term
 */
function time(index, term) {
  // One run is thrown away, so the first term measured does not carry the cost of
  // warming the code that every later term then finds warm.
  searchStore({ index, term });

  /** @type {number[]} */
  const runs = [];
  let answer = { total: 0, pages: 0, repeats: [] };
  for (let run = 0; run < RUNS; run += 1) {
    const start = performance.now();
    answer = searchStore({ index, term });
    runs.push(performance.now() - start);
  }
  return { runs, answer };
}

const files = (await readdir(EMITTED)).filter((name) => name.endsWith('.json'));

/** @type {{ index: import('../src/lib/search.mjs').SearchIndex, raw: number, gzip: number, withoutLinkText: number }[]} */
const stores = [];

for (const file of files) {
  const bytes = await readFile(new URL(file, EMITTED));
  /** @type {import('../src/lib/search.mjs').SearchIndex} */
  const index = JSON.parse(bytes.toString('utf8'));

  // The same entries without `linkText`, which is the one field the dashboard's own
  // finding index does not already hold — decision 2 in `search.mjs`. It is the cheap
  // answer to what this ticket added over what was already crossing the wire.
  const withoutLinkText = JSON.stringify({
    ...index,
    findings: index.findings.map(({ linkText, ...rest }) => rest),
  });

  stores.push({
    index,
    raw: bytes.length,
    gzip: gzipSync(bytes).length,
    withoutLinkText: gzipSync(withoutLinkText).length,
  });
}

console.log(`\nEmitted indexes under dist/search-index/, gzip at zlib's default level.`);
console.log('\n  store     pages   findings      raw bytes     gzip bytes    gzip share');
for (const one of stores) {
  console.log(
    `  ${one.index.store.padEnd(8)}` +
      `${String(one.index.pages).padStart(5)}` +
      `${thousands(one.index.findings.length).padStart(11)}` +
      `${thousands(one.raw).padStart(15)}` +
      `${thousands(one.gzip).padStart(15)}` +
      `${`${((100 * one.gzip) / one.raw).toFixed(1)}%`.padStart(14)}`,
  );
}

const sum = (/** @type {(one: typeof stores[0]) => number} */ of) =>
  stores.reduce((total, one) => total + of(one), 0);
console.log(
  `  ${'total'.padEnd(8)}` +
    `${String(sum((one) => one.index.pages)).padStart(5)}` +
    `${thousands(sum((one) => one.index.findings.length)).padStart(11)}` +
    `${thousands(sum((one) => one.raw)).padStart(15)}` +
    `${thousands(sum((one) => one.gzip)).padStart(15)}` +
    `${`${((100 * sum((one) => one.gzip)) / sum((one) => one.raw)).toFixed(1)}%`.padStart(14)}`,
);

/**
 * The query table for one store.
 *
 * @param {typeof stores[0]} measured
 */
function queryTable(measured) {
  const index = measured.index;

  console.log(`\nAgainst the dashboard's existing payload, on ${index.store}`);
  console.log(`  index without linkText, gzipped   ${kb(measured.withoutLinkText)}`);
  console.log(`  index as emitted, gzipped         ${kb(measured.gzip)}`);
  console.log(
    `  linkText costs                    ${kb(measured.gzip - measured.withoutLinkText)}`,
  );
  console.log(
    `  loadSummaries()'s finding index    228 kB gzipped on nl, as reports.mjs records it`,
  );

  // The largest repeat's text is a query an editor really runs: they open the worst row
  // on the repeats page and search for its words. It is also the longest needle measured,
  // and a long needle is the case a substring scan rejects fastest.
  /** @type {Map<string, import('../src/lib/search.mjs').IndexEntry[]>} */
  const byPage = new Map();
  for (const entry of index.findings) {
    const held = byPage.get(entry.page);
    if (held) held.push(entry);
    else byPage.set(entry.page, [entry]);
  }
  const repeats = repeatsInStore(
    [...byPage].map(([page, findings]) => ({ store: index.store, page, findings })),
  );
  const worstRepeat = repeats[0];
  const repeatText = worstRepeat.prod ?? worstRepeat.new ?? '';

  // `Bekijk deals >` is the ticket's own example and it matches nothing in this snapshot,
  // so the largest repeat whose text is a real phrase is timed beside it: a multi-word
  // term that hits is the shape that pays for both the scan and the grouping.
  const phraseRepeat = repeats.find((one) => (one.prod ?? '').trim().includes(' '));
  const phrase = (phraseRepeat?.prod ?? '').trim();

  const queries = [
    ['e — matches nearly every entry', 'e'],
    ['zzzqx — matches nothing', 'zzzqx'],
    ["Bekijk deals > — the ticket's term, no hits here", 'Bekijk deals >'],
    [`a phrase that hits, on ${phraseRepeat?.on.length} pages`, phrase],
    [`the largest repeat, on ${worstRepeat.on.length} pages`, repeatText],
  ];

  console.log(
    `\nsearchStore() on ${index.store}: ${thousands(index.findings.length)} findings over ${index.pages} pages,`,
  );
  console.log(`built at ${index.builtAt}. ${RUNS} runs per query after one discarded warm-up,`);
  console.log(`matching and grouping both inside the measurement, on ${process.version}.`);
  console.log(
    '\n  query                                          best     median      worst      hits     pages   repeats',
  );
  for (const [name, term] of queries) {
    const { runs, answer } = time(index, term);
    console.log(
      `  ${name.slice(0, 42).padEnd(44)}` +
        `${`${Math.min(...runs).toFixed(2)} ms`.padStart(10)}` +
        `${`${median(runs).toFixed(2)} ms`.padStart(11)}` +
        `${`${Math.max(...runs).toFixed(2)} ms`.padStart(11)}` +
        `${thousands(answer.total).padStart(10)}` +
        `${thousands(answer.pages).padStart(10)}` +
        `${thousands(answer.repeats.length).padStart(10)}`,
    );
  }

  console.log(`\nThe two texts searched for, as they stand in the index:`);
  console.log(`  phrase          ${JSON.stringify(phrase)}`);
  console.log(`  largest repeat  ${JSON.stringify(repeatText)}`);
}

// Worst case is the largest store, and largest is counted in findings rather than in
// pages or in bytes: the scan is a loop over `findings`, so that is the number the query
// time is a function of. It is **be_fr** and not nl — the French stores carry more work
// findings than the Dutch one — so nl is timed beside it, because nl is the store the
// comment in `reports.mjs` measured its own payload on.
const asked = process.argv.slice(2);
const byFindings = [...stores].sort((a, b) => b.index.findings.length - a.index.findings.length);
const targets =
  asked.length > 0
    ? asked.map((store) => stores.find((one) => one.index.store === store)).filter(Boolean)
    : [...new Set([byFindings[0], stores.find((one) => one.index.store === 'nl')])].filter(Boolean);

for (const measured of targets) queryTable(measured);

console.log('\nThe median is the number to read. The worst column is a tail and not a ceiling:');
console.log('this runs on a shared machine and one GC pause over ~6,000 folded strings moves it');
console.log('by a hundred milliseconds, while the median holds across runs to a few ms.');
console.log();
