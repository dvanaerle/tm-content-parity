/**
 * *Is this store page shared* — one Magento record on the new site serving both stores of
 * a language block, so that one edit corrects both (`CONTEXT.md` → *Shared page*).
 *
 * The fact is imported and never derived. It comes from the log's own append-only table
 * through `overrides/record-layout.mjs`, and ADR 0025 says why a crawl cannot produce it.
 * It is **not a link** — the sibling is derived from what production declares, `links` is a
 * Check, and nobody links anything.
 *
 * Everything here is decided as a value, and it takes the fact as an argument: this file
 * never learns where the entries came from, which is what let ticket 08 move them out of a
 * committed file without touching the rule.
 */

import { siblingPages } from './blocks.mjs';
import { LANGUAGE_BLOCKS, siblingOf } from './language-blocks.mjs';

/** @typedef {import('./blocks.mjs').SeedRow} SeedRow */
/** @typedef {import('../../../overrides/record-layout.mjs').SeparateRecord} SeparateRecord */

/**
 * One run-log row, read for its age alone. `firstSeen` is an observation id, which sorts
 * chronologically by construction, so comparing two of them is a string comparison.
 *
 * @typedef {{ store: string, page: string, firstSeen: string }} Sighting
 */

/**
 * The answer for the whole corpus, built once and asked many times.
 *
 * `shared` is the **materialised complement** and not the entries: 492 store pages over the
 * two blocks on the corpus of 2026-08-19 — 126 `nl`, 126 `be`, 120 `be_fr`, 120 `fr` — which
 * is cheaper to hold than to re-derive per question, and it is what makes the corpus
 * conditions part of the answer rather than a caller's to remember. That count is the
 * complement's **upper bound**, under a dated layout with no entries; every entry cuts into
 * it.
 *
 * @typedef {object} SharedPageIndex
 * @property {Set<string>} shared      Store pages that are shared, spelled by `storePage()`.
 *                                     Callers ask `isSharedPage()`.
 * @property {SeparateRecord[]} strays Entries naming a store page the corpus does not hold.
 *                                     **Housekeeping and not a failure**: see the note on
 *                                     `sharedPageIndex()`.
 */

/** @param {{ store: string, page: string }} at */
const storePage = ({ store, page }) => `${store}|${page}`;

/**
 * The **earliest** observation each store page was seen in, over every run-log row that
 * names it — retired rows included, because the question is when the log first saw the
 * page and not when it last did.
 *
 * @param {Sighting[]} rows
 * @returns {Map<string, string>}
 */
function firstSightings(rows) {
  /** @type {Map<string, string>} */
  const earliest = new Map();
  for (const row of rows) {
    const where = storePage(row);
    const known = earliest.get(where);
    if (!known || row.firstSeen < known) earliest.set(where, row.firstSeen);
  }
  return earliest;
}

/**
 * Every store page the corpus holds.
 *
 * @param {SeedRow[]} rows
 * @returns {Set<string>}
 */
function storePagesIn(rows) {
  /** @type {Set<string>} */
  const held = new Set();
  for (const row of rows) {
    for (const [store, cell] of Object.entries(row.stores ?? {})) {
      if (cell) held.add(storePage({ store, page: row.page }));
    }
  }
  return held;
}

/**
 * Whether the reading can have seen this store page at all.
 *
 * An **absent** first sighting does not withdraw the layout's claim: a page with no run-log
 * row has no finding, and the log is the only clock there is — the corpus carries no date
 * per page. A page created after the reading announces itself through the first finding on
 * it, whose sighting is later than the date, which is the direction that matters.
 *
 * @param {string | null} takenOn
 * @param {string | undefined} firstSeen An observation id, which sorts chronologically.
 */
function couldHaveSeen(takenOn, firstSeen) {
  if (!takenOn) return false;
  return !firstSeen || firstSeen.slice(0, takenOn.length) <= takenOn;
}

/**
 * Which store pages are shared, and which entries name a store page the corpus has not.
 *
 * **Nothing here is optional.** The entries, the day the grid was read and the run log are
 * all required, because each one is a bound on what the answer may grant and a caller who
 * omitted any of them would get the claim with a bound taken off it — quietly, which is the
 * one failure shape this module exists to avoid. `npm run typecheck` reads no `.mjs` in this
 * repo, so the requirement is checked here and not by a type.
 *
 * **A stray entry is housekeeping and never a refusal.** Under the committed file a key that
 * matched nothing was a typo and failed the build; the entries are picked out of the corpus
 * now, so a stray is a page that has since left it, and the screen names it. It grants
 * nothing either way: a store page the corpus does not hold has no sibling pairing, so it
 * was never in the complement. The case that *would* be dangerous is a page **renamed**
 * rather than removed — the entry names the old key, the new key is unlisted, and the
 * complement would call it shared. The date guard is what closes that: a new page key's
 * first sighting is later than the reading, so it reads as not shared until somebody reads
 * the grid again.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows             The rows of `data/10-store-seeds.json`.
 * @param {SeparateRecord[]} input.notShared The complement, from `recordLayoutFrom()`.
 * @param {string | null} input.takenOn      The day the grid was read. `null` shares nothing.
 * @param {Sighting[]} input.runLog          The run log's rows. `[]` on a fresh clone, said
 *                                           aloud rather than defaulted.
 * @returns {SharedPageIndex}
 */
export function sharedPageIndex({ rows, notShared, takenOn, runLog }) {
  if (!runLog || !notShared) {
    throw new Error(
      'sharedPageIndex() needs the record layout and the run log rows: the entries and the ' +
        'day the grid was read are what bound its claim, and without them the bound comes ' +
        'off in silence. Pass [] where there is nothing yet.',
    );
  }

  const held = storePagesIn(rows);
  const seenFirst = firstSightings(runLog);

  /** @type {Set<string>} */
  const separateRecords = new Set();
  /** @type {SeparateRecord[]} */
  const strays = [];
  for (const entry of notShared) {
    if (held.has(storePage(entry))) separateRecords.add(storePage(entry));
    else strays.push(entry);
  }

  /** @type {Set<string>} */
  const shared = new Set();
  for (const block of LANGUAGE_BLOCKS) {
    for (const store of block.stores) {
      const other = /** @type {string} */ (siblingOf(store));
      for (const match of siblingPages({ rows, store })) {
        if (!match.sibling) continue;
        const here = { store, page: match.page };
        const there = { store: other, page: match.sibling.page };
        if (separateRecords.has(storePage(here))) continue;
        // Sharing is a property of the **pair**, so the sibling's own entry unshares this
        // side too. It is why the grid reading only has to be done from one store.
        if (separateRecords.has(storePage(there))) continue;
        if (!couldHaveSeen(takenOn, seenFirst.get(storePage(here)))) continue;
        shared.add(storePage(here));
      }
    }
  }

  return { shared, strays };
}

/**
 * Whether one edit on the new site corrects this store page and its sibling together.
 *
 * `false` is the answer to every question the layout does not positively grant: a store
 * outside a block, a page with no sibling, a listed page, a page either store of the pair
 * has listed, a page first seen after the reading, and a layout with no reading in it.
 *
 * @param {SharedPageIndex} index
 * @param {{ store: string, page: string }} at
 * @returns {boolean}
 */
export function isSharedPage(index, at) {
  return index.shared.has(storePage(at));
}
