/**
 * The **block reading**: one store's pages against their siblings in the other
 * store of its language block (`CONTEXT.md` → *Language blocks*).
 *
 * It stays in `web/` and not in `shared/`. ADR 0001 asks three questions and this
 * fails the third: only the web layer reads it. The block **vocabulary** is the part
 * two stages could want, and that is in `shared/language-blocks.mjs`.
 *
 * Everything here is **decided as a value** and rendered by nothing — the precedent
 * is `explainScope()`, which `CONTEXT.md` cites as decided as a value and only
 * rendered by the component.
 */

import { languageOf, siblingOf } from '../../../shared/language-blocks.mjs';

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
 * @property {number} units This store's production content units on the page.
 * @property {number} found How many of them appear exactly in the sibling's.
 */

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
 * A page with no units is fully found rather than divided by zero, which is the
 * reading that does not claim a difference nobody can point at.
 *
 * @param {string[]} mine
 * @param {string[]} theirs
 */
function agreementOf(mine, theirs) {
  const over = new Set(theirs);
  const found = mine.filter((text) => over.has(text)).length;
  return { units: mine.length, found, share: mine.length === 0 ? 1 : found / mine.length };
}

/**
 * The whole reading one store's dashboard draws, as values.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows
 * @param {string} input.store
 * @returns {{ rows: BlockRow[] } | null}
 */
export function blockReading({ rows, store, unitsOf = () => null }) {
  const other = siblingOf(store);
  if (!other) return null;

  /** @type {BlockRow[]} */
  const mine = siblingPages({ rows, store }).map((one) => {
    if (!one.sibling) {
      return {
        page: one.page,
        kind: 'sibling-absent',
        sibling: null,
        share: null,
        units: 0,
        found: 0,
      };
    }

    const here = unitsOf(store, one.page);
    const there = unitsOf(other, one.sibling.page);
    // One side has no compared page, so there is nothing to measure. It says so
    // rather than reporting a share of zero, which would accuse a page of diverging
    // when what happened is that nobody looked.
    if (!here || !there) {
      return {
        page: one.page,
        kind: 'unmeasured',
        sibling: one.sibling,
        share: null,
        units: 0,
        found: 0,
      };
    }

    const agreement = agreementOf(here, there);
    return {
      page: one.page,
      kind: agreement.share === 1 ? 'identical' : 'diverged',
      sibling: one.sibling,
      ...agreement,
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
    .map((one) => ({
      page: one.page,
      kind: 'only-in-sibling',
      sibling: null,
      share: null,
      units: 0,
      found: 0,
    }));

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
  };
}
