/**
 * Regions that are deliberately outside the content parity log (ticket 63).
 *
 * A region is removed **at extraction**, while the DOM still exists. The extract
 * carries no DOM path, so a check cannot say which region a unit came from.
 * Ticket 27 named that obstacle, and it decides the place. See
 * `docs/adr/0003-regions-are-excluded-at-extraction.md`.
 *
 * This module is a pure rule with no DOM in it. `crawl/` cuts the region, and
 * `web/` lists it. Two stages read it, so ADR 0001 puts it in `shared/`.
 *
 * Each entry carries the four things the ADR asks for:
 *
 * - `kind` — the reason, from a closed vocabulary of two.
 * - `reason` — the prose the web build shows.
 * - `measured` — the pages it was measured on, and the units it removes on each
 *   side. The `.magezon-builder` near-miss was found by measurement.
 * - `maxUnits` — the cap. The crawl fails above it.
 */

/**
 * The cap for an entry that declares none. No editable region on this site is
 * that large. The generic Magezon wrapper on production would have removed 358
 * units of 359 on `/downloads`. Nothing else in the pipeline reports that.
 */
export const DEFAULT_MAX_UNITS = 20;

/**
 * No entry may declare a cap above this, whatever it measured.
 *
 * The per-entry cap is written by hand beside a measurement that is also written
 * by hand. On its own that is only "type the number twice". This ceiling is the
 * part an author cannot raise: a region wider than this needs a new decision in
 * the ADR, not a larger number in the list.
 *
 * 100 is above the widest measured entry (50) and below the near-miss the ADR
 * warns about (139 units on `/overkapping`).
 */
export const ABSOLUTE_MAX_UNITS = 100;

/** @type {ReadonlyArray<'non-editorial' | 'legacy-only'>} */
export const REGION_KINDS = ['non-editorial', 'legacy-only'];

/** The ADR asks for a measurement on three pages. */
const MEASURED_PAGES = 3;

/**
 * @typedef {object} ExcludedRegion
 * @property {string} selector
 * @property {'non-editorial' | 'legacy-only'} kind
 * @property {string} reason
 * @property {{ pages: string[], production: number, new: number }} measured
 * @property {number} [maxUnits]  Defaults to `DEFAULT_MAX_UNITS`.
 */

/** @type {ExcludedRegion[]} */
export const EXCLUDED_REGIONS = [
  {
    selector: '#amasty-shopby-product-list',
    kind: 'non-editorial',
    reason:
      'Het productoverzicht op een categoriepagina. De catalogus maakt de '
      + 'tegeltitels, de filterlabels, het aantal resultaten en de sorteerknop. '
      + 'Niemand schrijft ze. Een verschil erin is dus geen redactiewerk. '
      + 'Productie zet de tegeltitel in een tag die de extractie nooit las. '
      + 'Daardoor leek productie negen tegels kwijt die het nooit had.',
    // Measured 2026-08-07 by `crawl/probes/probe-excluded-regions.mjs`. One match
    // on each host, on all three pages, with the same count on all three.
    measured: {
      pages: ['overkapping', 'carport', 'veranda'],
      production: 50,
      new: 21,
    },
    // 60% above the measurement, for a category with a wider catalogue page.
    maxUnits: 80,
  },
];

/**
 * @param {ExcludedRegion} entry
 * @returns {number}
 */
export function capFor(entry) {
  return entry.maxUnits ?? DEFAULT_MAX_UNITS;
}

/**
 * The words the crawl fails with. They live beside the list they defend, so the
 * cap and its explanation are in one file.
 *
 * @param {ExcludedRegion} entry
 * @param {{ units: number, matches: number, where: string }} found
 * @returns {string}
 */
export function capBreachMessage(entry, { units, matches, where }) {
  return (
    `${where}: the excluded region ${entry.selector} holds ${units} content units. `
    + `Its cap is ${capFor(entry)}. The selector matched ${matches} `
    + `time${matches === 1 ? '' : 's'}. `
    + 'A region that large is a wrong selector. The crawl stops here. '
    + 'See docs/adr/0003-regions-are-excluded-at-extraction.md.'
  );
}

/**
 * The bar for an entry, as a function, because a rule with no test is not a rule.
 *
 * It runs on the committed list at import, and again on a list that a caller
 * gives the extractor. A test list and a probe list get the same bar as the
 * committed one, so no path into the extractor skips it.
 *
 * @param {ExcludedRegion[]} entries
 * @param {string} [source] Where the list came from, for the message.
 * @returns {ExcludedRegion[]} The same list, so a caller can validate in place.
 */
export function validateRegions(entries, source = 'shared/excluded-regions.mjs') {
  for (const entry of entries) {
    const at = `${source}: ${entry.selector}`;

    if (!REGION_KINDS.includes(entry.kind)) {
      throw new Error(`${at} has kind "${entry.kind}". The vocabulary is ${REGION_KINDS.join(' or ')}.`);
    }
    if (!entry.reason) {
      throw new Error(`${at} has no reason. An excluded region says why.`);
    }
    if ((entry.measured?.pages?.length ?? 0) < MEASURED_PAGES) {
      throw new Error(
        `${at} was measured on ${entry.measured?.pages?.length ?? 0} page(s). `
        + `The bar is ${MEASURED_PAGES}.`
      );
    }

    const widest = Math.max(entry.measured.production, entry.measured.new);
    if (capFor(entry) < widest) {
      throw new Error(
        `${at} has a cap of ${capFor(entry)} and a measurement of ${widest}. `
        + 'The cap would throw on its own evidence.'
      );
    }
    if (capFor(entry) > ABSOLUTE_MAX_UNITS) {
      throw new Error(
        `${at} declares a cap of ${capFor(entry)}. The ceiling is ${ABSOLUTE_MAX_UNITS}. `
        + 'A region wider than the ceiling needs a decision in the ADR, not a larger number here.'
      );
    }
  }
  return entries;
}

validateRegions(EXCLUDED_REGIONS);
