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

import { siblingOf } from '../../../shared/language-blocks.mjs';

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
