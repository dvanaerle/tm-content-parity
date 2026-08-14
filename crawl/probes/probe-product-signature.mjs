/**
 * THROWAWAY probe, kept as evidence. Ticket 53.
 *
 * Ticket 50 says a product page is held out of the seed list by "a digit, five
 * or more hyphens and a colour word in the last path part". That sentence cannot
 * be tested against anything, because no repository holds a list of which
 * candidate is a product and which is a content page.
 *
 * This probe makes that list. Production says it plainly: a Magento product page
 * carries `catalog-product-view` on the `<body>`, and a CMS page carries
 * `cms-page-view`. So each of the 876 candidates in `data/sitemap-extract.json`
 * is fetched once and its body class is recorded.
 *
 *   node crawl/probes/probe-product-signature.mjs
 *
 * The seed generator makes no live request (ticket 53). This is the measurement
 * the generator's lexical rule is derived from and tested against, and it runs
 * once. Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';

import { MaintenanceError, fetchPage } from '../fetch-page.mjs';

const EXTRACT = new URL('../../data/sitemap-extract.json', import.meta.url);
const OUT = new URL('../../data/probe-product-signature.json', import.meta.url);

const extract = JSON.parse(await readFile(EXTRACT, 'utf8'));
const locs = extract.entries.map((entry) => entry.loc);

/** The two Magento view classes that answer the question. */
const kindOf = (html) => {
  const classes = html.match(/<body[^>]*\sclass="([^"]*)"/)?.[1] ?? '';
  if (classes.includes('catalog-product-view')) return 'product';
  if (classes.includes('cms-page-view')) return 'cms';
  if (classes.includes('catalog-category-view')) return 'category';
  return `other: ${classes.split(/\s+/).slice(0, 3).join(' ')}`;
};

const results = [];
const queue = locs.slice();
let done = 0;

const workers = Array.from({ length: 8 }, async () => {
  for (let loc = queue.shift(); loc; loc = queue.shift()) {
    try {
      const { status, html } = await fetchPage(loc);
      results.push({ loc, status, kind: status === 200 ? kindOf(html) : `status ${status}` });
    } catch (error) {
      // Maintenance mode is site-wide, so every later answer is the same page.
      if (error instanceof MaintenanceError) {
        queue.length = 0;
        throw error;
      }
      results.push({ loc, status: 0, kind: `error: ${error.message}` });
    }
    if (++done % 100 === 0) console.log(`  ${done}/${locs.length}`);
  }
});

const settled = await Promise.allSettled(workers);
const failure = settled.find((r) => r.status === 'rejected')?.reason;
if (failure) {
  console.error(String(failure.message));
  console.error('Nothing was written. Run this again when production is up.');
  process.exit(3);
}

results.sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));

const byKind = {};
for (const row of results) byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;

await writeFile(
  OUT,
  `${JSON.stringify({ fetchedAt: new Date().toISOString().slice(0, 10), byKind, results }, null, 2)}\n`,
);

console.log(`\n${results.length} candidates`);
console.table(byKind);
