/**
 * THROWAWAY probe, kept as evidence. Ticket 69.
 *
 * `probe-canonical-viewport.mjs` priced the rule on 39 page-store pairs. This one
 * answers the two questions that 39 pairs cannot:
 *
 * 1. **Does the cap hold on the whole corpus?** A cap that fails the run on a
 *    correct selector is the mistake ticket 64 found in the banner entry, and it
 *    can only be found by measuring every page.
 * 2. **How much does the rule drop, and what does the log stop checking?** Every
 *    text the rule takes that the page then holds nowhere is content the log
 *    ceases to compare. That number belongs in the ADR, not in a hope.
 *
 *   node crawl/probes/probe-canonical-viewport-corpus.mjs
 *
 * It reads the committed convention list through `crawl/extract.mjs` rather than
 * retyping a selector, and it raises the cap to the ceiling so that a wide match
 * measures instead of stopping the probe. Nothing under `data/` is written except
 * this probe's own result.
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { HIDDEN_AT_CANONICAL_VIEWPORT } from '../../shared/canonical-viewport.mjs';
import { ABSOLUTE_MAX_UNITS } from '../../shared/excluded-regions.mjs';
import { comparePage, newSitePathsFor } from '../../compare/30-compare.mjs';
import { cellWithBothSides } from '../../shared/seed-rows.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';
import { isExcludedPage } from '../../shared/excluded-pages.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const LINK_STATUS = new URL('../../data/link-status.json', import.meta.url);
const OUT = new URL('../../data/probe-canonical-viewport-corpus.json', import.meta.url);

const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];
const CONCURRENCY = 6;

/** The committed list at the ceiling, so a wide match is measured and not thrown on. */
const AT_CEILING = HIDDEN_AT_CANONICAL_VIEWPORT.map((convention) => ({
  ...convention,
  maxUnits: ABSOLUTE_MAX_UNITS,
}));

/** Nothing dropped: how the corpus reads today, before this ticket. */
const NONE = [];

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
const statuses = new Map(Object.entries(JSON.parse(await readFile(LINK_STATUS, 'utf8'))));

/** @type {Map<string, Set<string>>} */
const pathsByStore = new Map(STORES.map((store) => [store, newSitePathsFor(seeds, store)]));

/** @type {{store: string, page: string, prodUrl: string, newUrl: string}[]} */
const jobs = [];
for (const row of seeds.rows) {
  if (isExcludedPage(row.page)) continue;
  for (const store of STORES) {
    const cell = cellWithBothSides(row, store);
    if (cell) jobs.push({ store, page: row.page, prodUrl: cell.prodUrl, newUrl: cell.newUrl });
  }
}

console.log(`${jobs.length} store pages, ${STORES.length} stores.\n`);

/** @param {{class: string}[]} findings */
function countBy(findings) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const finding of findings) out[finding.class] = (out[finding.class] ?? 0) + 1;
  return out;
}

/**
 * Text the page holds nowhere once the rule has run: the log's new blind spot,
 * measured rather than assumed.
 *
 * @param {import('../../compare/contract.mjs').PageExtract} kept
 * @param {import('../../compare/contract.mjs').PageExtract} cut
 */
function textsLostEntirely(kept, cut) {
  const surviving = new Set(cut.elements.map((unit) => unit.norm));
  return [...new Set(kept.elements.map((unit) => unit.norm))].filter((t) => !surviving.has(t));
}

