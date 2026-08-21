/**
 * One page against its **sibling page** — the same page in the other store of its
 * language block (`CONTEXT.md` → *Language blocks*).
 *
 * The block list answers *which page*; this answers *where on it*. It is the same
 * reading one step down: two stores on one side, in document order.
 *
 * **Two readings and not a fifth comparison** (ticket 07). Production's two stores, which
 * is the reading this tab has always drawn, and **the new site's two stores** beside it.
 * The second one is here for one sentence the first cannot say: where production varied
 * and the new site does not, the migration lost a store difference and one store now
 * shows the other's words. `Check` stays the closed family `text | links | images | meta`
 * and neither reading is a member of it.
 *
 * It stays in `web/` beside `blocks.mjs` for the reason that file gives: ADR 0001 asks
 * three questions and this fails the third, because only the web layer reads it.
 *
 * Everything here is **decided as a value** and rendered by nothing, in the manner of
 * `explainScope()`. `SiblingView.jsx` chooses markup and tone and nothing else.
 */

import { diffRows } from '../../../compare/text.mjs';
import { flattenedUnits } from './flattening.mjs';

/** @typedef {import('../../../compare/contract.mjs').ContentUnit} ContentUnit */
/** @typedef {import('./blocks.mjs').MatchRule} MatchRule */

/**
 * A row of this reading: one block, both stores.
 *
 * **`class`, `finding` and `decidable` are permanently null and false**, and they are
 * fields rather than absences on purpose. A block difference is a display-only
 * difference — no id, no override, no place in a bar — so the three answers can never
 * be anything else, and writing them down is what lets `collapses()` read this row
 * without a second predicate being invented for it.
 *
 * @typedef {object} SiblingRow
 * @property {string} key    `b<n>` for a block this store has, `s<n>` for one only the
 *                           sibling has, and both prefixed `n` on the **new site's**
 *                           reading — `nb<n>`, `ns<n>`. The prefix is what keeps two
 *                           readings of one page pair in one document from carrying the
 *                           same anchor twice, and a duplicate anchor is a jump that
 *                           lands on whichever row the browser met first.
 *
 *                           **No scheme here a link can name**: a finding link names
 *                           `finding-<digest>` and a content row names `p<n>` or `n<n>`,
 *                           so no landing can reach a row on this tab — which is right,
 *                           because there is no finding id to land on.
 * @property {boolean} equal Both stores have the block and their `norm` is the same
 *                           string. The renderer must not diff it.
 *
 *                           **`norm` only, so a tag change reads as agreement here.**
 *                           `diffRows()` pairs two blocks whose text matches but whose
 *                           tag or heading level does not (`EXACT_PAIR_CLASSES`), and
 *                           such a row is `equal`, collapses, and is drawn undiffed — an
 *                           `h2` against a `p` is not reported. That is ticket 02's
 *                           norm-only identity held to deliberately: a block difference
 *                           on this tab is a difference in **words**, and structure is
 *                           axis A's, where `tag-changed` is a class with a finding id.
 *                           The exclusion is written down because the tab's brief is
 *                           *where the two stores stop agreeing*, and this is one place
 *                           it stays quiet.
 * @property {ContentUnit | null} here  This store's block.
 * @property {ContentUnit | null} there The sibling's.
 * @property {boolean} flattened The two stores diverge here and **the new site says one
 *                           thing on both** — a store difference the migration lost
 *                           (`CONTEXT.md` → *Flattened store difference*). It is
 *                           `false` on every row of the new site's own reading, where the
 *                           question does not arise, and on a row nothing was aligned for.
 *
 *                           **A divergence and not a cause.** A store-scoped mechanism
 *                           renders no HTML, so the row may say that production varied
 *                           here and the new site does not, and never why production
 *                           varied. It is not `work` either: the defect, where there is
 *                           one, is the axis-A finding on the store that lost its words,
 *                           and the decision stays there.
 * @property {null} class
 * @property {null} finding
 * @property {false} decidable
 */

/**
 * One reading: the two stores of the block, on one side.
 *
 * @typedef {object} StoreSides
 * @property {'production' | 'the new site'} side The side compared on both stores,
 *   stated rather than implied — `CONTEXT.md`'s own two names for the sides.
 * @property {boolean} measured Whether there was anything to compare. `false` where the
 *   sibling page has no report for this side, or where either store's page holds no
 *   content unit on it. It is the block list's `unmeasured` said about one page, and it
 *   must never read as agreement.
 * @property {SiblingRow[]} rows In **this store's** document order, and empty where
 *   nothing was measured.
 *
 * @typedef {object} SiblingReading
 * @property {{ store: string, page: string, rule: MatchRule }} sibling The matched
 *   sibling, and the rule that matched it, carried through as data in the manner a seed
 *   cell's `provenance` is.
 * @property {StoreSides} production The first reading, and the one the tab has always
 *   drawn.
 * @property {StoreSides} newSite The second reading. The two are the **same shape**,
 *   because they are the same reading of two sides — a flat production and a nested new
 *   site would have the renderer build one of them back. It is drawn **beside**
 *   production's and never instead of it: the flattening is a statement about both sides
 *   at once, so a reader who cannot see both cannot check it.
 * @property {number} flattening How many rows of the production reading are flattened.
 *   A count, where a row's `flattened` is a yes or no — one word, one meaning, in the
 *   manner `CONTEXT.md` keeps `canDecide` apart from `decidable`. It counts content units
 *   and never findings, and it is what lifts a page pair up the block list.
 */

