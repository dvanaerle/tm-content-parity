/**
 * What the record-layout screen draws, as values (ticket 08).
 *
 * The precedent is `blockReading()` in `blocks.mjs`: this decides, and `RecordLayout.jsx`
 * chooses markup and tone and nothing else. It is pure, so the arithmetic a reader depends on
 * — how old the reading is, which pages may still be added, which entries the corpus has lost
 * — is testable without a browser and without a Supabase project.
 */

import { STORES } from '../../../shared/stores.mjs';

/** @typedef {import('../../../overrides/record-layout.mjs').RecordLayout} RecordLayout */
/** @typedef {import('../../../overrides/record-layout.mjs').SeparateRecord} SeparateRecord */

/**
 * One store page of the corpus, as the build hands it to the island.
 *
 * `sibling` is the page key of the other store's page, or `null` where the pairing found
 * none. A page with no sibling can never be shared, so it can never be **un**shared either
 * and it is not offered.
 *
 * @typedef {{ store: string, page: string, sibling: string | null }} CorpusPage
 */

/**
 * @typedef {object} RecordLayoutScreen
 * @property {{ takenOn: string, days: number | null, editor: string } | null} reading The
 *   newest reading of the grid. `null` where the grid has never been read.
 * @property {boolean} grants Whether the layout grants any sharing at all. `false` without a
 *   reading, and it is the sentence the screen leads with — an empty table must never read as
 *   *everything is shared*.
 * @property {(SeparateRecord & { sibling: string | null })[]} entries The separate records, in
 *   store order and then page order.
 * @property {SeparateRecord[]} strays Entries naming a store page the corpus no longer holds.
 * @property {CorpusPage[]} addable Store pages that could be named and are not yet, in the
 *   same order. It is what the picker offers, which is why nothing here is typed.
 */

/** @param {{ store: string, page: string }} at */
const key = ({ store, page }) => `${store}|${page}`;

/**
 * In the order every table in the log uses: the six stores as `STORES` gives them, then the
 * page key.
 *
 * @param {{ store: string, page: string }} one
 * @param {{ store: string, page: string }} two
 */
const byStoreThenPage = (one, two) =>
  STORES.indexOf(/** @type {any} */ (one.store)) - STORES.indexOf(/** @type {any} */ (two.store)) ||
  one.page.localeCompare(two.page);

/**
 * How many whole days ago a day was, or `null` where the day cannot be read.
 *
 * The age of the reading bounds every permission the complement grants, so the screen says it
 * in days rather than making a reader subtract two dates.
 *
 * @param {string | null} takenOn `YYYY-MM-DD`.
 * @param {Date} now
 * @returns {number | null}
 */
export function daysSince(takenOn, now) {
  if (!takenOn) return null;
  const then = Date.parse(`${takenOn}T00:00:00Z`);
  if (Number.isNaN(then)) return null;
  return Math.round(
    (Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`) - then) / 86_400_000,
  );
}

/**
 * The whole screen, as values.
 *
 * @param {object} input
 * @param {RecordLayout} input.layout      From `recordLayoutFrom()`.
 * @param {CorpusPage[]} input.storePages  Every store page the corpus holds.
 * @param {Date} [input.now]               Injected, so the age is testable.
 * @returns {RecordLayoutScreen}
 */
export function recordLayoutScreen({ layout, storePages, now = new Date() }) {
  /** @type {Map<string, CorpusPage>} */
  const corpus = new Map(storePages.map((one) => [key(one), one]));
  const listed = new Set(layout.notShared.map(key));

  /** @type {(SeparateRecord & { sibling: string | null })[]} */
  const entries = [];
  /** @type {SeparateRecord[]} */
  const strays = [];
  for (const entry of layout.notShared) {
    const held = corpus.get(key(entry));
    if (held) entries.push({ ...entry, sibling: held.sibling });
    else strays.push(entry);
  }

  const newest = layout.readings[0] ?? null;

  return {
    reading: newest
      ? { takenOn: newest.takenOn, days: daysSince(newest.takenOn, now), editor: newest.editor }
      : null,
    grants: Boolean(newest),
    entries: entries.sort(byStoreThenPage),
    strays: strays.sort(byStoreThenPage),
    addable: storePages.filter((one) => one.sibling && !listed.has(key(one))).sort(byStoreThenPage),
  };
}
