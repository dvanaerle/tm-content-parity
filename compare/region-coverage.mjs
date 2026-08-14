/**
 * Excluded-region coverage, compared against the previous snapshot (ticket 64).
 *
 * The banner anchor is campaign-specific by construction. The next campaign
 * changes the option ids, the entry stops matching, and 2,600 findings come back
 * at once. That is the safe direction — the log over-reports and never widens —
 * but it is not a quiet one, and the reader must not have to infer it from the
 * rows that returned.
 *
 * So a run counts the pages each entry was removed on, and it compares that
 * count with the run before. A region that was removed on 371 pages and is now
 * removed on none is **one line**.
 *
 * The comparison is between two runs of the same scope. A one-store run against
 * a whole-corpus snapshot would read as five stores that stopped matching, so it
 * is refused rather than reported.
 */

import { EXCLUDED_REGIONS } from '../shared/excluded-regions.mjs';

/**
 * @typedef {object} RegionCoverage
 * @property {string} selector
 * @property {string} kind
 * @property {{ production: SideCount, new: SideCount }} removedOn
 *
 * @typedef {{ pages: number, units: number }} SideCount
 */

const SIDES = /** @type {const} */ (['production', 'new']);

/**
 * One tally over the pages of one run, in the manner of `FindingCollector`: the
 * compare stage reads one report at a time and never holds the corpus.
 *
 * It counts by entry and not by what it finds, so an entry that matched nowhere
 * is a zero in the list rather than a missing row. A zero is the number the
 * comparison needs.
 */
export class CoverageTally {
  /** @param {ReadonlyArray<{ selector: string, kind: string }>} [entries] */
  constructor(entries = EXCLUDED_REGIONS) {
    /** @type {Map<string, RegionCoverage>} */
    this.bySelector = new Map(
      entries.map((entry) => [
        entry.selector,
        {
          selector: entry.selector,
          kind: entry.kind,
          removedOn: {
            production: { pages: 0, units: 0 },
            new: { pages: 0, units: 0 },
          },
        },
      ]),
    );
  }

  /**
   * A side with no removals at all is a report written before ticket 63, or a
   * side that was not cut. Both read as zero, which is the over-reporting
   * direction.
   *
   * A removal for a selector that is no longer in the list is dropped: it
   * belongs to no entry, and inventing an entry for it would compare a rule
   * against a rule that was deleted.
   *
   * @param {{ production?: import('./contract.mjs').RegionRemoval[], new?: import('./contract.mjs').RegionRemoval[] }} sides
   */
  addPage(sides) {
    for (const side of SIDES) {
      for (const removal of sides[side] ?? []) {
        const region = this.bySelector.get(removal.selector);
        if (!region) continue;
        region.removedOn[side].pages += 1;
        region.removedOn[side].units += removal.units;
      }
    }
  }

  /** @returns {RegionCoverage[]} */
  all() {
    return [...this.bySelector.values()];
  }
}

/**
 * @param {RegionCoverage} region
 * @returns {SideCount} The two sides added up. A legacy-only region is on one
 *   host only, so "did it match at all" is a question about the pair.
 */
function total(region) {
  return {
    pages: region.removedOn.production.pages + region.removedOn.new.pages,
    units: region.removedOn.production.units + region.removedOn.new.units,
  };
}

/** @param {string | null | undefined} store */
const scopeOf = (store) => store ?? 'every store';

/**
 * The reason the two runs cannot be compared, or `null`.
 *
 * @param {{ store?: string | null, regions?: RegionCoverage[] } | null} previous
 * @param {{ store?: string | null, regions: RegionCoverage[] }} current
 * @returns {string | null}
 */
export function whyNotComparable(previous, current) {
  if (!previous) {
    return 'No previous snapshot. Excluded-region coverage is compared from the next run.';
  }
  if (!previous.regions) {
    return (
      'The previous snapshot holds no excluded-region coverage, so it is older than ' +
      'ticket 64. Coverage is compared from the next run.'
    );
  }
  if ((previous.store ?? null) !== (current.store ?? null)) {
    return (
      `The previous snapshot covers ${scopeOf(previous.store)} and this run covers ` +
      `${scopeOf(current.store)}. Excluded-region coverage is not compared across ` +
      'two scopes: the stores this run left out would read as stores that stopped ' +
      'matching.'
    );
  }
  return null;
}

