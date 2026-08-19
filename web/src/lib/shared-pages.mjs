/**
 * *Is this store page shared* — one Magento record on the new site serving both stores of
 * a language block, so that one edit corrects both (`CONTEXT.md` → *Shared page*).
 *
 * The fact is imported and never derived: `./not-shared-pages.mjs` holds it, this holds the
 * rule, and ADR 0025 says why a crawl cannot produce either. It is **not a link** — the
 * sibling is derived from what production declares, `links` is a Check, and nobody links
 * anything.
 *
 * Everything here is decided as a value. It answers one question and offers one guard, and
 * it is the only new seam this effort adds.
 */

import { comparablePath, siblingPages } from './blocks.mjs';
import { LANGUAGE_BLOCKS, siblingOf } from './language-blocks.mjs';
import { NOT_SHARED_PAGES, TAKEN_ON } from './not-shared-pages.mjs';

/** @typedef {import('./blocks.mjs').SeedRow} SeedRow */
/** @typedef {import('./not-shared-pages.mjs').NotSharedPage} NotSharedPage */

/**
 * The answer for the whole corpus, built once and asked many times.
 *
 * `shared` is the **materialised complement** and not the file: some 230 store pages over
 * two blocks, which is cheaper to hold than to re-derive per question, and it is what makes
 * the corpus conditions part of the answer rather than a caller's to remember.
 *
 * @typedef {object} SharedPageIndex
 * @property {Set<string>} shared        Store pages that are shared, spelled by
 *                                       `storePage()`. Callers ask `isSharedPage()`.
 * @property {string[]} unresolvable     One sentence per key that resolves to no one store
 *                                       page. It is the build's failure list, and it is
 *                                       housekeeping: a key that names a record to be
 *                                       disabled belongs here, not silently normalised onto
 *                                       a live page.
 */

/** @param {{ store: string, page: string }} at */
const storePage = ({ store, page }) => `${store}|${page}`;

/**
 * The **earliest** observation each store page was seen in, over every run-log row that
 * names it — retired rows included, because the question is when the log first saw the
 * page and not when it last did.
 *
 * @param {{ store: string, page: string, firstSeen: string }[]} rows
 * @returns {Map<string, string>}
 */
function firstSightings(rows) {
  /** @type {Map<string, string>} */
  const earliest = new Map();
  for (const row of rows) {
    const at = storePage(row);
    const known = earliest.get(at);
    if (!known || row.firstSeen < known) earliest.set(at, row.firstSeen);
  }
  return earliest;
}

/**
 * Each store's paths against the page key they belong to, with the `fr/` prefix off.
 *
 * A path claimed by two rows is recorded and never answered: picking one would be the quiet
 * mapping this module refuses. The corpus of 2026-08-19 has no such path in any store, so
 * this is a guard and not a case.
 *
 * @param {SeedRow[]} rows
 */
function pagesByPath(rows) {
  /** @type {Map<string, string>} */
  const byPath = new Map();
  /** @type {Set<string>} */
  const claimedTwice = new Set();
  for (const row of rows) {
    for (const [store, cell] of Object.entries(row.stores ?? {})) {
      if (!cell) continue;
      const key = storePage({ store, page: comparablePath(cell.path ?? '') });
      if (byPath.has(key)) claimedTwice.add(key);
      byPath.set(key, row.page);
    }
  }
  return { byPath, claimedTwice };
}

/**
 * The store and path a file key names. The store is the part before the first slash, so a
 * path may hold slashes of its own.
 *
 * @param {string} key
 */
function readKey(key) {
  const cut = key.indexOf('/');
  if (cut < 0) return null;
  return { store: key.slice(0, cut), path: comparablePath(key.slice(cut + 1)) };
}

/**
 * Whether the file's reading can have seen this store page at all.
 *
 * An **absent** first sighting does not withdraw the file's claim: a page with no run-log
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
 * Which store pages are shared, and which keys of the file resolve to none.
 *
 * @param {object} input
 * @param {SeedRow[]} input.rows The rows of `data/10-store-seeds.json`.
 * @param {NotSharedPage[]} [input.notShared] The file. Defaults to the committed one.
 * @param {string | null} [input.takenOn]     The day it was read. Defaults to the file's.
 * @param {{ store: string, page: string, firstSeen: string }[]} [input.runLog] The run log's
 *   rows. Absent is the fresh clone, where the index has not been written yet.
 * @returns {SharedPageIndex}
 */
export function sharedPageIndex({
  rows,
  notShared = NOT_SHARED_PAGES,
  takenOn = TAKEN_ON,
  runLog = [],
}) {
  const { byPath, claimedTwice } = pagesByPath(rows);
  const seenFirst = firstSightings(runLog);

  /** @type {Set<string>} */
  const listed = new Set();
  /** @type {string[]} */
  const unresolvable = [];
  for (const { key } of notShared) {
    const named = readKey(key);
    const at = named && storePage({ store: named.store, page: named.path });
    const page = at ? byPath.get(at) : undefined;
    if (!named || !page) {
      unresolvable.push(`${key}: no store page in the corpus`);
      continue;
    }
    if (at && claimedTwice.has(at)) {
      unresolvable.push(`${key}: two store pages of ${named.store} hold this path`);
      continue;
    }
    listed.add(storePage({ store: named.store, page }));
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
        if (listed.has(storePage(here)) || listed.has(storePage(there))) continue;
        if (!couldHaveSeen(takenOn, seenFirst.get(storePage(here)))) continue;
        shared.add(storePage(here));
      }
    }
  }

  return { shared, unresolvable };
}

/**
 * Whether one edit on the new site corrects this store page and its sibling together.
 *
 * `false` is the answer to every question the file does not positively grant: a store
 * outside a block, a page with no sibling, a listed page, a page either store of the pair
 * has listed, a page first seen after the reading, and an undated file.
 *
 * **It raises while any key resolves to nothing**, and it names every one of them. A key
 * that has gone stale is a claim about a record nobody can find, and answering `false` to
 * an unrelated question would let the whole file go on being trusted around it. The suite
 * asks this of the committed file, so the failure lands at the build and not at an editor.
 *
 * @param {SharedPageIndex} index
 * @param {{ store: string, page: string }} at
 * @returns {boolean}
 * @throws {Error} While `index.unresolvable` holds anything.
 */
export function isSharedPage(index, at) {
  if (index.unresolvable.length) {
    throw new Error(
      `the shared-page file holds ${index.unresolvable.length} key(s) that resolve to no ` +
        `store page:\n  ${index.unresolvable.join('\n  ')}\n` +
        'Fix the file, or disable the record. A stale key is not mapped onto a live page.',
    );
  }
  return index.shared.has(storePage(at));
}