/**
 * The whole reading the sibling tab draws, as values.
 *
 * @param {object} input
 * @param {ContentUnit[]} input.here  This store's **production** content units.
 * @param {ContentUnit[] | null} [input.hereNew] This store's **new-site** content units.
 *   Absent or `null` leaves the second reading unmeasured and nothing flattened: with no
 *   new site to look at, *and the new site does not* is a sentence nobody may utter.
 * @param {{ store: string, page: string, rule: MatchRule, units: ContentUnit[] | null,
 *   newUnits?: ContentUnit[] | null } | null} input.sibling The matched sibling with its
 *   content units on both sides, and `null` where no sibling was matched.
 * @returns {SiblingReading | null} `null` where there is no sibling, so that the tab is
 *   **absent and not empty**: a tab that draws itself and says there is nothing to
 *   compare is a tab an editor opens once per page to learn nothing.
 */
export function siblingReading({ here, hereNew = null, sibling }) {
  if (!sibling) return null;

  const there = sibling.units;
  const thereNew = sibling.newUnits ?? null;
  // Three ways there is nothing to compare, and they are one answer. A sibling with no
  // production report, and a page either store answered 200 for and found empty, are
  // different facts about why — and the block list already spends `unmeasured` on all
  // of them, for the reason it gives: nothing was compared, so nothing is claimed.
  const measured = Boolean(here?.length) && Boolean(there?.length);
  const measuredNew = Boolean(hereNew?.length) && Boolean(thereNew?.length);

  /*
   * Which of this store's production units the migration flattened, decided by the one
   * function that decides it — the dashboard's ordering asks the same question of the
   * same code, so a page can never be lifted up the block list for a reason the tab it
   * lifts to does not draw.
   *
   * It is a `Set` of the units themselves and not of their indexes: the rows below come
   * from `diffRows()`, which hands back the units, so membership is asked on the thing
   * and not on a position in a list.
   */
  const flattened = new Set(
    flattenedUnits({
      here: { production: here, new: hereNew },
      there: { production: there, new: thereNew },
    }).map((one) => one.here),
  );

  return {
    sibling: { store: sibling.store, page: sibling.page, rule: sibling.rule },
    production: {
      side: 'production',
      measured,
      rows: measured ? rowsOf(here, there, flattened) : [],
    },
    newSite: {
      side: 'the new site',
      measured: measuredNew,
      rows: measuredNew ? rowsOf(hereNew, thereNew, new Set(), 'n') : [],
    },
    flattening: flattened.size,
  };
}

/**
 * The two stores aligned into rows, in this store's document order.
 *
 * **It is `diffRows()` with the classification dropped**, and both halves of that are
 * deliberate.
 *
 * Reused, because *which two blocks are the same block* must have one definition in
 * this repo. That function is where ticket 34's ordering defect was fixed — a row only
 * one side has is read **in place** and not collected at the end — and a second
 * alignment written here would be a second place for that to come apart.
 *
 * Dropped, because a **block difference has no class**. `text-missing` and `text-added`
 * name a direction, `lost` and `added` are the tones a direction is drawn in, and
 * neither store lost anything: they differ. The classes belong to axis A, where
 * production is the reference and a difference is a defect. Here the two stores are
 * equals.
 *
 * Production orders the document because this store's page is the one the editor is
 * reading, and for no stronger reason than that. Read from the sibling's own page the
 * order is the sibling's, and the same blocks pair up either way.
 *
 * @param {ContentUnit[]} here
 * @param {ContentUnit[]} there
 * @param {Set<ContentUnit>} [flattened] This store's production units the migration
 *   flattened. The new site's own reading passes none: *the new site agrees here* is not
 *   a thing to say about a row of the new site.
 * @param {string} [prefix] What each row's anchor starts with, so that the two readings
 *   of one page pair do not both anchor a row at `b0`.
 * @returns {SiblingRow[]}
 */
function rowsOf(here, there, flattened = new Set(), prefix = '') {
  return diffRows({ elements: here }, { elements: there }).map((row) => ({
    key: prefix + (row.prod ? `b${row.prod.index}` : `s${row.new.index}`),
    equal: row.prod !== null && row.new !== null && row.prod.norm === row.new.norm,
    here: row.prod,
    there: row.new,
    flattened: flattened.has(row.prod),
    class: null,
    finding: null,
    decidable: false,
  }));
}
