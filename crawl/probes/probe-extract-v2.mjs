// THROWAWAY probe for ticket 07 - does extractor v2 hold on the whole nl store?
// Both sides, plain fetch, concurrency 8. Records every throw, so a page that
// the extractor cannot read is visible instead of silent.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const CONCURRENCY = 8;
const seeds = JSON.parse(readFileSync(new URL('../../data/10-store-seeds.json', import.meta.url), 'utf8'));

const jobs = seeds.rows
  .filter((row) => row.stores?.nl)
  .map((row) => ({ page: row.page, ...row.stores.nl }));

const results = [];
const queue = jobs.slice();
let done = 0;

await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const record = { page: job.page };
    const hosts = { prodHost: new URL(job.prodUrl).host, newHost: new URL(job.newUrl).host };

    for (const [side, url] of [['production', job.prodUrl], ['new', job.newUrl]]) {
      try {
        const response = await fetchPage(url);
        const warnings = [];
        const extract = extractPage(response.html, {
          store: 'nl', page: job.page, side, url, status: response.status, ...hosts,
          onWarn: (message) => warnings.push(message),
        });
        record[side] = {
          status: extract.status,
          boundary: extract.boundary,
          pageType: extract.pageType,
          elements: extract.elements.length,
          headings: extract.elements.filter((element) => element.kind === 'heading').length,
          ctas: extract.elements.filter((element) => element.kind === 'cta').length,
          links: extract.links.length,
          linkKeys: new Set(extract.links.map((link) => link.key)).size,
          images: extract.images.length,
          imagesWithoutSrc: extract.diagnostics.imagesWithoutSrc,
          altMissing: extract.images.filter((image) => image.alt === null).length,
          markdownBytes: extract.markdown.length,
          hasTitle: Boolean(extract.meta.title),
          warnings,
        };
      } catch (error) {
        record[side] = { error: `${error.name}: ${error.message}`.slice(0, 160) };
      }
    }
    results.push(record);
    if (++done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
  }
}));

const out = new URL('../../data/probe-extract-v2.json', import.meta.url);
mkdirSync(new URL('../../data/', import.meta.url), { recursive: true });
writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));

for (const side of ['production', 'new']) {
  const ok = results.filter((row) => row[side]?.boundary);
  const errors = results.filter((row) => row[side]?.error);
  const sum = (field) => ok.reduce((total, row) => total + row[side][field], 0);
  console.log(`\n${side}: ${ok.length} extracted, ${errors.length} failed`);
  console.log(`  boundary main ${ok.filter((row) => row[side].boundary === 'main').length}, `
    + `body ${ok.filter((row) => row[side].boundary === 'body').length}`);
  console.log(`  elements ${sum('elements')}, links ${sum('links')}, images ${sum('images')}, `
    + `no src ${sum('imagesWithoutSrc')}, alt absent ${sum('altMissing')}`);
  console.log(`  pages with no title: ${ok.filter((row) => !row[side].hasTitle).length}`);
  const kinds = {};
  for (const row of errors) {
    const kind = row[side].error.split(':')[0];
    kinds[kind] = (kinds[kind] ?? 0) + 1;
  }
  console.log(`  failures: ${JSON.stringify(kinds)}`);
}
