/**
 * THROWAWAY probe, kept as evidence. Ticket 63.
 *
 * It answers the four questions the ADR asks of a new entry in
 * `shared/excluded-regions.mjs`, for the product grid:
 *
 * 1. Does one selector match on both hosts, once, on every category page?
 * 2. How many content units does it remove on each side?
 * 3. Does it match nothing on a home page, a CMS page or a product page?
 * 4. Do the nine phantom `text-added` rows on `/overkapping` go away?
 *
 *   node crawl/probes/probe-excluded-regions.mjs
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { ABSOLUTE_MAX_UNITS } from '../../shared/excluded-regions.mjs';
import { comparePage } from '../../compare/30-compare.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-excluded-regions.json', import.meta.url);

const SELECTOR = '#amasty-shopby-product-list';

/** Three category pages, and four controls the selector must not touch. */
const CATEGORY = ['overkapping', 'carport', 'veranda'];
const CONTROL = ['(home)', 'downloads', 'showroom-contact', 'betaalmethoden'];

/** A product page is not in the seeds: the log holds content pages only. */
const PRODUCT = {
  page: '(a product page)',
  prodUrl:
    'https://www.tuinmaximaal.nl/moderne-terrasoverkapping-in-mat-antraciet-van-3-06-x-2-5-meter-met-opaal-polycarbonaat',
  newUrl:
    'https://m2stagingnl.intern.systems/moderne-terrasoverkapping-in-mat-antraciet-van-3-06-x-2-5-meter-met-opaal-polycarbonaat',
};

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
const cellFor = (page) => {
  const cell = seeds.rows.find((row) => row.page === page)?.stores?.nl;
  if (!cell) throw new Error(`No nl seed cell for ${page}.`);
  return { page, prodUrl: cell.prodUrl, newUrl: cell.newUrl };
};

const jobs = [...CATEGORY, ...CONTROL].map(cellFor).concat(PRODUCT);

/**
 * The entry under test, capped at the ceiling rather than at its own number, so
 * the probe measures a candidate instead of throwing on it. It cannot go above
 * the ceiling: a candidate that wide is a wrong selector, and the throw is the
 * answer the probe wanted.
 */
const ENTRY = [
  {
    selector: SELECTOR,
    kind: 'non-editorial',
    reason: 'The entry under test. The committed reason is in shared/excluded-regions.mjs.',
    measured: { pages: CATEGORY, production: 0, new: 0 },
    maxUnits: ABSOLUTE_MAX_UNITS,
  },
];

/** @param {string} page @param {string} side @param {string} url */
async function measure(page, side, url) {
  const response = await fetchPage(url);
  const context = { store: 'nl', page, side, url, status: response.status, onWarn: () => {} };

  const kept = extractPage(response.html, { ...context, excludedRegions: [] });
  const cut = extractPage(response.html, { ...context, excludedRegions: ENTRY });
  const region = cut.diagnostics.regionsExcluded[0];

  return {
    kept,
    cut,
    numbers: {
      status: response.status,
      pageType: kept.pageType,
      boundary: kept.boundary,
      unitsBefore: kept.elements.length,
      unitsAfter: cut.elements.length,
      matches: region?.matches ?? 0,
      unitsRemoved: region?.units ?? 0,
      linksRemoved: kept.links.length - cut.links.length,
      imagesRemoved: kept.images.length - cut.images.length,
    },
  };
}

/**
 * Question 4. The unit counts alone do not say whether a **finding** went away,
 * and that is the claim the ticket makes. So the probe compares the page twice.
 *
 * `newSitePaths` and `statuses` are empty on purpose: the links check needs them
 * and this probe asks nothing about link status.
 */
function findingsBeforeAndAfter(production, next) {
  const run = (a, b) =>
    comparePage({
      sides: { production: a, new: b },
      newSitePaths: new Set(),
      statuses: new Map(),
    });

  const before = run(production.kept, next.kept);
  const after = run(production.cut, next.cut);
  const added = (report) =>
    report.findings.filter((f) => f.class === 'text-added').map((f) => f.new);
  const afterAdded = new Set(added(after));
  const beforeAdded = new Set(added(before));

  return {
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    workBefore: before.summary.work,
    workAfter: after.summary.work,
    textAddedBefore: added(before).length,
    textAddedAfter: added(after).length,
    // A row that leaves is the point. A row that appears would mean the cut moved
    // the pairing, and the entry would be doing harm.
    gone: added(before).filter((text) => !afterAdded.has(text)),
    appeared: added(after).filter((text) => !beforeAdded.has(text)),
  };
}

const rows = [];
for (const job of jobs) {
  const [production, next] = await Promise.all([
    measure(job.page, 'production', job.prodUrl),
    measure(job.page, 'new', job.newUrl),
  ]);

  const isCategory = CATEGORY.includes(job.page);
  const findings = isCategory ? findingsBeforeAndAfter(production, next) : null;
  rows.push({ page: job.page, production: production.numbers, new: next.numbers, findings });

  const line = (side, m) =>
    `${side.padEnd(10)} ${String(m.status).padEnd(4)} ${(m.pageType ?? '-').padEnd(9)} ` +
    `matches=${m.matches} units ${m.unitsBefore}→${m.unitsAfter} ` +
    `(-${m.unitsRemoved}) links -${m.linksRemoved} images -${m.imagesRemoved}`;
  console.log(job.page);
  console.log(`  ${line('production', production.numbers)}`);
  console.log(`  ${line('new', next.numbers)}`);
  if (findings) {
    console.log(
      `  findings ${findings.findingsBefore}→${findings.findingsAfter}, ` +
        `work ${findings.workBefore}→${findings.workAfter}, ` +
        `text-added ${findings.textAddedBefore}→${findings.textAddedAfter} ` +
        `(${findings.gone.length} gone, ${findings.appeared.length} appeared)`,
    );
  }
}

await writeFile(
  OUT,
  JSON.stringify({ selector: SELECTOR, at: new Date().toISOString(), rows }, null, 2),
);
console.log(`\nwrote ${OUT.pathname}`);
