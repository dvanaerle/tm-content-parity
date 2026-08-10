import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_PAGES } from '../../../crawl/excluded-pages.mjs';
import { EXCLUDED_REGIONS } from '../../../shared/excluded-regions.mjs';
import { cellWithBothSides } from '../../../crawl/seed-rows.mjs';
import { CoverageTally } from '../../../compare/region-coverage.mjs';
import { storeOfFile } from '../../../compare/contract.mjs';
import { FINDING_CLASSES, STORES } from '../../../compare/vocabulary.mjs';

/**
 * `compare/30-compare.mjs` writes one `PageReport` per store page into
 * `data/reports/`. The folder is not in git, so a fresh clone builds an empty log
 * instead of failing.
 *
 * @typedef {import('../../../compare/contract.mjs').PageReport} PageReport
 */

const DIR = fileURLToPath(new URL('../../../data/reports/', import.meta.url));

/**
 * @param {string} [store] Only this store's reports. Omit for every store.
 * @returns {Promise<string[]>}
 */
async function reportFiles(store) {
  try {
    const names = (await readdir(DIR)).filter((name) => name.endsWith('.json')).sort();
    return store ? names.filter((name) => storeOfFile(name) === store) : names;
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * The stores a set of report filenames holds, in the contract's order. A store
 * with no report has not been crawled and gets no route and no switcher entry —
 * the switcher offers what exists, never a dead link.
 *
 * The order is the contract's and not the folder's, so the switcher reads the
 * same on every store.
 *
 * @param {string[]} names
 * @returns {string[]}
 */
export function storesFromFilenames(names) {
  const found = new Set(names.map(storeOfFile));
  return STORES.filter((store) => found.has(store));
}

/**
 * The shell carries the switcher, so every one of the 455 built pages asks for
 * this list. The list is the same for the whole build, so the folder is read once.
 *
 * A store crawled while the dev server runs needs a restart to appear in the
 * switcher. Only the list is held: the reports themselves are read per page.
 *
 * @type {Promise<string[]> | null}
 */
let storesCache = null;

/** @returns {Promise<string[]>} */
export function storesInLog() {
  storesCache ??= reportFiles().then(storesFromFilenames);
  return storesCache;
}

/**
 * @param {string} [store]
 * @returns {Promise<PageReport[]>}
 */
export async function loadReports(store) {
  const names = await reportFiles(store);
  return Promise.all(names.map(async (name) => JSON.parse(await readFile(DIR + name, 'utf8'))));
}

/**
 * The dashboard reads every page of **one store** at once, and a full report holds
 * both extracts — 11 MB across the NL store. So it keeps the summary and throws
 * the rest away, one file at a time. Ticket 38: the store narrows it again, so a
 * visitor who opens the German store does not download the other five.
 *
 * It keeps a **compact finding index** as well: the id, the class and the anchor
 * heading of every finding in a shown class, and nothing else. That is the
 * minimum `deriveStoreState()` needs, so the dashboard can sort on the state after
 * overrides rather than on the raw snapshot — the worst page is then the worst
 * *remaining* page. Hidden classes are left out, because ticket 09 keeps them
 * out of the bar entirely.
 *
 * The heading is here because ticket 88 put it in the mute key. Without it a
 * section mute would read on the dashboard as a mute of the whole class, and the
 * dashboard would disagree with the page it links to.
 *
 * @typedef {object} PageSummary
 * @property {string} store
 * @property {string} page
 * @property {boolean} comparable
 * @property {string | null} skipReason
 * @property {import('../../../compare/contract.mjs').ReportSummary} summary
 * @property {{ id: string, class: string, anchorHeading: string | null }[]} findings
 * @property {string} observationId
 * @property {string} findingSetHash
 * @property {{ production: SideSummary, new: SideSummary }} sides
 *
 * @typedef {{ url: string, status: number, units: number, regionsExcluded: { selector: string, units: number }[] }} SideSummary
 *
 * @param {string} [store] Only this store's reports. Omit for every store.
 * @returns {Promise<PageSummary[]>}
 */
export async function loadSummaries(store) {
  /** @type {PageSummary[]} */
  const out = [];
  for (const name of await reportFiles(store)) {
    /** @type {PageReport} */
    const report = JSON.parse(await readFile(DIR + name, 'utf8'));
    out.push({
      store: report.store,
      page: report.page,
      comparable: report.comparable,
      skipReason: report.skipReason,
      summary: report.summary,
      findings: report.findings
        .filter((finding) => FINDING_CLASSES[finding.class]?.shown)
        .map((finding) => ({
          id: finding.id, class: finding.class, anchorHeading: finding.anchorHeading ?? null,
        })),
      observationId: report.observationId,
      findingSetHash: report.findingSetHash,
      sides: { production: side(report.sides.production), new: side(report.sides.new) },
    });
  }
  return out;
}

/**
 * A report written before ticket 63 has no `regionsExcluded`, and so does a
 * re-check from an older service. It reads as "no region cut here", which is the
 * over-reporting direction and the safe one.
 *
 * @param {import('../../../compare/contract.mjs').PageExtract} extract
 */
const side = (extract) => ({
  url: extract.url,
  status: extract.status,
  units: extract.elements.length,
  regionsExcluded: (extract.diagnostics?.regionsExcluded ?? [])
    .map((region) => ({ selector: region.selector, units: region.units })),
});

/**
 * Ticket 19: an excluded page stays **visible** as excluded, with its reason,
 * rather than silently absent. Absence is what let a broken parse run for a whole
 * crawl unnoticed.
 */
export const excluded = EXCLUDED_PAGES;

/**
 * Ticket 63: an excluded **region** is visible in the same manner as an excluded
 * page. Every entry is listed. Each one says where it was removed in this store's
 * snapshot: the pages, and the units it took.
 *
 * `removedOn` is what makes the entry falsifiable. An entry removed on no page has
 * stopped matching. The reader then sees one line, and does not have to infer it
 * from the findings that came back.
 *
 * The word `coverage` is not used here on purpose. `CONTEXT.md` gives it to axis B.
 *
 * Ticket 64 counts the same thing at the compare stage, to compare it with the
 * run before. The counting is one rule, so it is done in one place: this function
 * adds the reason and the measurement that the dashboard shows, and nothing else.
 *
 * @param {PageSummary[]} pages
 */
export function regionsRemovedInStore(pages) {
  const tally = new CoverageTally(EXCLUDED_REGIONS);
  for (const page of pages) {
    tally.addPage({
      production: page.sides.production.regionsExcluded,
      new: page.sides.new.regionsExcluded,
    });
  }

  const counted = new Map(tally.all().map((region) => [region.selector, region.removedOn]));
  return EXCLUDED_REGIONS.map((entry) => ({ ...entry, removedOn: counted.get(entry.selector) }));
}

const SEEDS = fileURLToPath(new URL('../../../data/10-store-seeds.json', import.meta.url));
const SNAPSHOT = fileURLToPath(new URL('../../../data/snapshot.json', import.meta.url));

/**
 * Ticket 64: the excluded-region coverage of the last run, against the run before
 * it. The banner anchor is campaign-specific, so it will stop matching one day,
 * and 2,600 findings will come back at once. This is the line that says so.
 *
 * It is a statement about the **whole run**, not about one store, and the
 * dashboard labels it that way. `compare/30-compare.mjs` writes it.
 *
 * A missing snapshot reports nothing rather than failing the build, for the same
 * reason an empty `data/reports/` builds an empty log.
 *
 * @returns {Promise<{ store: string | null, reason: string | null, changes: import('../../../compare/region-coverage.mjs').CoverageChange[] }>}
 */
export async function regionsChangedInLog() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(SNAPSHOT, 'utf8'));
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return { store: null, reason: null, changes: [] };
    throw error;
  }
  return {
    store: snapshot.store ?? null,
    reason: snapshot.regionsChanged?.reason ?? null,
    changes: snapshot.regionsChanged?.changes ?? [],
  };
}

