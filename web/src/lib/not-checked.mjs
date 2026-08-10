/**
 * **Not checked** — the pages the log found and does not compare, each with the
 * reason (`CONTEXT.md`, ticket 56).
 *
 * Three things leave a page out, and they happen at three different moments:
 *
 * 1. `dropped-by-rule` — the seed rule of ticket 50 never admitted the URL.
 *    `crawl/seed-list.mjs` decides this and writes the list into
 *    `data/10-store-seeds.json`, which git tracks.
 * 2. `excluded-page` — the page is a store page and `shared/excluded-pages.mjs`
 *    holds its key. The crawler fetches nothing for it.
 * 3. `not-crawled` — the seed list has the page on both sides and the report
 *    folder has no report for it. Nothing decided this. It is what a failed
 *    fetch looks like from the dashboard, and it must not read as absence.
 *
 * The first two are decisions and the third is an accident, so the reader gets
 * three words and not one. An editor acts on them differently.
 *
 * Only `web/` reads this, so it stays in `web/`. ADR 0001: `shared/` is for pure
 * code that **two** stages read, and the vocabulary the crawler also writes is
 * the part that lives there, in `shared/drop-rules.mjs`.
 */

import { EXCLUDED_PAGES } from '../../../shared/excluded-pages.mjs';
import { dropReason } from '../../../shared/drop-rules.mjs';
import { cellWithBothSides } from '../../../shared/seed-rows.mjs';

/** @typedef {import('../../../shared/seed-rows.mjs').SeedRow} SeedRow */

/** No committed rule owns this one. A failed fetch is not a decision. */
const NOT_CRAWLED_REASON =
  'No report. The seed list has this page on both sides of the comparison and the '
  + 'crawl wrote no report for it, so the fetch failed. This is not an exclusion. '
  + 'The next crawl can still bring it in.';

/**
 * The excluded pages **this** store has. `veranda-configurator` is nl only, so a
 * German dashboard that reported one page *niet gecontroleerd* would be counting
 * another store's page (ticket 38).
 *
 * The store has the page when the cell has both sides, which is the crawler's
 * condition and not a second one. Ticket 38's review found this asking for the
 * production url alone: a page with production and no counterpart was excluded
 * here and never excluded by the crawler, so the two counts could disagree.
 *
 * @param {SeedRow[]} rows
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
 * @typedef {object} NotChecked
 * @property {string} page What the reader calls it: the page key of a store page,
 *   the path of a URL that never became one.
 * @property {'dropped-by-rule' | 'excluded-page' | 'not-crawled'} kind
 * @property {string | null} rule The named rule, on a `dropped-by-rule` entry.
 * @property {string} reason
 * @property {string | null} url The production URL, where the entry has one.
 */

const KIND_ORDER = ['not-crawled', 'excluded-page', 'dropped-by-rule'];

const byKindThenPage = (a, b) =>
  KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  || (a.page < b.page ? -1 : a.page > b.page ? 1 : 0);

/**
 * Every page of one store that the log found and does not check.
 *
 * The three kinds are merged here and nowhere else, so the dashboard shows one
 * list and the store total adds one number. A page cannot be in two kinds: an
 * excluded page is never crawled, and a dropped URL never became a store page.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows The rows of `data/10-store-seeds.json`.
 * @param {{ loc: string, store: string | null, path: string, rule: string, detail?: string }[]} input.dropped
 *   The drop list of the same file. A drop with no store is a URL of no store,
 *   and it reaches no store's dashboard.
 * @param {string[]} input.crawled The page keys that have a report.
 * @param {string} input.store
 * @returns {NotChecked[]}
 */
export function notCheckedInStore({ rows, dropped = [], crawled = [], store }) {
  const excluded = excludedInStore(rows, store);
  const excludedKeys = new Set(excluded.map((entry) => entry.page));
  const hasReport = new Set(crawled);

  /** @type {Map<string, string>} */
  const prodUrl = new Map();
  for (const row of rows) {
    const cell = cellWithBothSides(row, store);
    if (cell?.prodUrl) prodUrl.set(row.page, cell.prodUrl);
  }

  /** @type {NotChecked[]} */
  const out = [];

  for (const page of prodUrl.keys()) {
    if (excludedKeys.has(page) || hasReport.has(page)) continue;
    out.push({
      page,
      kind: 'not-crawled',
      rule: null,
      reason: NOT_CRAWLED_REASON,
      url: prodUrl.get(page) ?? null,
    });
  }

  for (const entry of excluded) {
    out.push({
      page: entry.page,
      kind: 'excluded-page',
      rule: null,
      reason: entry.reason,
      url: prodUrl.get(entry.page) ?? null,
    });
  }

  for (const entry of dropped) {
    if (entry.store !== store) continue;
    out.push({
      page: entry.path,
      kind: 'dropped-by-rule',
      rule: entry.rule,
      reason: dropReason(entry),
      url: entry.loc,
    });
  }

  return out.sort(byKindThenPage);
}

/**
 * The numbers beside the store name.
 *
 * Ticket 38 found an editor reading the **comparable** count as the size of the
 * store: on `fr` the gap was 28 to 25, and the reader who arrived through the
 * switcher took 25 for the whole store. So the total the dashboard states is
 * `found`, and the pages the log does not check are inside it. They are pages of
 * the store. A total that leaves them out is a smaller store than the one that
 * exists.
 *
 * The arithmetic is here and not in the template, because it is the one number
 * two people can quote and mean different things by.
 *
 * @param {object} input
 * @param {{ comparable: boolean }[]} input.pages The pages that have a report.
 * @param {NotChecked[]} input.notChecked
 * @returns {{ found: number, crawled: number, comparable: number, oneSided: number, notChecked: number }}
 */
export function storeTotals({ pages = [], notChecked = [] }) {
  const oneSided = pages.filter((page) => !page.comparable).length;
  return {
    found: pages.length + notChecked.length,
    crawled: pages.length,
    comparable: pages.length - oneSided,
    oneSided,
    notChecked: notChecked.length,
  };
}

/**
 * The list, folded onto its reasons.
 *
 * One store drops about twenty product pages, and twenty copies of one sentence
 * is a list nobody reads to the end. The reason is said once and the pages sit
 * under it, so the reader counts the kinds first and the pages second.
 *
 * The reason is the group, and not the rule. A `duplicate-in-store` drop carries
 * a detail that names the page it lost to, so two of them are two reasons and
 * they must not be folded together.
 *
 * @param {NotChecked[]} entries
 * @returns {{ key: string, kind: string, rule: string | null, reason: string, pages: NotChecked[] }[]}
 *   In the order the entries came in, which is the order of `notCheckedInStore`.
 */
export function groupNotChecked(entries) {
  /** @type {Map<string, { key: string, kind: string, rule: string | null, reason: string, pages: NotChecked[] }>} */
  const groups = new Map();
  for (const entry of entries) {
    const key = `${entry.kind}\n${entry.reason}`;
    const group = groups.get(key)
      ?? groups.set(key, { key, kind: entry.kind, rule: entry.rule, reason: entry.reason, pages: [] }).get(key);
    group.pages.push(entry);
  }
  return [...groups.values()];
}
