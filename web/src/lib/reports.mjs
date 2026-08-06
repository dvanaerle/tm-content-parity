import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_PAGES } from '../../../crawl/excluded-pages.mjs';
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';

/**
 * `compare/30-compare.mjs` writes one `PageReport` per store page into
 * `data/reports/`. The folder is not in git, so a fresh clone builds an empty log
 * instead of failing.
 *
 * @typedef {import('../../../compare/contract.mjs').PageReport} PageReport
 */

const DIR = fileURLToPath(new URL('../../../data/reports/', import.meta.url));

/** @returns {Promise<string[]>} */
async function reportFiles() {
  try {
    return (await readdir(DIR)).filter((name) => name.endsWith('.json')).sort();
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return [];
    throw error;
  }
}

/** @returns {Promise<PageReport[]>} */
export async function loadReports() {
  const names = await reportFiles();
  return Promise.all(names.map(async (name) => JSON.parse(await readFile(DIR + name, 'utf8'))));
}

/**
 * The dashboard reads every page at once, and a full report holds both extracts —
 * 11 MB across the NL store. So it keeps the summary and throws the rest away,
 * one file at a time.
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
 * @returns {Promise<PageSummary[]>}
 */
export async function loadSummaries() {
  /** @type {PageSummary[]} */
  const out = [];
  for (const name of await reportFiles()) {
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
