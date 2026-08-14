/**
 * THROWAWAY probe, kept as evidence. Ticket 64, re-pointed by ticket 90.
 *
 * It answers the four questions the ADR asks of a new entry in
 * `shared/excluded-regions.mjs`, for the promo banner, plus the two the ticket
 * adds:
 *
 * 1. Does one selector match the banner in **all six stores**? The banner has no
 *    stable class and no stable text — the wrapper class is a generated hash and
 *    the copy is translated — so the anchor is the id production puts on the
 *    block. This is the question to re-ask on the next campaign: the entry no
 *    longer names one, so the probe is how it stays honest.
 * 2. How many content units does it remove on each side? The new site has no
 *    banner, so the answer on that side must be zero — that is what `legacy-only`
 *    means, and it is the entry's own evidence.
 * 3. Do **both** responsive versions leave, and does the selector take nothing
 *    else? The banner is the same block on every page, so the units it removes
 *    must be the same on every page of one store. A page that loses more holds
 *    something the selector should not have matched.
 * 4. Do the findings go away, and does no finding appear?
 *
 *   node crawl/probes/probe-promo-banner.mjs
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { ABSOLUTE_MAX_UNITS, EXCLUDED_REGIONS } from '../../shared/excluded-regions.mjs';
import { comparePage } from '../../compare/30-compare.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-promo-banner.json', import.meta.url);

/**
 * Read from the committed list, never retyped, so re-running this probe measures
 * the entry that ships rather than a copy of it that can drift.
 *
 * It used to be a pair of option ids written out here. Ticket 90 replaced that
 * with the hook production puts on the block, so the probe no longer names a
 * campaign either — which is the point of re-running it on the next one.
 */
const BANNER = EXCLUDED_REGIONS.filter((entry) => entry.kind === 'legacy-only');

if (BANNER.length !== 1) throw new Error(`Expected one legacy-only entry, found ${BANNER.length}.`);

const SELECTOR = BANNER[0].selector;

const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

/** Three pages that all six stores have, so one table answers question 1. */
const PAGES = ['carport', 'terrasoverkapping', '(home)'];

/**
 * Controls. Not "the selector must match nothing here" — the banner is on nearly
 * every page, so that control does not exist. These are the pages where a wrong
 * selector would take editor work: the two the ADR measured `.magezon-builder`
 * on, and the campaign's own terms page, which is the one page whose editorial
 * copy is about this campaign.
 */
const CONTROL = [
  'downloads',
  'betaalmethoden',
  'showroom-contact',
  'actievoorwaarden-10-korting-terrasoverkappingen',
];

/**
 * The entry under test, capped at the ceiling rather than at its own number, so
 * the probe measures a candidate instead of throwing on it.
 */
const ENTRY = [
  {
    selector: SELECTOR,
    kind: 'legacy-only',
    reason: 'The entry under test. The committed reason is in shared/excluded-regions.mjs.',
    measured: { pages: PAGES, production: 0, new: 0 },
    maxUnits: ABSOLUTE_MAX_UNITS,
  },
];

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

/**
 * Every url comes from the seed list. The urls used while grilling this ticket
 * answered 404 for `fr` and `be_fr`, which proved only that they were guessed.
 *
 * @param {string} page
 * @param {string} store
 */
function cellFor(page, store) {
  const cell = seeds.rows.find((row) => row.page === page)?.stores?.[store];
  if (!cell?.prodUrl || !cell.newUrl) return null;
  return { page, store, prodUrl: cell.prodUrl, newUrl: cell.newUrl };
}

/**
 * `hosts` is not optional here, whatever the type says. Without it `linkKey()`
 * folds no host, every internal link differs between the two sides, and the links
 * check reports the whole navigation. The first run of this probe left it out and
 * produced seven phantom `link-target` rows.
 *
 * @param {string} store @param {string} page @param {string} side @param {string} url
 * @param {{ prodHost: string, newHost: string }} hosts
 */
