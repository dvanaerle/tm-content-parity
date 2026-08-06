// Ticket 04 - build the seed list of pages to compare, for all six store views.
//
// The production sitemap is one flat file that holds all six stores. Product
// detail pages carry changefreq=never, content pages carry daily, so the same
// filter that made the NL baseline works per store.
//
// A page is one row across the six stores. Stores do not share url keys: de, fr,
// uk and be_fr translate the category keys. hreflang is the only thing that links
// them, so the cluster key is the NL url key from the nl-NL alternate.
import { readFileSync, writeFileSync } from 'node:fs';

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

const XML = readFileSync(new URL('../_data/sitemap-prod.xml', import.meta.url), 'utf8');

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
  readFileSync(new URL('../_data/03-merged.json', import.meta.url), 'utf8')
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
// exception before the maintenance page is in place, a 503 after. Either one
// looks like a broken page, so name it instead of recording a bare 5xx.
const MAINTENANCE = /the maintenance mode is enabled|Error 503: Service Unavailable/i;

const status = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (content-parity-seeds; internal)' },
        redirect: 'manual',
      });
      const body = response.status >= 500 ? await response.text() : (await response.body?.cancel(), '');
      return {
        code: response.status,
        location: response.headers.get('location') ?? '',
        maintenance: MAINTENANCE.test(body),
      };
    } catch (error) {
      if (attempt === 2) return { code: 0, location: String(error.cause?.code ?? error.message) };
    }
  }
};

let done = 0;
const queue = targets.slice();
const workers = Array.from({ length: 8 }, async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const [cell, side, url] = job;
    const result = await status(url);
    cell[`${side}Status`] = result.code;
    if (result.location) cell[`${side}Redirect`] = result.location;
    if (result.maintenance) cell[`${side}Maintenance`] = true;
    if (++done % 100 === 0) console.log(`  checked ${done}/${targets.length}`);
  }
});
await Promise.all(workers);

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
    prodMaintenance: cells.filter((c) => c.prodMaintenance).length,
  };
}

const maintenance = Object.values(counts).reduce((sum, c) => sum + c.prodMaintenance, 0);
if (maintenance) {
  console.error(
    `\nWARNING: production answered "maintenance mode" on ${maintenance} urls. ` +
      'The prodStatus column is not a measurement. Re-run when production is up.'
  );
}

writeFileSync(
  new URL('../_data/10-store-seeds.json', import.meta.url),
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
  `Generated ${new Date().toISOString().slice(0, 10)} by \`_scripts/10-store-seeds.mjs\`.`,
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

writeFileSync(new URL('../store-seeds.md', import.meta.url), markdown);

console.log('\npages total', rows.length);
console.table(counts);
console.log('excluded', excluded, '| added from the new-site crawl', addedFromBaseline);