/** @param {typeof jobs[number]} job */
async function run(job) {
  const hosts = { prodHost: new URL(job.prodUrl).host, newHost: new URL(job.newUrl).host };

  const measure = async (side, url) => {
    const response = await fetchPage(url);
    const context = {
      store: job.store,
      page: job.page,
      side,
      url,
      status: response.status,
      onWarn: () => {},
      ...hosts,
    };
    return {
      kept: extractPage(response.html, { ...context, hiddenAtCanonicalViewport: NONE }),
      cut: extractPage(response.html, { ...context, hiddenAtCanonicalViewport: AT_CEILING }),
    };
  };

  const [production, next] = await Promise.all([
    measure('production', job.prodUrl),
    measure('new', job.newUrl),
  ]);

  const compare = (a, b) =>
    comparePage({
      sides: { production: a, new: b },
      newSitePaths: pathsByStore.get(job.store),
      statuses,
    });
  const before = compare(production.kept, next.kept);
  const after = compare(production.cut, next.cut);

  const beforeIds = new Set(before.findings.map((f) => f.id));
  const afterIds = new Set(after.findings.map((f) => f.id));
  const gone = before.findings.filter((f) => !afterIds.has(f.id));
  const appeared = after.findings.filter((f) => !beforeIds.has(f.id));

  return {
    store: job.store,
    page: job.page,
    comparable: before.comparable,
    matches: production.cut.diagnostics.hiddenAtViewport.matches,
    unitsRemoved: production.cut.diagnostics.hiddenAtViewport.units,
    unitsRemovedNew: next.cut.diagnostics.hiddenAtViewport.units,
    units: production.kept.elements.length,
    lostEntirely: textsLostEntirely(production.kept, production.cut),
    lostEntirelyNew: textsLostEntirely(next.kept, next.cut),
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    workBefore: before.summary.work,
    workAfter: after.summary.work,
    goneByClass: countBy(gone),
    appearedByClass: countBy(appeared),
    appearedRows: appeared.map((f) => ({ class: f.class, prod: f.prod, new: f.new })),
  };
}

const rows = [];
let done = 0;
const queue = [...jobs];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift();
      try {
        rows.push(await run(job));
      } catch (error) {
        rows.push({ store: job.store, page: job.page, error: `${error.name}: ${error.message}` });
      }
      done += 1;
      if (done % 50 === 0) console.log(`${done}/${jobs.length}`);
    }
  }),
);

const ok = rows.filter((r) => !r.error);
const totals = {
  pairs: rows.length,
  measured: ok.length,
  errors: rows.length - ok.length,
  pagesWithAMatch: ok.filter((r) => r.matches > 0).length,
  unitsRemoved: ok.reduce((t, r) => t + r.unitsRemoved, 0),
  unitsRemovedNew: ok.reduce((t, r) => t + r.unitsRemovedNew, 0),
  widestPage: Math.max(0, ...ok.map((r) => r.unitsRemoved)),
  overCommittedCap: ok.filter((r) => r.unitsRemoved > 60).map((r) => `${r.store}/${r.page}`),
  findingsBefore: ok.reduce((t, r) => t + r.findingsBefore, 0),
  findingsAfter: ok.reduce((t, r) => t + r.findingsAfter, 0),
  workBefore: ok.reduce((t, r) => t + r.workBefore, 0),
  workAfter: ok.reduce((t, r) => t + r.workAfter, 0),
  lostEntirely: ok.reduce((t, r) => t + r.lostEntirely.length, 0),
  lostEntirelyNew: ok.reduce((t, r) => t + r.lostEntirelyNew.length, 0),
};

const sumClasses = (field) => {
  const out = {};
  for (const r of ok) for (const [c, n] of Object.entries(r[field])) out[c] = (out[c] ?? 0) + n;
  return out;
};

console.log('\ntotals', totals);
console.log('gone by class', sumClasses('goneByClass'));
console.log('appeared by class', sumClasses('appearedByClass'));
console.log('widest page removes', totals.widestPage, 'units; committed cap is 60');
console.log('pages over the committed cap:', totals.overCommittedCap);

await writeFile(
  OUT,
  `${JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      totals,
      goneByClass: sumClasses('goneByClass'),
      appearedByClass: sumClasses('appearedByClass'),
      rows,
    },
    null,
    2,
  )}\n`,
);
console.log(`Wrote ${OUT.pathname}`);
