/**
 * The one viewport the log reads a page at, and the markup conventions that hide a
 * block at it (ticket 69).
 *
 * Production sends the desktop and the mobile version of some blocks in the same
 * HTML. The extraction is an HTTP fetch and a non-rendering parse, so it has no
 * computed style and cannot see that a block is hidden: it reads both copies, and
 * the second one pairs against nothing.
 *
 * So the log must choose a width, and it chooses **desktop**. This module is the
 * one place that says so. It is a pure rule with no DOM in it: `crawl/` cuts the
 * copy and `web/` states the consequence, and ADR 0001 puts a rule two stages read
 * in `shared/`.
 *
 * See `docs/adr/0020-the-log-reads-one-viewport.md`.
 */

import { ABSOLUTE_MAX_UNITS, DEFAULT_MAX_UNITS } from './excluded-regions.mjs';

/** The width the log compares at, as the word a reader uses for it. */
export const CANONICAL_VIEWPORT = 'desktop';

/**
 * And as the number, because the word alone cannot decide a selector.
 *
 * A breakpoint utility hides a block inside a **band**, not above a threshold.
 * Magezon's five bands, read from production's stylesheet on 2026-08-18:
 *
 * | class | hidden at |
 * | --- | --- |
 * | `mgz-hidden-xs` | `max-width: 575px` |
 * | `mgz-hidden-sm` | `576px`–`767px` |
 * | `mgz-hidden-md` | `768px`–`991px` |
 * | `mgz-hidden-lg` | `992px`–`1200px` |
 * | `mgz-hidden-xl` | `min-width: 1200px` |
 *
 * So which class hides a block *at the canonical viewport* depends entirely on the
 * number, and only the top band answers to a desktop.
 *
 * The token is not even stable across one page. The theme is Bootstrap 3, whose scale
 * has four tiers, and its `.hidden-lg` is `min-width: 1200px` — the band Magezon
 * calls `xl`. So `hidden-lg` and `mgz-hidden-lg` disagree about whether a desktop
 * reader sees the block. Only the stylesheet says which is which, which is why a
 * convention below must name its framework.
 *
 * 1280 is a desktop width, and it is inside the top band rather than on its edge.
 * The band, and not this number, is what the selector is chosen by, so a later move
 * to 1440 or 1920 changes nothing here — which is the point of writing the band down.
 */
export const CANONICAL_VIEWPORT_WIDTH = 1280;

/** The ADR asks for a measurement on three pages, as ADR 0003 does. */
const MEASURED_PAGES = 3;

/**
 * @typedef {object} ResponsiveConvention
 * @property {string} selector
 * @property {string} framework  Whose convention it is, because a second front end brings its own.
 * @property {{ pages: string[], production: number, new: number }} measured
 * @property {number} [maxUnits]  Defaults to `DEFAULT_MAX_UNITS`.
 */

/**
 * Every convention this rule covers, with the pages it was measured on.
 *
 * The list is deliberately short. A convention earns a place by being **measured**
 * to hide one copy of a block that the page also sends for the other width — not by
 * looking like a breakpoint utility.
 *
 * @type {ResponsiveConvention[]}
 */
