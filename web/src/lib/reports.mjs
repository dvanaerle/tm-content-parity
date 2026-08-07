import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_PAGES } from '../../../crawl/excluded-pages.mjs';
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
 * `compare/30-compare.mjs` names a report `<store>__<page>.json`, so the store of
 * a report is readable from its filename. Reading it there rather than from the
 * JSON is what lets one store's dashboard open only that store's files.
 *
 * No two store ids are prefixes of one another once the `__` is counted — `be__`
 * does not match `be_fr__` — so the match is exact.
 *
 * @param {string} name
 * @returns {string | null}
 */
export function storeOfFile(name) {
  return STORES.find((store) => name.startsWith(`${store}__`)) ?? null;
}

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
 * The stores the log actually holds, in the contract's order. A store with no
 * report has not been crawled and gets no route and no switcher entry — the
 * switcher offers what exists, never a dead link.
 *
 * @returns {Promise<string[]>}
 */
export async function storesInLog() {
  const found = new Set((await reportFiles()).map(storeOfFile));
  return STORES.filter((store) => found.has(store));
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
 * It keeps a **compact finding index** as well: the id and the class of every
 * finding in a shown class, and nothing else. That is the minimum
 * `deriveStoreState()` needs, so the dashboard can sort on the state after
 * overrides rather than on the raw snapshot — the worst page is then the worst
 * *remaining* page. Hidden classes are left out, because ticket 09 keeps them
 * out of the bar entirely.
 *
 * @typedef {object} PageSummary
 * @property {string} store
 * @property {string} page
 * @property {boolean} comparable
 * @property {string | null} skipReason
 * @property {import('../../../compare/contract.mjs').ReportSummary} summary
 * @property {{ id: string, class: string }[]} findings
 * @property {string} observationId
 * @property {string} findingSetHash
 * @property {{ production: SideSummary, new: SideSummary }} sides
 *
 * @typedef {{ url: string, status: number, elements: number }} SideSummary
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
        .map((finding) => ({ id: finding.id, class: finding.class })),
      observationId: report.observationId,
      findingSetHash: report.findingSetHash,
      sides: { production: side(report.sides.production), new: side(report.sides.new) },
    });
  }
  return out;
}

/** @param {import('../../../compare/contract.mjs').PageExtract} extract */
const side = (extract) => ({
  url: extract.url,
  status: extract.status,
  elements: extract.elements.length,
});

/**
 * Ticket 19: an excluded page stays **visible** as excluded, with its reason,
 * rather than silently absent. Absence is what let a broken parse run for a whole
 * crawl unnoticed.
 */
export const excluded = EXCLUDED_PAGES;

const SEEDS = fileURLToPath(new URL('../../../data/10-store-seeds.json', import.meta.url));

/**
 * The excluded pages **this** store has. `veranda-configurator` is nl only, so a
 * German dashboard that reported one page "niet gecontroleerd" would be counting
 * another store's page (ticket 38).
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
  const inStore = new Set(
    seeds.rows.filter((row) => row.stores?.[store]?.prodUrl).map((row) => row.page),
  );
  return EXCLUDED_PAGES.filter((entry) => inStore.has(entry.page));
}
