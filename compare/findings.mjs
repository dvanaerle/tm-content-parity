/**
 * Grouping and id assignment, shared by every check.
 *
 * Ticket 02 fixes the grouping key as `status | prodNorm | newNorm`, where
 * `status` is now the class. One rename repeated six times is one finding with
 * `occurrences: 6`, not six findings — that alone removed a third of the raw
 * diff on the prototype page.
 *
 * Ticket 01 fixes the id, and excludes the occurrence count from it: if the
 * count were part of the id, a seventh repeat would detach the editor's
 * dismissal.
 */

import { FINDING_CLASSES, findingId } from './contract.mjs';

export class FindingCollector {
  /**
   * @param {{ store: import('./contract.mjs').Store, page: string }} scope
   */
  constructor({ store, page }) {
    this.store = store;
    this.page = page;
    /** @type {Map<string, import('./contract.mjs').Finding>} */
    this.byKey = new Map();
  }

  /**
   * @param {object} parts
   * @param {keyof FINDING_CLASSES} parts.class
   * @param {string | null} parts.prod   Tier-1 text, letter case kept.
   * @param {string | null} parts.new
   * @param {string | null} [parts.detail]  What changed when the two texts are equal.
   * @param {number | null} [parts.score]  On `copy` findings only.
   * @returns {string} The finding id this occurrence belongs to.
   *
   * The id comes back so a caller can keep the link from its own record to the
   * grouped finding. The Diff tab needs exactly that: a row is a **position** and
   * a finding is **grouped**, so the two cannot be the same record — but an
   * override control on a row has to act on the finding. The browser cannot
   * recompute the id, because `findingId()` needs `node:crypto`.
   */
  add({ class: cls, prod, new: next, detail = null, score = null }) {
    const record = FINDING_CLASSES[cls];
    if (!record) throw new Error(`Unknown finding class: ${cls}. The vocabulary is closed.`);

    // Ticket 33: `detail` is part of the grouping key as well as the id. An
    // `h2` → `h3` and an `h2` → `h4` on the same words are two findings, and the
    // key must say so, or the second one would be counted as a repeat of the first.
    const key = [cls, prod ?? '', next ?? '', detail ?? ''].join('|');
    const seen = this.byKey.get(key);
    if (seen) {
      seen.occurrences += 1;
      return seen.id;
    }

    const id = findingId({
      store: this.store,
      page: this.page,
      check: record.check,
      // Ticket 08: `rule` is the class id. No finer identifier exists, so a
      // re-classification detaches a dismissal. Written down, not solved.
      rule: cls,
      prodNorm: prod,
      newNorm: next,
      detail,
    });

    this.byKey.set(key, {
      id,
      store: this.store,
      page: this.page,
      check: record.check,
      class: cls,
      prod,
      new: next,
      detail,
      occurrences: 1,
      score,
    });
    return id;
  }

  /** @returns {import('./contract.mjs').Finding[]} */
  all() {
    return [...this.byKey.values()];
  }
}

/**
 * The counts the dashboard and the page bar read. Ticket 09: always show
 * absolute numbers, because the denominator moves; a hidden class is not in the
 * bar at all, because the tool must never make a finding it then hides.
 *
 * @param {import('./contract.mjs').Finding[]} findings
 * @returns {{ shown: number, hidden: number, total: number, byClass: Record<string, number>, byCheck: Record<string, number> }}
 */
export function summarise(findings) {
  const byClass = /** @type {Record<string, number>} */ ({});
  const byCheck = /** @type {Record<string, number>} */ ({});
  let shown = 0;

  for (const finding of findings) {
    byClass[finding.class] = (byClass[finding.class] ?? 0) + 1;
    byCheck[finding.check] = (byCheck[finding.check] ?? 0) + 1;
    if (FINDING_CLASSES[finding.class].shown) shown += 1;
  }

  return { shown, hidden: findings.length - shown, total: findings.length, byClass, byCheck };
}

/**
 * @param {number[]} values
 * @returns {number}
 */
export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * The same tally one level up: over pages instead of over findings. It lives
 * beside `summarise()` because both answer "how many of each class", and two
 * places that answer that question would eventually disagree. `compare/measure.mjs`
 * is the command that **prints** this; it is not the place that defines it.
 *
 * Not named "roll-up": `CONTEXT.md` gives that word to findings closed, summed
 * over page, store and migration. This counts findings made.
 *
 * The median is over **comparable** pages only. A page that cannot be compared
 * carries no findings by design (ticket 07), so counting its zero would drag the
 * median down for a reason that has nothing to do with the rules.
 *
 * @param {import('./contract.mjs').PageReport[]} reports
 */
export function summariseReports(reports) {
  const comparable = reports.filter((report) => report.comparable);
  /** @type {Record<string, number>} */
  const byClass = {};
  let findings = 0;
  let shown = 0;
  let clean = 0;

  for (const report of comparable) {
    findings += report.summary.total;
    shown += report.summary.shown;
    if (report.summary.shown === 0) clean += 1;
    for (const [cls, count] of Object.entries(report.summary.byClass)) {
      byClass[cls] = (byClass[cls] ?? 0) + count;
    }
  }
  return {
    crawled: reports.length,
    comparable: comparable.length,
    findings,
    shown,
    medianShown: median(comparable.map((report) => report.summary.shown)),
    medianTotal: median(comparable.map((report) => report.summary.total)),
    cleanPages: clean,
    byClass,
  };
}
