/**
 * The **block reading**: one store's pages against their siblings in the other
 * store of its language block (`CONTEXT.md` → *Language blocks*).
 *
 * It stays in `web/` and not in `shared/`. ADR 0001 asks three questions and this
 * fails the third: only the web layer reads it. The block **vocabulary** fails it for
 * the same reason and sits beside this file, in `./language-blocks.mjs`;
 * `HREFLANG_STORE`, which both `crawl/` and this read, is the half in `shared/`.
 *
 * Everything here is **decided as a value** and rendered by nothing — the precedent
 * is `explainScope()`, which `CONTEXT.md` cites as decided as a value and only
 * rendered by the component.
 */

import { languageOf, siblingOf } from './language-blocks.mjs';

/** @typedef {import('../../../shared/seed-rows.mjs').SeedRow} SeedRow */

/**
 * Which rule matched a sibling. It is carried **on the sibling**, in the manner of
 * a seed cell's `provenance`: it is data, so a wrong pairing can be diagnosed
 * without re-deriving it.
 *
 * @typedef {'alternate' | 'path'} MatchRule
 *
 * @typedef {{ page: string, rule: MatchRule }} Sibling
 *
 * @typedef {object} SiblingMatch
 * @property {string} page This store's page key.
 * @property {Sibling | null} sibling
 */

/**
 * The path the two stores are compared on.
 *
 * `be_fr` shares a host with `be`, so every one of its paths carries a leading
 * `fr/`. That prefix is a **host artefact** and no part of the page: `fr/carport`
 * and `carport` are one page seen from two stores. It comes off here, for the
 * comparison, and nowhere else — it is real in every URL.
 *
 * @param {string} path
 */
const comparablePath = (path) => (path.startsWith('fr/') ? path.slice(3) : path);

/**
 * Every page this store has, with its sibling in the other store of the block.
 *
 * **Two rules, in this order.**
 *
 * 1. The **alternate production declares**. Two stores on one seed row is exactly
 *    that: the row exists because production declared the hreflang alternate
 *    between them, so the sibling is the same page key.
 * 2. **Path equality**, and only where neither page declares an alternate. Both
 *    rules are needed. The Dutch block already aligns on the seed row — 126 rows
 *    carry both cells — while the French block does not, at 28 of 122, and the path
 *    rule recovers 92 more of it.
 *
 * The order is load-bearing: a page that would match by path but declares a
 * different alternate follows the alternate, because production's own claim about
 * its pages outranks a coincidence of spelling.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows The rows of `data/10-store-seeds.json`.
 * @param {string} input.store
 * @returns {SiblingMatch[]}
 */
export function siblingPages({ rows, store }) {
  const other = siblingOf(store);
  if (!other) return [];

  // The sibling's pages that declare no alternate to **this** store, by comparable
  // path. A page whose row carries this store's cell is already matched by rule 1
  // and must not be reachable by rule 2 as well.
  /** @type {Map<string, string>} */
  const byPath = new Map();
  for (const row of rows) {
    const cell = row.stores?.[other];
    if (cell && !row.stores?.[store]) byPath.set(comparablePath(cell.path ?? ''), row.page);
  }

  /** @type {SiblingMatch[]} */
  const out = [];
  for (const row of rows) {
    const cell = row.stores?.[store];
    if (!cell) continue;

    if (row.stores?.[other]) {
      out.push({ page: row.page, sibling: { page: row.page, rule: 'alternate' } });
      continue;
    }

    const found = byPath.get(comparablePath(cell.path ?? ''));
    out.push({ page: row.page, sibling: found ? { page: found, rule: 'path' } : null });
  }
  return out;
}