/**
 * @typedef {object} CoverageChange
 * @property {string} selector
 * @property {'unchanged' | 'stopped-matching' | 'started-matching' | 'narrowed' | 'widened' | 'new-entry' | 'left-the-list'} verdict
 * @property {SideCount | null} was
 * @property {SideCount | null} now
 */

/**
 * @param {SideCount} was
 * @param {SideCount} now
 * @returns {CoverageChange['verdict']}
 */
function verdictFor(was, now) {
  if (was.pages === now.pages) return 'unchanged';
  if (now.pages === 0) return 'stopped-matching';
  if (was.pages === 0) return 'started-matching';
  return now.pages < was.pages ? 'narrowed' : 'widened';
}

/**
 * Every entry of both runs, in the current run's order, with the entries only the
 * previous run had after them.
 *
 * @param {RegionCoverage[]} previous
 * @param {RegionCoverage[]} current
 * @returns {CoverageChange[]}
 */
export function coverageChanges(previous, current) {
  const before = new Map(previous.map((region) => [region.selector, region]));

  /** @type {CoverageChange[]} */
  const changes = current.map((region) => {
    const was = before.get(region.selector);
    return was
      ? {
          selector: region.selector,
          verdict: verdictFor(total(was), total(region)),
          was: total(was),
          now: total(region),
        }
      : { selector: region.selector, verdict: 'new-entry', was: null, now: total(region) };
  });

  const now = new Set(current.map((region) => region.selector));
  for (const region of previous) {
    if (now.has(region.selector)) continue;
    changes.push({
      selector: region.selector,
      verdict: 'left-the-list',
      was: total(region),
      now: null,
    });
  }

  return changes;
}

/**
 * The words each verdict is worth saying. `unchanged` has none: a run where
 * nothing moved says nothing, so the lines that do appear are read.
 *
 * @type {Record<CoverageChange['verdict'], (change: CoverageChange) => string | null>}
 */
const LINES = {
  unchanged: () => null,
  'stopped-matching': (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, and on ${change.now.pages} now. ` +
    'The entry has stopped matching, and its region is back in the log. ' +
    'An anchor on a campaign stops matching when the campaign changes.',
  'started-matching': (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, and on ${change.now.pages} now. ` +
    'The entry has started matching.',
  narrowed: (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, and on ${change.now.pages} now. ` +
    'The entry matches less than it did.',
  widened: (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, and on ${change.now.pages} now. ` +
    'The entry matches more than it did.',
  'new-entry': (change) =>
    `is new in the list, and it was removed on ${change.now.pages} pages. ` +
    'The previous snapshot holds no number to compare.',
  'left-the-list': (change) =>
    `is no longer in the list. It was removed on ${change.was.pages} pages in the previous snapshot.`,
};

/**
 * What moved between the two runs, as numbers and verdicts rather than as words.
 *
 * The snapshot holds this, and each surface writes its own prose from it: the
 * crawl speaks Simplified Technical English and the dashboard speaks Dutch. Two
 * translations of one sentence would drift; two readings of one verdict cannot.
 *
 * `changes` holds every entry, `unchanged` ones as well, so a reader can see that
 * an entry was compared and did not move.
 *
 * @param {{ store?: string | null, regions?: RegionCoverage[] } | null} previous
 * @param {{ store?: string | null, regions: RegionCoverage[] }} current
 * @returns {{ reason: string | null, changes: CoverageChange[] }}
 */
export function coverageDelta(previous, current) {
  const reason = whyNotComparable(previous, current);
  return {
    reason,
    changes: reason ? [] : coverageChanges(previous.regions, current.regions),
  };
}

/**
 * One line for each entry that moved, and one line for the reason the two runs
 * cannot be compared. An empty list means every entry matched what it matched
 * before, so a quiet run stays quiet and the lines that do appear are read.
 *
 * @param {{ reason: string | null, changes: CoverageChange[] }} delta
 * @returns {string[]}
 */
export function coverageLines({ reason, changes }) {
  if (reason) return [reason];

  return changes
    .map((change) => {
      const words = LINES[change.verdict](change);
      return words && `${change.selector}: ${words}`;
    })
    .filter((line) => line !== null);
}

/**
 * @param {{ store?: string | null, regions?: RegionCoverage[] } | null} previous
 * @param {{ store?: string | null, regions: RegionCoverage[] }} current
 * @returns {string[]}
 */
export function coverageReport(previous, current) {
  return coverageLines(coverageDelta(previous, current));
}