export const HIDDEN_AT_CANONICAL_VIEWPORT = [
  {
    // The only one of Magezon's five utilities whose band contains
    // `CANONICAL_VIEWPORT_WIDTH`. The mobile copy of a block carries `lg` and `xl`
    // together — measured on 175 duplicated copies, of which **none** carried
    // either alone — so naming the top band takes every real second copy and
    // leaves the laptop band alone.
    //
    // `[class*=]` and not `.mgz-hidden-xl`, because Magezon also emits the token
    // inside longer generated class names on the same element.
    selector: '[class*="mgz-hidden-xl"]',
    framework: 'Magezon Page Builder',
    // Measured 2026-08-18 against live production and the new site by
    // `crawl/probes/probe-canonical-viewport-corpus.mjs`, over the whole seed list
    // in every store: 816 of 819 comparable pairs, of which **264 carry a match**,
    // for 1,318 units in all.
    //
    // `production: 40` is `shading-panel`, the widest page in the corpus. `/downloads`
    // removes 26: it sends a table for a desktop and a card list for a phone.
    //
    // Every match was checked against a real browser at 1280px by
    // `crawl/probes/probe-canonical-viewport-visible.mjs`: 119 matches over the widest
    // 19 pairs, **0 of them visible**. That is the premise the extraction cannot test
    // for itself.
    //
    // `new: 0` is not an omission. The new site sends no second copy anywhere in
    // the corpus — its `data-content-text-desktop` sits on **both** copies of a
    // repeated line, so it is a text style and not a hide-one convention. The rule
    // is one-sided because the duplication is, and the corpus measurement is how
    // that claim stays checkable.
    measured: {
      pages: [
        'shading-panel',
        'downloads',
        'lighting-system/productinformatie',
        'overkapping',
        'carport',
      ],
      production: 40,
      new: 0,
    },
    // 50% above the widest page in the corpus. The cap must not fail the run on a
    // correct selector — ticket 64 learned that from a banner that appears three
    // times on three nl pages — and a page that removes 60 units is a wrapper and
    // not a set of second copies. It was 40 first, against a widest-measured 40,
    // which is a guard with a margin of zero.
    maxUnits: 60,
  },
];

/**
 * @param {ResponsiveConvention} convention
 * @returns {number}
 */
export function capFor(convention) {
  return convention.maxUnits ?? DEFAULT_MAX_UNITS;
}

/**
 * The words the crawl fails with, beside the list they defend.
 *
 * They are not ADR 0003's words. That message says a region is not editor work;
 * this one says the log lost a reader's only copy of something, which is the
 * failure this cap exists to catch.
 *
 * @param {ResponsiveConvention} convention
 * @param {{ units: number, matches: number, where: string }} found
 * @returns {string}
 */
export function capBreachMessage(convention, { units, matches, where }) {
  return (
    `${where}: ${convention.selector} holds ${units} content units at the ` +
    `${CANONICAL_VIEWPORT} viewport. Its cap is ${capFor(convention)}. The selector ` +
    `matched ${matches} time${matches === 1 ? '' : 's'}. ` +
    'A match that large is not one copy of a block, so dropping it would take ' +
    'content no reader has anywhere else. The crawl stops here. ' +
    'See docs/adr/0020-the-log-reads-one-viewport.md.'
  );
}

/**
 * The bar for a convention, as a function, because a rule with no test is not a rule.
 *
 * It runs on the committed list at import, and again on a list a caller gives the
 * extractor, so no path into the extraction skips it.
 *
 * @param {ResponsiveConvention[]} conventions
 * @param {string} [source]
 * @returns {ResponsiveConvention[]} The same list, so a caller can validate in place.
 */
export function validateConventions(conventions, source = 'shared/canonical-viewport.mjs') {
  for (const convention of conventions) {
    const at = `${source}: ${convention.selector}`;

    if (!convention.framework) {
      throw new Error(
        `${at} names no framework. A convention belongs to a front end, and the next ` +
          'front end brings its own.',
      );
    }
    if ((convention.measured?.pages?.length ?? 0) < MEASURED_PAGES) {
      throw new Error(
        `${at} was measured on ${convention.measured?.pages?.length ?? 0} page(s). ` +
          `The bar is ${MEASURED_PAGES}.`,
      );
    }

    const widest = Math.max(convention.measured.production, convention.measured.new);
    if (capFor(convention) < widest) {
      throw new Error(
        `${at} has a cap of ${capFor(convention)} and a measurement of ${widest}. ` +
          'The cap would throw on its own evidence.',
      );
    }
    if (capFor(convention) > ABSOLUTE_MAX_UNITS) {
      throw new Error(
        `${at} declares a cap of ${capFor(convention)}. The ceiling is ${ABSOLUTE_MAX_UNITS}. ` +
          'A convention wider than the ceiling needs a decision in the ADR, not a larger number here.',
      );
    }
  }
  return conventions;
}

validateConventions(HIDDEN_AT_CANONICAL_VIEWPORT);