/**
 * @typedef {object} BlockRow
 * @property {string} page The page key this row is about. On `only-in-sibling` it is
 *   a key of the **sibling** store, which is the one that has the page.
 * @property {'identical' | 'diverged' | 'unmeasured' | 'sibling-absent' | 'only-in-sibling'} kind
 *   One row is one of five things, and they are told apart from each other and not
 *   only from silence. `identical` is an **answer** and the common case, so it has a
 *   word rather than being an empty row; `unmeasured` is what a page with no report
 *   on one side honestly is, and it must never read as agreement.
 * @property {Sibling | null} sibling The matched sibling, where one was matched.
 * @property {number | null} share Of this store's unit texts, the share that appear
 *   exactly in the sibling's. `null` where nothing was measured. It orders a list and
 *   it is **not a score on a finding**.
 * @property {number | null} units This store's production content units on the page.
 *   `null` where nothing was measured, and never `0` — a count of zero is a page that
 *   was read and found empty, which is a different fact from a page nobody read, and
 *   the two must not share a number.
 * @property {number | null} found How many of them appear exactly in the sibling's,
 *   `null` on the same terms as `units`.
 */

/** The three kinds that are a page both stores have, which is what the list ranks. */
export const SHARED_KINDS = new Set(['identical', 'diverged', 'unmeasured']);

/**
 * A row with nothing measured on it, which is three of the five kinds.
 *
 * One function, because the three were written out three times and the shape of *no
 * measurement* is the thing that must not drift between them.
 *
 * @param {string} page
 * @param {BlockRow['kind']} kind
 * @param {Sibling | null} sibling
 * @returns {BlockRow}
 */
const unmeasuredRow = (page, kind, sibling) => ({
  page,
  kind,
  sibling,
  share: null,
  units: null,
  found: null,
});

/**
 * The **agreement share**: how much of this store's page appears in its sibling.
 *
 * Measured over **production**'s content units on **normalised text**, as the share
 * of this store's unit texts that appear exactly in the sibling's. Set membership on
 * the sibling's side: the question is whether the words exist over there, not how
 * many times.
 *
 * It is called **agreement** and never *identity*, because `CONTEXT.md` gives
 * *identity* to the finding id — what makes two differences the same difference. This
 * is how much two pages say the same thing, which is a different question, and two
 * meanings for one word is what that glossary exists to stop.
 *
 * A page with no units has **no share**, rather than a share of one. Dividing zero by
 * zero and calling the answer *agreement* would let a page that answered 200 and
 * carries no content unit claim it agrees word for word with a sibling it has never
 * been compared to — the exact reading `unmeasured` exists to refuse. Nothing was
 * measured, so nothing is claimed.
 *
 * `mutual` is the stricter question the word *identical* needs. `share` is
 * **one-directional**: it asks how much of this store's text is over there, so a page
 * of five units inside a sibling of two hundred scores 1. That is not two pages that
 * agree, it is a short page contained in a long one, and only `mutual` tells them
 * apart — it asks the question both ways, over the sets the share is already measured
 * on.
 *
 * @param {string[]} mine
 * @param {string[]} theirs
 */
function agreementOf(mine, theirs) {
  const over = new Set(theirs);
  const found = mine.filter((text) => over.has(text)).length;
  if (mine.length === 0) return { units: 0, found: 0, share: null, mutual: false };

  const here = new Set(mine);
  return {
    units: mine.length,
    found,
    share: found / mine.length,
    mutual: found === mine.length && [...over].every((text) => here.has(text)),
  };
}

/**
 * @typedef {object} BlockReading
 * @property {string} store The store whose dashboard this reading is drawn on.
 * @property {string} sibling The other store of its block.
 * @property {string | null} language The language the two share.
 * @property {'production'} side The side compared on both stores, stated rather than
 *   implied.
 * @property {{ carriedOver: number }} census The evidence for *this list is not a
 *   census*.
 * @property {BlockRow[]} rows Every row, shared pages first and ranked.
 * @property {BlockRow[]} shared The pages both stores have, worst-first.
 * @property {BlockRow[]} absentThere The pages this store has and the sibling has not.
 * @property {BlockRow[]} absentHere The pages the sibling has and this store has not.
 * @property {number} identical How many of `shared` agree word for word.
 */

