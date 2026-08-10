// Ticket 04 - build the seed list of pages to compare, for all six store views.
//
// The production sitemap is one flat file that holds all six stores. Product
// detail pages carry changefreq=never, content pages carry daily, so the same
// filter that made the NL baseline works per store.
//
// A page is one row across the six stores. Stores do not share url keys: de, fr,
// uk and be_fr translate the category keys. hreflang is the only thing that links
// them, so the cluster key is the NL url key from the nl-NL alternate.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { MaintenanceError, maintenanceReason } from './fetch-page.mjs';

// Both inputs are generated data, and git does not track `data/`. A fresh clone
// has neither. Name the file and say what it holds, so the reader learns what to
// put in place instead of reading a raw ENOENT.
const readInput = (name, holds) => {
  const file = new URL(`../data/${name}`, import.meta.url);
  if (!existsSync(file)) {
    console.error(`Missing input: data/${name}`);
    console.error(`  It holds ${holds}.`);
    console.error('  `data/` is generated and git does not track it. Put the file');
    console.error('  in place, then run this script again.');
    process.exit(2);
  }
  return readFileSync(file, 'utf8');
};

const PROD_HOST = {
  'www.tuinmaximaal.nl': 'nl',
  'www.tuinmaximaal.be': 'be',
  'www.tuinmaximaal.de': 'de',
  'www.tuinmaximaal.fr': 'fr',
  'www.tuinmaximaal.co.uk': 'uk',
};
const NEW_HOST = {
  nl: 'valanticnl.intern.systems',
  be: 'valanticbe.intern.systems',
  be_fr: 'valanticbe.intern.systems',
  de: 'valanticde.intern.systems',
  fr: 'valanticfr.intern.systems',
  uk: 'valanticuk.intern.systems',
};
const HREFLANG_STORE = {
  'nl-NL': 'nl',
  'nl-BE': 'be',
  'fr-BE': 'be_fr',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'en-GB': 'uk',
};
const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

// be_fr lives under /fr/ on both sides, so the prefix is part of the path.
const newUrl = (store, path) => `https://${NEW_HOST[store]}/${path}`;

const XML = readInput('sitemap-prod.xml', 'the production sitemap for all six stores');

const excluded = { pdp: 0, unknownHost: 0 };
const entries = [];

for (const block of XML.split('<url>').slice(1)) {
  const loc = block.match(/<loc>([^<]*)<\/loc>/)?.[1];
  if (!loc) continue;

  const url = new URL(loc);
  const host = PROD_HOST[url.host];
  if (!host) {
    excluded.unknownHost++;
    continue;
  }

  // changefreq=daily is the content-page marker; never is a product detail page.
  // It also drops blog posts and gallery photos, as the baseline does.
  if ((block.match(/<changefreq>([^<]*)<\/changefreq>/)?.[1] ?? '') !== 'daily') {
    excluded.pdp++;
    continue;
  }

  let store = host;
  let path = url.pathname.replace(/^\//, '');
  if (store === 'be' && path.startsWith('fr/')) store = 'be_fr';

  const alternates = {};
  for (const [, lang, href] of block.matchAll(/hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) {
    const alt = HREFLANG_STORE[lang];
    if (alt) alternates[alt] = href;
  }

  entries.push({ store, path, prodUrl: loc, alternates });
}

// The nl-NL alternate is the cluster key. A page without one cannot be linked to
// any other store, so it stands alone under its own store-scoped key.
const NL_PREFIX = 'https://www.tuinmaximaal.nl/';
const pages = new Map();

const emptyRow = (key) => ({
  page: key,
  stores: Object.fromEntries(STORES.map((s) => [s, null])),
});

for (const entry of entries) {
  // An NL page is its own key, whether or not it declares hreflang. Six NL pages
  // declare none, and they are still NL pages.
  const nlAlternate = entry.store === 'nl' ? entry.prodUrl : entry.alternates.nl;
  const key = nlAlternate?.startsWith(NL_PREFIX)
    ? nlAlternate.slice(NL_PREFIX.length) || '(home)'
    : `${entry.store}:${entry.path}`;

  const row = pages.get(key) ?? pages.set(key, emptyRow(key)).get(key);
  row.stores[entry.store] = {
    path: entry.path,
    prodUrl: entry.prodUrl,
    newUrl: newUrl(entry.store, entry.path),
    source: 'prod-sitemap',
  };
}

// The NL baseline found 48 pages by crawling the new site that the production
// sitemap does not list. They are real NL pages, so they belong in the list.
// No such discovery exists for the other five stores - the new site serves no
// sitemap, so those columns stay short until a crawler finds them.
const baseline = JSON.parse(
  readInput('03-merged.json', 'the NL baseline crawl, including the 48 pages no sitemap declares')
).rows;

let addedFromBaseline = 0;
for (const legacy of baseline) {
  if (legacy.in_sitemap) continue;
  const key = legacy.url_key || '(home)';
  const row = pages.get(key) ?? pages.set(key, emptyRow(key)).get(key);
  if (row.stores.nl) continue;
  row.stores.nl = {
    path: legacy.url_key,
    prodUrl: legacy.full_url,
    newUrl: newUrl('nl', legacy.url_key),
    source: 'new-site-crawl',
  };
  addedFromBaseline++;
}

// No store's home page is in the sitemap - the NL one came from the crawl - so
// seed all six by hand. be_fr lives under /fr/.
{
  const home = pages.get('(home)') ?? pages.set('(home)', emptyRow('(home)')).get('(home)');
  const PROD_ORIGIN = {
    nl: 'https://www.tuinmaximaal.nl/',
    be: 'https://www.tuinmaximaal.be/',
    be_fr: 'https://www.tuinmaximaal.be/fr/',
    de: 'https://www.tuinmaximaal.de/',
    fr: 'https://www.tuinmaximaal.fr/',
    uk: 'https://www.tuinmaximaal.co.uk/',
  };
  for (const store of STORES) {
    if (home.stores[store]) continue;
    const path = store === 'be_fr' ? 'fr/' : '';
    home.stores[store] = {
      path,
      prodUrl: PROD_ORIGIN[store],
      newUrl: newUrl(store, path),
      source: 'store-home',
    };
  }
}

// Check both sides, so the list states what answers rather than what should.
const targets = [];
for (const row of pages.values()) {
  for (const store of STORES) {
    const cell = row.stores[store];
    if (!cell) continue;
    targets.push([cell, 'prod', cell.prodUrl], [cell, 'new', cell.newUrl]);
  }
}

// A Magento install in maintenance mode answers the same on every url, and it
// answers differently depending on how far the bootstrap got: a 500 with an
// exception before the maintenance page is in place, a 503 after. This script
// used to record that as a flag and carry on, which is how 451 phantom status
// values reached the seed file. `maintenanceReason` is the one rule (ticket 04),
// and it aborts. The redirect stays manual here, because the seed list records
// where a url sends the reader.
const status = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (content-parity-seeds; internal)' },
        redirect: 'manual',
      });
      // 500 and 503 need no body: `maintenanceReason` names them on the status
      // alone. The body is read for the other 5xx, and cancelled below 500.
      const body = response.status >= 500 ? await response.text() : (await response.body?.cancel(), '');
      const reason = response.status >= 500 ? maintenanceReason(response.status, body) : null;
      if (reason) throw new MaintenanceError(url, reason);
      return {
        code: response.status,
        location: response.headers.get('location') ?? '',
      };
    } catch (error) {
      if (error instanceof MaintenanceError) throw error;
      if (attempt === 2) return { code: 0, location: String(error.cause?.code ?? error.message) };
    }
  }
};