/**
 * The excluded pages **this** store has. `veranda-configurator` is nl only, so a
 * German dashboard that reported one page "niet gecontroleerd" would be counting
 * another store's page (ticket 38).
 *
 * The store has the page when the cell has both sides, which is the crawler's
 * condition and not a second one. Ticket 38's review found this asking for the
 * production url alone: a page with production and no counterpart was excluded
 * here and never excluded by the crawler, so the two counts could disagree.
 *
 * @param {import('../../../crawl/seed-rows.mjs').SeedRow[]} rows
 * @param {string} store
 * @returns {typeof EXCLUDED_PAGES}
 */
export function excludedInStore(rows, store) {
  const inStore = new Set(
    rows.filter((row) => cellWithBothSides(row, store)).map((row) => row.page),
  );
  return EXCLUDED_PAGES.filter((entry) => inStore.has(entry.page));
}

/**
 * A missing seed file reports no excluded page rather than failing the build, for
 * the same reason an empty `data/reports/` builds an empty log: a fresh clone has
 * neither, and it must still build.
 *
 * @param {string} store
 * @returns {Promise<typeof EXCLUDED_PAGES>}
 */
export async function excludedFor(store) {
  let seeds;
  try {
    seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return [];
    throw error;
  }
  return excludedInStore(seeds.rows, store);
}