/**
 * The whole reading one store's dashboard draws, as values.
 *
 * The groupings and the count are decided **here** and not in the component: the panel
 * chooses markup and tone and nothing else, in the manner `explainScope()` set. A
 * grouping re-derived in JSX is a second definition of *a page both stores have*.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows The rows of `data/10-store-seeds.json`.
 * @param {string} input.store The store whose dashboard is being drawn.
 * @param {(store: string, page: string) => string[] | null} input.unitsOf The
 *   normalised texts of one page's production content units, and `null` for a page no
 *   report covers. **Required**, and deliberately not defaulted: a default would answer
 *   `null` for every page, and the reading would then call the whole block unmeasured
 *   without anybody having asked it to.
 * @returns {BlockReading | null} `null` for a store in no block, which is `de` and
 *   `uk` — an empty reading is a panel that draws itself and says nothing.
 */
export function blockReading({ rows, store, unitsOf }) {
  const other = siblingOf(store);
  if (!other) return null;

  /** @type {BlockRow[]} */
  const mine = siblingPages({ rows, store }).map((one) => {
    if (!one.sibling) return unmeasuredRow(one.page, 'sibling-absent', null);

    const here = unitsOf(store, one.page);
    const there = unitsOf(other, one.sibling.page);
    // One side has no compared page, so there is nothing to measure. It says so
    // rather than reporting a share of zero, which would accuse a page of diverging
    // when what happened is that nobody looked.
    if (!here || !there) return unmeasuredRow(one.page, 'unmeasured', one.sibling);

    const { units, found, share, mutual } = agreementOf(here, there);
    // A page with no content units on this side was read and found empty, so there is
    // no share to rank it by and nothing to call agreement. It is unmeasured for the
    // same reason a page with no report is: nothing was compared.
    if (share === null) return unmeasuredRow(one.page, 'unmeasured', one.sibling);

    return {
      page: one.page,
      // **Mutual** and not `share === 1`. The share only asks whether this store's
      // words are over there, so a short page wholly contained in a long sibling
      // scores 1 while the sibling says a great deal more — and *agrees word for
      // word* would be a false sentence about it.
      kind: mutual ? 'identical' : 'diverged',
      sibling: one.sibling,
      units,
      found,
      share,
    };
  });

  // Worst-first, so a page somebody rewrote sorts above a page whose phone number
  // differs. An unmeasured row has no share and sorts after every measured one — it is
  // not the worst page, it is the page nobody looked at.
  //
  // The tie-break is the page key, so two pages of equal share never swap places
  // between two builds. The repeat list breaks its own tie the same way.
  mine.sort(
    (a, b) => (a.share ?? 2) - (b.share ?? 2) || (a.page < b.page ? -1 : a.page > b.page ? 1 : 0),
  );

  // The other direction of absence, and it is a different fact: a page **this** store
  // has yet to build, against a page it wrote and the sibling did not. The two must
  // not read as one thing, so they are two kinds and not one.
  //
  // It is read off the sibling's own matching rather than recomputed, so the two
  // directions can never disagree about what counts as absent.
  /** @type {BlockRow[]} */
  const theirs = siblingPages({ rows, store: other })
    .filter((one) => !one.sibling)
    .map((one) => unmeasuredRow(one.page, 'only-in-sibling', null));

  const shared = mine.filter((one) => SHARED_KINDS.has(one.kind));

  return {
    store,
    sibling: other,
    language: languageOf(store),
    // The reference side, stated rather than implied. An editor who cannot tell which
    // side is compared reads a production divergence as a migration defect.
    side: 'production',
    // What makes *this list is not a census* falsifiable rather than a disclaimer. A
    // page no sitemap declares is absent from the list entirely; the carried-over
    // cells are the ones already found that way, and on `nl` there are 48 of 181.
    // Counted in this store alone — a gap in the sibling's page list is not a gap in
    // the reader's.
    census: {
      carriedOver: rows.filter((row) => row.stores?.[store]?.provenance === 'carried-over').length,
    },
    rows: [...mine, ...theirs],
    // The three groupings the panel draws, decided here so that *a page both stores
    // have* has one definition and not two.
    shared,
    absentThere: mine.filter((one) => one.kind === 'sibling-absent'),
    absentHere: theirs,
    identical: shared.filter((one) => one.kind === 'identical').length,
  };
}