async function measure(store, page, side, url, hosts) {
  const response = await fetchPage(url);
  const context = { store, page, side, url, status: response.status, onWarn: () => {}, ...hosts };

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

/**
 * Question 4. The unit counts alone do not say whether a **finding** went away.
 *
 * `newSitePaths` and `statuses` are empty on purpose: the links check needs them
 * and this probe asks nothing about link status. That means `broken-link` and
 * `redirect` are not counted here, on either side of the cut.
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
  const ids = (report) => new Set(report.findings.map((f) => f.id));
  const afterIds = ids(after);
  const beforeIds = ids(before);

  const byClass = (report) => {
    /** @type {Record<string, number>} */
    const out = {};
    for (const f of report.findings) out[f.class] = (out[f.class] ?? 0) + 1;
    return out;
  };

  return {
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    workBefore: before.summary.work,
    workAfter: after.summary.work,
    classesBefore: byClass(before),
    classesAfter: byClass(after),
    gone: before.findings.filter((f) => !afterIds.has(f.id)).length,
    // A row that appears would mean the cut moved the pairing, and the entry
    // would be doing harm. It is the number that must be zero.
    appeared: after.findings.filter((f) => !beforeIds.has(f.id)).length,
    appearedRows: after.findings
      .filter((f) => !beforeIds.has(f.id))
      .map((f) => ({ class: f.class, prod: f.prod, new: f.new })),
    goneText: before.findings
      .filter((f) => !afterIds.has(f.id))
      .map((f) => (f.prod ?? f.new ?? '').slice(0, 60)),
  };
}

/** @type {any[]} */
const rows = [];

for (const store of STORES) {
  for (const page of [...PAGES, ...CONTROL]) {
    const job = cellFor(page, store);
    if (!job) {
      console.log(`${page.padEnd(46)} ${store.padEnd(6)} — not a page in this store`);
      continue;
    }

    try {
      const hosts = {
        prodHost: new URL(job.prodUrl).host,
        newHost: new URL(job.newUrl).host,
      };
      const [production, next] = await Promise.all([
        measure(store, page, 'production', job.prodUrl, hosts),
        measure(store, page, 'new', job.newUrl, hosts),
      ]);
      const findings = findingsBeforeAndAfter(production, next);
      rows.push({
        store,
        page,
        control: CONTROL.includes(page),
        production: production.numbers,
        new: next.numbers,
        findings,
      });

      console.log(
        `${page.padEnd(46)} ${store.padEnd(6)} ` +
          `prod matches=${production.numbers.matches} units -${production.numbers.unitsRemoved} ` +
          `links -${production.numbers.linksRemoved} | ` +
          `new matches=${next.numbers.matches} units -${next.numbers.unitsRemoved} | ` +
          `findings ${findings.findingsBefore}→${findings.findingsAfter} ` +
          `(${findings.gone} gone, ${findings.appeared} appeared)`,
      );
    } catch (error) {
      rows.push({ store, page, control: CONTROL.includes(page), error: String(error) });
      console.log(
        `${page.padEnd(46)} ${store.padEnd(6)} ERR ${error.name}: ${error.message.slice(0, 80)}`,
      );
    }
  }
}

/**
 * The invariant that stands in for "the selector matched nothing else". The
 * banner is one shared block, so within one store it must remove the same number
 * of units on every page it is on.
 */
console.log('\nunits removed per store, production side:');
for (const store of STORES) {
  const mine = rows.filter((r) => r.store === store && r.production);
  const counts = [...new Set(mine.map((r) => r.production.unitsRemoved))].sort();
  const matches = [...new Set(mine.map((r) => r.production.matches))].sort();
  console.log(
    `  ${store.padEnd(6)} pages=${mine.length} unitsRemoved=${counts.join('/')} ` +
      `matches=${matches.join('/')} ` +
      `${counts.length === 1 ? 'constant' : 'NOT CONSTANT — look at this'}`,
  );
}

const appeared = rows.filter((r) => r.findings?.appeared > 0);
console.log(`\npages where a finding appeared: ${appeared.length}`);
for (const row of appeared)
  console.log(`  ${row.store} ${row.page}`, JSON.stringify(row.findings.appearedRows));

await writeFile(
  OUT,
  JSON.stringify({ selector: SELECTOR, at: new Date().toISOString(), rows }, null, 2),
);
console.log(`\nwrote ${OUT.pathname}`);
