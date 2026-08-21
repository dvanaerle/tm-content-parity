/**
 * A **flattened store difference**: a content unit whose two stores diverge on
 * production and agree on the new site (`CONTEXT.md` → *Language blocks*).
 *
 * It is the one thing the two-store reading can say that neither store's own page can.
 * Production varied the warranty scope on `nl` and `be`, and the new site says one
 * sentence on both — so one store now shows the other's words, and nothing else in this
 * log points at that.
 *
 * **It is a divergence and never a cause.** A store-scoped mechanism — a custom
 * variable, a store-scoped block — renders no HTML, so *why* production varied is not a
 * fact any crawl holds, and 21 of the 111 units measured on 2026-08-21 are a new-site
 * rewrite rather than one store's words winning. What is claimed here is exactly what
 * was seen: production varied here and the new site does not.
 *
 * **Nothing here becomes a finding** (ADR 0017). A block difference is display-only, and
 * 109 of those 111 units are already an ordinary axis-A finding on the store that lost
 * its words. This says why one of them is worth looking at first; the decision stays
 * where the finding is.
 *
 * It lives beside `blocks.mjs` and `sibling.mjs` for the reason those give: ADR 0001 asks
 * three questions and only the web layer reads this.
 */

import { diffRows } from '../../../compare/text.mjs';
import { siblingPages } from './blocks.mjs';
import { siblingOf } from './language-blocks.mjs';

/** @typedef {import('../../../compare/contract.mjs').ContentUnit} ContentUnit */

/**
 * One store's page, both sides of it — the shape `loadExtracts()` hands back and the
 * shape every reading here takes. Either side may be missing: production did not answer
 * 200, or the new site did not, and a reading meets a `null` and says so.
 *
 * @typedef {object} PageSides
 * @property {ContentUnit[] | null} production
 * @property {ContentUnit[] | null} new
 */

/**
 * @typedef {object} FlattenedUnit
 * @property {ContentUnit} here    This store's production unit.
 * @property {ContentUnit} there   The sibling's production unit it pairs with.
 * @property {ContentUnit} newBoth What the new site says in this store. The sibling's
 *   new-site counterpart holds the same `norm` — that is what makes the unit flattened —
 *   so one of the two is carried and not both.
 */

/**
 * The new-site counterpart of each production unit, by the **axis-A** alignment.
 *
 * Keyed on the unit object and not on its index: `diffRows()` hands back the units
 * themselves, and an index is a position in a list that the caller may not be holding.
 *
 * A `regrouped` row is kept, and its counterpart is the first unit of the run. That is
 * what ticket 11's measurement did, so the count on screen is the count in
 * `.scratch/cross-store-reuse/FLATTENING.md` and not a number nobody has checked.
 *
 * @param {PageSides} sides
 * @returns {Map<ContentUnit, ContentUnit>}
 */
function counterparts(sides) {
  /** @type {Map<ContentUnit, ContentUnit>} */
  const map = new Map();
  for (const row of diffRows({ elements: sides.production ?? [] }, { elements: sides.new ?? [] })) {
    if (row.prod && row.new) map.set(row.prod, row.new);
  }
  return map;
}

/**
 * Every flattened store difference on one page pair.
 *
 * **Three alignments, all of them `diffRows()`**, so that *which two blocks are the same
 * block* keeps one definition in this repo: production against production across the two
 * stores, and then production against the new site inside each store. A pair that
 * diverges on the first and whose two counterparts agree through the other two is
 * flattened.
 *
 * A unit one side has no counterpart for is **not** reported. Nothing was aligned, so
 * nothing is claimed — the same answer the block reading spends `unmeasured` on.
 *
 * @param {object} input
 * @param {PageSides} input.here  This store's page.
 * @param {PageSides} input.there The sibling's page.
 * @returns {FlattenedUnit[]} In this store's document order, and empty where either side
 *   of either store has nothing to align.
 */
export function flattenedUnits({ here, there }) {
  const complete = (sides) => Boolean(sides?.production?.length) && Boolean(sides?.new?.length);
  if (!complete(here) || !complete(there)) return [];

  const newHere = counterparts(here);
  const newThere = counterparts(there);

  /** @type {FlattenedUnit[]} */
  const out = [];
  for (const row of diffRows({ elements: here.production }, { elements: there.production })) {
    if (!row.prod || !row.new || row.prod.norm === row.new.norm) continue;

    const mine = newHere.get(row.prod);
    const theirs = newThere.get(row.new);
    if (!mine || !theirs || mine.norm !== theirs.norm) continue;

    out.push({ here: row.prod, there: row.new, newBoth: mine });
  }
  return out;
}

/**
 * How many units each of this store's pages had flattened, over the whole block.
 *
 * It is what orders the dashboard's block list, and it is the same `flattenedUnits()` the
 * sibling tab draws — so a page cannot be lifted up the list for a reason the tab it
 * lifts to does not show.
 *
 * A page with no sibling, or with nothing to align on either side, is **absent from the
 * map** rather than present with a zero. Nothing was measured, so nothing is claimed,
 * and the caller's own default is the one answer for both.
 *
 * @param {object} input
 * @param {import('../../../shared/seed-rows.mjs').SeedRow[]} input.rows The rows of
 *   `data/10-store-seeds.json`.
 * @param {string} input.store
 * @param {(store: string, page: string) => PageSides | null} input.sidesOf One page's
 *   content units, both sides, and `null` for a page no report covers.
 * @returns {Map<string, number>} This store's page key to its flattened unit count, for
 *   the pages that have one.
 */
export function flattenedPages({ rows, store, sidesOf }) {
  /** @type {Map<string, number>} */
  const out = new Map();
  const other = siblingOf(store);
  if (!other) return out;

  for (const match of siblingPages({ rows, store })) {
    if (!match.sibling) continue;

    const here = sidesOf(store, match.page);
    const there = sidesOf(other, match.sibling.page);
    if (!here || !there) continue;

    const count = flattenedUnits({ here, there }).length;
    if (count > 0) out.set(match.page, count);
  }
  return out;
}
