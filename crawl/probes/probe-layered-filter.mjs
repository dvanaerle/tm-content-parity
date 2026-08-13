/**
 * THROWAWAY probe, kept as evidence. Ticket: `#layered-filter-block`.
 *
 * The same four questions the ADR asks of a new entry in
 * `shared/excluded-regions.mjs`, for the product filter block that Akeneo drives
 * on the new site:
 *
 * 1. Does the selector match on both hosts, on every category page?
 * 2. How many content units does it remove on each side?
 * 3. Does it match nothing on a home page, a CMS page or a product page?
 * 4. Do findings go away, and do none appear?
 *
 *   node crawl/probes/probe-layered-filter.mjs
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { ABSOLUTE_MAX_UNITS } from '../../shared/excluded-regions.mjs';
import { comparePage } from '../../compare/30-compare.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-layered-filter.json', import.meta.url);

/**
 * `#layered-filter-block` is the id the ticket named, and it is production's
 * alone: the new site builds the same block from a template, so its id attribute
 * is the unevaluated binding `isSidebar ? 'layered-filter-block' : ''` and the
 * selector matches nothing there. Its wrapper is `.block-filter`.
 *
 * Cutting only production's side leaves the new site's filter labels in the
 * extract, and they turn into `text-added` rows that nobody can fix — measured on
 * `overkapping` nl: 22 findings appear. So the probe measures the inner block,
 * `.filter-content`, which both hosts name the same and which holds the labels on
 * both. Pass a selector on the command line to measure another candidate.
 */
const SELECTOR = process.argv[2] ?? '.filter-content';

/** The same three category pages the product grid was measured on, and four controls. */
const CATEGORY = ['overkapping', 'carport', 'veranda'];
const CONTROL = ['(home)', 'downloads', 'showroom-contact', 'betaalmethoden'];

/** Six stores, because a filter block is translated and the entry must hold in all. */
const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

const cellsFor = (page) => {
  const row = seeds.rows.find((r) => r.page === page);
  if (!row) throw new Error(`No seed row for ${page}.`);
  return STORES
    .map((store) => ({ store, page, cell: row.stores?.[store] }))
    .filter(({ cell }) => cell?.prodUrl && cell?.newUrl)
    .map(({ store, page: p, cell }) => ({ store, page: p, prodUrl: cell.prodUrl, newUrl: cell.newUrl }));
};

const jobs = [...CATEGORY, ...CONTROL].flatMap(cellsFor);

/** Capped at the ceiling so the probe measures a candidate instead of throwing on it. */
const ENTRY = [{
  selector: SELECTOR,
  kind: 'non-editorial',
  reason: 'The entry under test. The committed reason is in shared/excluded-regions.mjs.',
  measured: { pages: CATEGORY, production: 0, new: 0 },
  maxUnits: ABSOLUTE_MAX_UNITS,
}];

/** @param {string} store @param {string} page @param {string} side @param {string} url */
async function measure(store, page, side, url) {
  const response = await fetchPage(url);
  const context = { store, page, side, url, status: response.status, onWarn: () => {} };

  const kept = extractPage(response.html, { ...context, excludedRegions: [] });
  const cut = extractPage(response.html, { ...context, excludedRegions: ENTRY });
  const region = cut.diagnostics.regionsExcluded[0];

  return {
    kept,
    cut,
    numbers: {
      status: response.status,
      pageType: kept.pageType,
      unitsBefore: kept.elements.length,
      unitsAfter: cut.elements.length,
      matches: region?.matches ?? 0,
      unitsRemoved: region?.units ?? 0,
      linksRemoved: kept.links.length - cut.links.length,
      imagesRemoved: kept.images.length - cut.images.length,
    },
  };
}

/** Question 4: a row that leaves is the point, a row that appears would be harm. */
function findingsBeforeAndAfter(production, next) {
  const run = (a, b) => comparePage({
    sides: { production: a, new: b },
    newSitePaths: new Set(),
    statuses: new Map(),
  });

  const before = run(production.kept, next.kept);
  const after = run(production.cut, next.cut);
  const key = (f) => `${f.class}|${f.new ?? ''}|${f.production ?? ''}`;
  const seenBefore = new Set(before.findings.map(key));

  // A row that leaves is the point. A row that appears is a label outside the
  // block that used to pair with one inside it, so it over-reports rather than
  // hides — the failure direction the ADR asks for.
  const appeared = after.findings.filter((f) => !seenBefore.has(key(f)));

  return {
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    workBefore: before.summary.work,
    workAfter: after.summary.work,
    appeared: appeared.map((f) => `${f.class}: ${String(f.new ?? f.production).slice(0, 60)}`),
  };
}

const rows = [];
for (const job of jobs) {
  let production;
  let next;
  try {
    [production, next] = await Promise.all([
      measure(job.store, job.page, 'production', job.prodUrl),
      measure(job.store, job.page, 'new', job.newUrl),
    ]);
  } catch (error) {
    console.log(`${job.page} ${job.store}: FAILED ${error.message}`);
    rows.push({ page: job.page, store: job.store, error: String(error.message) });
    continue;
  }

  const isCategory = CATEGORY.includes(job.page);
  const findings = isCategory ? findingsBeforeAndAfter(production, next) : null;
  rows.push({ page: job.page, store: job.store, production: production.numbers, new: next.numbers, findings });

  const line = (side, m) =>
    `${side.padEnd(10)} ${String(m.status).padEnd(4)} ${(m.pageType ?? '-').padEnd(9)} `
    + `matches=${m.matches} units ${m.unitsBefore}→${m.unitsAfter} `
    + `(-${m.unitsRemoved}) links -${m.linksRemoved} images -${m.imagesRemoved}`;
  console.log(`${job.page} [${job.store}]`);
  console.log(`  ${line('production', production.numbers)}`);
  console.log(`  ${line('new', next.numbers)}`);
  if (findings) {
    console.log(
      `  findings ${findings.findingsBefore}→${findings.findingsAfter}, `
      + `work ${findings.workBefore}→${findings.workAfter}, `
      + `${findings.appeared.length} appeared`
    );
  }
}

await writeFile(OUT, JSON.stringify({ selector: SELECTOR, at: new Date().toISOString(), rows }, null, 2));
console.log(`\nwrote ${OUT.pathname}`);
