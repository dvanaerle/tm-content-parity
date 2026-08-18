/**
 * One page against its **sibling page** — the same page in the other store of its
 * language block (`CONTEXT.md` → *Language blocks*).
 *
 * The block list answers *which page*; this answers *where on it*. It is the same
 * reading one step down: two stores on one side, compared on **production**, in
 * document order.
 *
 * It stays in `web/` beside `blocks.mjs` for the reason that file gives: ADR 0001 asks
 * three questions and this fails the third, because only the web layer reads it.
 *
 * Everything here is **decided as a value** and rendered by nothing, in the manner of
 * `explainScope()`. `SiblingView.jsx` chooses markup and tone and nothing else.
 */

import { diffRows } from '../../../compare/text.mjs';

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
 *                           sibling has. **Neither scheme a link can name**: a finding
 *                           link names `finding-<digest>` and a content row names
 *                           `p<n>` or `n<n>`, so no landing can reach a row here — which
 *                           is right, because there is no finding id to land on.
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
 * @property {null} class
 * @property {null} finding
 * @property {false} decidable
 */

/**
 * @typedef {object} SiblingReading
 * @property {{ store: string, page: string, rule: MatchRule }} sibling The matched
 *   sibling, and the rule that matched it, carried through as data in the manner a seed
 *   cell's `provenance` is.
 * @property {'production'} side The side compared on both stores, stated rather than
 *   implied — the same word the block list uses.
 * @property {boolean} measured Whether there was anything to compare. `false` where the
 *   sibling page has no production report, or where either store's page holds no content
 *   unit. It is the block list's `unmeasured` said about one page, and it must never read
 *   as agreement.
 * @property {SiblingRow[]} rows In **this store's** document order, and empty where
 *   nothing was measured.
 */

/**
 * The whole reading the sibling tab draws, as values.
 *
 * @param {object} input
 * @param {ContentUnit[]} input.here  This store's **production** content units.
 * @param {{ store: string, page: string, rule: MatchRule, units: ContentUnit[] | null } | null}
 *   input.sibling The matched sibling with its production content units, and `null`
 *   where no sibling was matched.
 * @returns {SiblingReading | null} `null` where there is no sibling, so that the tab is
 *   **absent and not empty**: a tab that draws itself and says there is nothing to
 *   compare is a tab an editor opens once per page to learn nothing.
 */
export function siblingReading({ here, sibling }) {
  if (!sibling) return null;

  const there = sibling.units;
  // Three ways there is nothing to compare, and they are one answer. A sibling with no
  // production report, and a page either store answered 200 for and found empty, are
  // different facts about why — and the block list already spends `unmeasured` on all
  // of them, for the reason it gives: nothing was compared, so nothing is claimed.
  const measured = Boolean(here?.length) && Boolean(there?.length);

  return {
    sibling: { store: sibling.store, page: sibling.page, rule: sibling.rule },
    side: 'production',
    measured,
    rows: measured ? rowsOf(here, there) : [],
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
 * @returns {SiblingRow[]}
 */
function rowsOf(here, there) {
  return diffRows({ elements: here }, { elements: there }).map((row) => ({
    key: row.prod ? `b${row.prod.index}` : `s${row.new.index}`,
    equal: row.prod !== null && row.new !== null && row.prod.norm === row.new.norm,
    here: row.prod,
    there: row.new,
    class: null,
    finding: null,
    decidable: false,
  }));
}