let done = 0;
const queue = targets.slice();
const workers = Array.from({ length: 8 }, async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const [cell, side, url] = job;
    let result;
    try {
      result = await status(url);
    } catch (error) {
      // Maintenance mode is site-wide. Do not ask nine hundred more times.
      queue.length = 0;
      throw error;
    }
    cell[`${side}Status`] = result.code;
    if (result.location) cell[`${side}Redirect`] = result.location;
    if (++done % 100 === 0) console.log(`  checked ${done}/${targets.length}`);
  }
});

const settled = await Promise.allSettled(workers);
const failure = settled.find((r) => r.status === 'rejected')?.reason;
if (failure instanceof MaintenanceError) {
  console.error(`\n${failure.message}`);
  console.error('The status columns would be phantom, so nothing was written.');
  console.error('Run this again when the site is up.');
  process.exit(3);
}
if (failure) throw failure;

const rows = [...pages.values()].sort((a, b) => a.page.localeCompare(b.page));

const counts = {};
for (const store of STORES) {
  const cells = rows.map((r) => r.stores[store]).filter(Boolean);
  counts[store] = {
    pages: cells.length,
    prodOk: cells.filter((c) => c.prodStatus === 200).length,
    newOk: cells.filter((c) => c.newStatus === 200).length,
    newMissing: cells.filter((c) => c.newStatus === 404).length,
    newRedirect: cells.filter((c) => c.newStatus >= 300 && c.newStatus < 400).length,
  };
}

writeFileSync(
  new URL('../data/10-store-seeds.json', import.meta.url),
  JSON.stringify(
    { generated: new Date().toISOString().slice(0, 10), counts, excluded, addedFromBaseline, rows },
    null,
    2
  )
);

// A readable companion to the JSON. One row per page, one column per store, so
// the coverage gaps that Axis B has to explain are visible at a glance.
const cellMark = (cell) => {
  if (!cell) return '·';
  if (cell.newStatus === 200) return '✓';
  if (cell.newStatus === 404) return '404';
  if (cell.newStatus >= 300 && cell.newStatus < 400) return '→';
  return String(cell.newStatus);
};

const markdown = [
  '# Seed lists for all six store views',
  '',
  `Generated ${new Date().toISOString().slice(0, 10)} by \`crawl/10-store-seeds.mjs\`.`,
  'A page is one row across the six stores, keyed on its NL url key. The mark is',
  'the status of the **new** site: `✓` 200, `404` missing, `→` redirect, `·` the',
  'store does not have this page at all.',
  '',
  '| Page | ' + STORES.join(' | ') + ' |',
  '| --- | ' + STORES.map(() => '---').join(' | ') + ' |',
  ...rows.map(
    (row) => `| ${row.page} | ` + STORES.map((s) => cellMark(row.stores[s])).join(' | ') + ' |'
  ),
  '',
  '## Counts',
  '',
  '| Store | Pages | New 200 | New 404 | New redirect |',
  '| --- | --- | --- | --- | --- |',
  ...STORES.map(
    (s) =>
      `| ${s} | ${counts[s].pages} | ${counts[s].newOk} | ${counts[s].newMissing} | ${counts[s].newRedirect} |`
  ),
  '',
].join('\n');

writeFileSync(new URL('../data/10-store-seeds.md', import.meta.url), markdown);

console.log('\npages total', rows.length);
console.table(counts);
console.log('excluded', excluded, '| added from the new-site crawl', addedFromBaseline);
