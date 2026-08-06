/**
 * Extraction of one store page, both sides. This is the unit the re-check
 * service calls (ticket 10) and the unit a full run repeats.
 *
 *   node crawl/20-extract.mjs <store> <page> [prodUrl newUrl]
 *
 * Without the two urls it reads `data/10-store-seeds.json`.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPage } from './extract.mjs';
import { fetchPage } from './fetch-page.mjs';

const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);

/**
 * @param {object} job
 * @param {import('../compare/contract.mjs').Store} job.store
 * @param {string} job.page
 * @param {string} job.prodUrl
 * @param {string} job.newUrl
 * @returns {Promise<{ production: import('../compare/contract.mjs').PageExtract, new: import('../compare/contract.mjs').PageExtract }>}
 */
export async function extractStorePage({ store, page, prodUrl, newUrl }) {
  const hosts = { prodHost: new URL(prodUrl).host, newHost: new URL(newUrl).host };
  const [production, next] = await Promise.all([
    fetchPage(prodUrl),
    fetchPage(newUrl),
  ]);
  return {
    production: extractPage(production.html, {
      store, page, side: 'production', url: prodUrl, status: production.status, ...hosts,
    }),
    new: extractPage(next.html, {
      store, page, side: 'new', url: newUrl, status: next.status, ...hosts,
    }),
  };
}

/**
 * @param {string} store
 * @param {string} page
 */
async function urlsFromSeeds(store, page) {
  const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
  const row = seeds.rows.find((candidate) => candidate.page === page);
  const cell = row?.stores?.[store];
  if (!cell) throw new Error(`No seed row for ${store}/${page}.`);
  return { prodUrl: cell.prodUrl, newUrl: cell.newUrl };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('20-extract.mjs')) {
  const [store, page, prodArg, newArg] = process.argv.slice(2);
  if (!store || !page) {
    console.error('usage: node crawl/20-extract.mjs <store> <page> [prodUrl newUrl]');
    process.exit(2);
  }
  const urls = prodArg && newArg
    ? { prodUrl: prodArg, newUrl: newArg }
    : await urlsFromSeeds(store, page);

  const sides = await extractStorePage({ store, page, ...urls });
  const out = new URL(`../data/extract/${store}/${page}.json`, import.meta.url);
  await mkdir(dirname(fileURLToPath(out)), { recursive: true });
  await writeFile(out, JSON.stringify(sides, null, 2));

  for (const side of ['production', 'new']) {
    const extract = sides[side];
    console.log(
      `${side.padEnd(10)} ${extract.status} boundary=${extract.boundary} `
      + `elements=${extract.elements.length} links=${extract.links.length} `
      + `images=${extract.images.length} (${extract.diagnostics.imagesWithoutSrc} without src)`
    );
  }
  console.log(`wrote ${fileURLToPath(out)}`);
}
