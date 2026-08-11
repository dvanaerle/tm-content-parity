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
 * that large. The generic Magezon wrapper on production holds the whole of
 * `/downloads`: 190 content units on a page of 182 (2026-08-10, after the fold;
 * 358 of 359 before it). Nothing else in the pipeline reports that.
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
 * 100 is above the widest measured entry (50) and was below the near-miss the ADR
 * warns about (139 units on `/overkapping`).
 *
 * **The second half of that no longer holds.** Ticket 67 folded inline links, and a
 * folded block is one unit where the parts were several. Re-measured on 2026-08-10,
 * the same Magezon wrapper holds **91** units on `/overkapping`, under this ceiling
 * instead of over it. The ceiling still excludes the wrapper on `/downloads` (190),
 * and the number is not moved here: it is a decision of ticket 63 and ADR 0009, and
 * it needs its own ticket with its own measurement. Written down, not solved.
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
    // Re-measured 2026-08-10 after ticket 67 folded inline links: both counts are
    // unchanged. The grid holds tile titles and filter labels, and each of those is
    // already one block with one link in it.
    measured: {
      pages: ['overkapping', 'carport', 'veranda'],
      production: 50,
      new: 21,
    },
    // 60% above the measurement, for a category with a wider catalogue page.
    maxUnits: 80,
  },
  {
    // The hook production puts on the block itself (ticket 90).
    //
    // This entry used to anchor on the campaign option ids in a link target,
    // because the block carried no stable class — its wrapper class is a
    // generated hash, and a different hash in each store — and no stable text,
    // because it is translated per store. That anchor worked and it dated: the
    // next campaign has different ids, the entry stops matching, and the banner
    // returns as findings. Ticket 89 measured the alternative, a one-sided text
    // pattern, and refused it: the pattern is Dutch, so it is blind in `de`,
    // `fr` and `be_fr`, and it cannot reach the links at all.
    //
    // The cheap fix was neither. Production marks the block in the Magento CMS,
    // and an id is the same signal in all six stores that the option ids were,
    // without naming a campaign. It is the product grid's kind of anchor.
    //
    // The id repeats on the page — the desktop and the mobile copy of one block
    // — so it is invalid HTML that the extractor reads with `querySelectorAll`
    // semantics and therefore counts twice. A class would be correct markup and
    // would need no other change here.
    selector: '#campaign-banner',
    kind: 'legacy-only',
    reason:
      'De campagnebanner. Eén gedeeld Magento-blok, in alle zes de winkels, op '
      + 'bijna elke pagina. Een redacteur schrijft de banner wel, dus '
      + 'niet-redactioneel is het niet. Maar de nieuwe site krijgt hem niet, en '
      + 'daardoor maakt hetzelfde blok op elke pagina dezelfde bevindingen die '
      + 'niemand kan oplossen. Productie markeert het blok zelf, dus het anker is '
      + 'niet campagnespecifiek: de volgende campagne heeft andere teksten, andere '
      + 'links en een andere looptijd, maar houdt dezelfde haak, en deze regel '
      + 'blijft passen zonder commit. De haak zit in het CMS-blok. Wie een nieuw '
      + 'blok bouwt zonder haak laat de banner terugkomen als bevindingen, en de '
      + 'dekkingscontrole meldt dat in één regel.',
    // Measured 2026-08-11 against live production by
    // `crawl/probes/probe-promo-banner.mjs`: six stores, the three pages below
    // plus `overkapping` and four controls, so **48 page-store pairs and not the
    // corpus**. Two matches on production on every pair — the desktop and the
    // mobile version of one banner — and zero on the new site, which is what
    // `legacy-only` means. `production: 8` is the nl count; the five other stores
    // remove 7.
    //
    // Identical to the option-id selector it replaces in every column — matches,
    // units, links and images — on all 48, so the swap is not believed to move any
    // number. The corpus-wide probe that would raise that from 48 to 816,
    // `probe-promo-banner-corpus.mjs`, last ran 2026-08-10 against the **old**
    // selector and has not been re-run.
    measured: {
      pages: ['carport', 'terrasoverkapping', '(home)'],
      production: 8,
      new: 0,
    },
    // The whole corpus removes 7, 8 or 16 units, and nothing else
    // (`crawl/probes/probe-promo-banner-corpus.mjs`, 2026-08-10, 811 of 816
    // comparable pages; the other five hold no banner). 16 is three nl pages that
    // carry the **same** block twice: `glazen-schuifwand`, `shading-panel` and
    // `steel-look-glazen-schuifwand`, at 4 matches of 8.
    //
    // So the default cap of 20 would hold today and fail on a third placement,
    // and a correct selector must not stop the crawl. 30 allows three placements.
    // It is still far below the wrong-selector sizes the cap defends against: the
    // generic Magezon wrapper holds 91 units on `/overkapping` and 190 on
    // `/downloads`.
    maxUnits: 30,
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
