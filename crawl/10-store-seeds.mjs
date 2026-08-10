// Ticket 53 - build the seed list of content pages for all six store views.
//
// It reads the committed sitemap extract (ticket 52) and the committed seed list
// beside it, and it writes a page list and nothing else. It makes no live
// request: ticket 38 ruled the status half of the old file stale, and every
// `prodOk` in it was zero. `crawl/11-page-status.mjs` is the status pass, and it
// is a second step over this finished list.
//
// The rule is `crawl/seed-list.mjs`, which is pure and which the tests read.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import {
  STORES,
  buildSeedList,
  countByStore,
  countDisagreements,
  schemaDisagreements,
} from './seed-list.mjs';

const readInput = (name, holds) => {
  const file = new URL(`../data/${name}`, import.meta.url);
  if (!existsSync(file)) {
    console.error(`Missing input: data/${name}`);
    console.error(`  It holds ${holds}.`);
    console.error('  Both inputs are tracked by git. Restore the file, then run');
    console.error('  this script again.');
    process.exit(2);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
};

const extract = readInput(
  'sitemap-extract.json',
  'the reduced production sitemaps, made by crawl/09-sitemaps.mjs'
);
// The 49 store pages that no sitemap declares live here and nowhere else. The
// generator that first found them read `data/03-merged.json`, which does not
// exist, so they cannot be made again.
const previous = readInput(
  '10-store-seeds.json',
  'the previous seed list, which carries the 49 pages no sitemap declares'
);

const { rows, dropped, collisions, carried } = buildSeedList({
  entries: extract.entries,
  carriedRows: previous.rows,
});

const counts = countByStore(rows);

// A silent short list is the defect this ticket fixes, so the run stops before
// it writes and prints the histogram it stopped on.
const wrong = [...countDisagreements(counts)];
if (wrong.length) {
  console.error('\nThe page counts are not the ones that were measured:');
  for (const said of wrong) console.error(`  ${said}`);
  console.table(counts);
  console.error('Nothing was written.');
  process.exit(1);
}

const seeds = {
  generated: new Date().toISOString().slice(0, 10),
  inputs: {
    sitemapExtract: 'data/sitemap-extract.json',
    // The origin of the 49, and not the run that last copied them. The
    // generator reads its own output, so a date taken from it would move at
    // every run and say the pages came from where they were last written.
    carriedFrom: previous.inputs?.carriedFrom ?? `data/10-store-seeds.json of ${previous.generated}`,
  },
  counts,
  candidates: extract.entries.length,
  // Ticket 56: the list, and not the count it used to be. The dashboard shows
  // every page the log found and does not compare, and it can only name a
  // reason that something upstream wrote down. The file is tracked by git, so
  // a wrong exclusion is reversed by editing this list: add the row back and
  // the next run carries it over, because the generator reads its own output.
  dropped,
  carried,
  rows,
};

const wrongShape = schemaDisagreements(seeds);
if (wrongShape.length) {
  console.error('\nThe seed list does not keep its own schema:');
  for (const said of wrongShape.slice(0, 20)) console.error(`  ${said}`);
  console.error('Nothing was written.');
  process.exit(1);
}

writeFileSync(
  new URL('../data/10-store-seeds.json', import.meta.url),
  `${JSON.stringify(seeds, null, 2)}\n`
);

// A readable companion to the JSON. One row for each page, one column for each
// store, so the coverage gaps that axis B has to explain are visible at a
// glance. The mark is the provenance, because the list holds no status.
const MARK = {
  'sitemap-daily': 'd',
  'sitemap-low-alternates': 'a',
  'carried-over': 'c',
};

const markdown = [
  '# Seed lists for all six store views',
  '',
  `Generated ${seeds.generated} by \`crawl/10-store-seeds.mjs\`.`,
  'A page is one row across the six stores. A page that production declares in',
  'Dutch is keyed on its NL url key; a page with no `nl-NL` alternate is keyed on',
  'its store and its path. The mark says where the cell came from: `d` a sitemap',
  'marks it daily, `a` it carries fewer than six hreflang alternates, `c` it is',
  'carried from the seed list of 2026-08-06 and no sitemap declares it, `·` the',
  'store does not have this page.',
  '',
  `| Page | ${STORES.join(' | ')} |`,
  `| --- | ${STORES.map(() => '---').join(' | ')} |`,
  ...rows.map(
    (row) =>
      `| ${row.page} | ` +
      STORES.map((store) => (row.stores[store] ? MARK[row.stores[store].provenance] : '·')).join(' | ') +
      ' |'
  ),
  '',
  '## Counts',
  '',
  '| Store | Pages | daily | few alternates | carried |',
  '| --- | --- | --- | --- | --- |',
  ...STORES.map((store) => {
    const c = counts[store];
    return `| ${store} | ${c.pages} | ${c['sitemap-daily'] ?? 0} | ${c['sitemap-low-alternates'] ?? 0} | ${c['carried-over'] ?? 0} |`;
  }),
  '',
  '## Every URL that left the list',
  '',
  `${dropped.length} of ${extract.entries.length} candidates.`,
  '',
  '| URL | Store | Rule |',
  '| --- | --- | --- |',
  ...dropped.map((entry) => `| ${entry.loc} | ${entry.store ?? '·'} | ${entry.rule} |`),
  '',
  'The words of each rule are in `shared/drop-rules.mjs`, and the dashboard',
  'shows them beside the page.',
  '',
].join('\n');

writeFileSync(new URL('../data/10-store-seeds.md', import.meta.url), markdown);

console.log(`\npages total ${rows.length} rows, ${extract.entries.length} candidates`);
console.table(counts);
console.log(`dropped ${dropped.length}, carried over ${carried}`);
for (const entry of dropped) console.log(`  drop ${entry.loc} (${entry.rule})`);
if (collisions.length) {
  console.log(`\n${collisions.length} pages hold two locs of one store:`);
  for (const clash of collisions) {
    console.log(`  ${clash.store} ${clash.page}: kept ${clash.kept}, dropped ${clash.dropped}`);
  }
}
