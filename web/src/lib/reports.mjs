import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fromRoot } from './repo-root.mjs';
import { EXCLUDED_PAGES } from '../../../shared/excluded-pages.mjs';
import { EXCLUDED_REGIONS } from '../../../shared/excluded-regions.mjs';
import { notCheckedInStore } from './not-checked.mjs';
import { addPage, emptyIndex } from './search.mjs';
import { CoverageTally } from '../../../compare/region-coverage.mjs';
import { storeOfFile } from '../../../compare/contract.mjs';
import { isWork, STORES } from '../../../compare/vocabulary.mjs';

/**
 * `compare/30-compare.mjs` writes one `PageReport` per store page into
 * `data/reports/`. The folder is not in git, so a fresh clone builds an empty log
 * instead of failing.
 *
 * @typedef {import('../../../compare/contract.mjs').PageReport} PageReport
 */

const DIR = fromRoot('data/reports');

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
  return Promise.all(
    names.map(async (name) => JSON.parse(await readFile(join(DIR, name), 'utf8'))),
  );
}

/**
 * The dashboard reads every page of **one store** at once, and a full report holds
 * both extracts — 11 MB across the NL store. So it keeps the summary and throws
 * the rest away, one file at a time. Ticket 38: the store narrows it again, so a
 * visitor who opens the German store does not download the other five.
 *
 * It keeps a **compact finding index** as well: every finding in a `work` class,
 * with what the dashboard has a use for and nothing else. Classes that are not `work`
 * are left out, because ticket 09 keeps them out of the bar entirely.
 *
 * Two groups of fields, and each one is here for a named reason:
 *
 * - `id` and `class` are the minimum `deriveStoreState()` needs, so the dashboard
 *   can sort on the state after overrides rather than on the raw snapshot — the
 *   worst page is then the worst *remaining* page.
 * - `prod`, `new`, `detail` and `occurrences` are the repeat grouping (ticket 81).
 *   They are the one costly part of this index: the two texts of every `work`
 *   finding in the store now cross the wire. Measured on `nl`, 4,784 work findings
 *   (ticket 113): the index goes from 69 kB to 166 kB gzipped. It is paid once —
 *   the repeat list is derived in the browser from **this** array, so no second
 *   copy of the same text is serialised beside it, and a repeat is exactly the case
 *   that compresses well.
 *
 *   The figure is re-measured here because ticket 113 took `anchorHeading` out of
 *   this index — 20 kB of the gzip — and a cost sentence that names the expensive
 *   group has to be true of the payload it is written above.
 *
 * @typedef {object} PageSummary
 * @property {string} store
 * @property {string} page
 * @property {boolean} comparable
 * @property {string | null} skipReason
 * @property {import('../../../compare/contract.mjs').ReportSummary} summary
 * @property {IndexedFinding[]} findings
 *
 * @typedef {object} IndexedFinding
 * @property {string} id
 * @property {string} class
 * @property {string | null} prod
 * @property {string | null} new
 * @property {string | null} detail
 * @property {number} occurrences
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
    const report = JSON.parse(await readFile(join(DIR, name), 'utf8'));
    out.push({
      store: report.store,
      page: report.page,
      comparable: report.comparable,
      skipReason: report.skipReason,
      summary: report.summary,
      findings: report.findings
        .filter((finding) => isWork(finding.class))
        .map((finding) => ({
          id: finding.id,
          class: finding.class,
          prod: finding.prod ?? null,
          new: finding.new ?? null,
          detail: finding.detail ?? null,
          occurrences: finding.occurrences ?? 1,
        })),
      observationId: report.observationId,
      findingSetHash: report.findingSetHash,
      sides: { production: side(report.sides.production), new: side(report.sides.new) },
    });
  }
  return out;
}

/**
 * One store's search index, read the way summaries are read: one file at a time, keeping
 * the small projection and letting the report go (ticket 82).
 *
 * It reads **full** reports where `loadSummaries()` would do, and it has to: the words on
 * a link live in the extract, and the extract is the half a summary throws away. That one
 * field is why the index is emitted by the build rather than derived in the browser from
 * the array the dashboard already holds.
 *
 * @param {string} store
 * @returns {Promise<import('./search.mjs').SearchIndex>}
 */
export async function loadSearchIndex(store) {
  const index = emptyIndex(store);
  for (const name of await reportFiles(store)) {
    addPage(index, JSON.parse(await readFile(join(DIR, name), 'utf8')));
  }
  return index;
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
  regionsExcluded: (extract.diagnostics?.regionsExcluded ?? []).map((region) => ({
    selector: region.selector,
    units: region.units,
  })),
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

const SEEDS = fromRoot('data/10-store-seeds.json');
const SNAPSHOT = fromRoot('data/snapshot.json');

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
    if (/** @type {any} */ (error).code === 'ENOENT')
      return { store: null, reason: null, changes: [] };
    throw error;
  }
  return {
    store: snapshot.store ?? null,
    reason: snapshot.regionsChanged?.reason ?? null,
    changes: snapshot.regionsChanged?.changes ?? [],
  };
}

/**
 * The rows of the seed list.
 *
 * The block reading needs them whole, because a sibling is matched across two rows
 * and not inside one. A missing seed file reports nothing rather than failing the
 * build, for the reason an empty `data/reports/` builds an empty log.
 *
 * @returns {Promise<import('../../../shared/seed-rows.mjs').SeedRow[]>}
 */
export async function loadSeedRows() {
  try {
    return JSON.parse(await readFile(SEEDS, 'utf8')).rows ?? [];
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Every page of this store the log found and does not check, with its reason
 * (ticket 56). Three things leave a page out and `not-checked.mjs` gives the
 * three words; this function only reads the two files they need.
 *
 * A missing seed file reports nothing rather than failing the build, for the same
 * reason an empty `data/reports/` builds an empty log: a fresh clone has neither,
 * and it must still build.
 *
 * @param {string} store
 * @param {{ page: string }[]} crawled The pages that have a report, which is what
 *   `loadSummaries(store)` returns.
 * @returns {Promise<import('./not-checked.mjs').NotChecked[]>}
 */
export async function notCheckedFor(store, crawled = []) {
  let seeds;
  try {
    seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return [];
    throw error;
  }
  return notCheckedInStore({
    rows: seeds.rows ?? [],
    // A seed list written before this ticket holds a count here and not a list.
    // It then reports the exclusions it can name and none it cannot, which is
    // what an older file honestly knows.
    dropped: Array.isArray(seeds.dropped) ? seeds.dropped : [],
    crawled: crawled.map((page) => page.page),
    store,
  });
}
