/**
 * The **record layout**: which store pages are their own Magento record on the new site, as
 * the log's own append-only table holds it (`CONTEXT.md` → *Shared page*, ticket 08).
 *
 * It is a **fact and not a judgement**, which is why it is not a scope on `overrides`. It
 * carries a reason, it sits in no bucket, it moves no count, and a later crawl can contradict
 * it. `supabase/record-layout.sql` says the rest.
 *
 * This file is pure and is tested against hand-written event lists, in the manner
 * `state.mjs` is: the port is passed in and never imported here. What it produces is the two
 * values `web/src/lib/shared-pages.mjs` takes — the entries and the day the grid was read —
 * so the rule that spends them never learns where they came from.
 */

/**
 * One row of the table, as the port hands it over.
 *
 * @typedef {object} RecordLayoutEvent
 * @property {string} id
 * @property {string} createdAt          When somebody typed. **Not** the day of the reading.
 * @property {string} editor
 * @property {'separate' | 'shared' | 'reading'} kind
 * @property {string | null} store
 * @property {string | null} page
 * @property {number | null} recordId
 * @property {string | null} reason
 * @property {string | null} takenOn     The day the grid was read, on a `reading`.
 */

/**
 * One store page that is its own record, in the shape `sharedPageIndex()` takes — plus who
 * wrote it and when, which the screen shows and the rule ignores.
 *
 * @typedef {object} SeparateRecord
 * @property {string} store
 * @property {string} page
 * @property {number} record
 * @property {string} reason
 * @property {string} editor
 * @property {string} writtenAt
 */

/**
 * @typedef {object} RecordLayout
 * @property {SeparateRecord[]} notShared The complement, in the order the events name it.
 * @property {string | null} takenOn      The newest **written** reading's day, or `null`
 *                                        where the grid has never been read. Without it
 *                                        nothing is shared, so an empty table cannot mean
 *                                        *everything is shared*.
 * @property {{ takenOn: string, editor: string, writtenAt: string }[]} readings Every
 *   reading, newest written first. The screen says how old the newest one is.
 */

const A_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** @param {RecordLayoutEvent} event */
const isNewer = (event, than) =>
  !than ||
  event.createdAt > than.createdAt ||
  (event.createdAt === than.createdAt && event.id > than.id);

/**
 * What the events add up to.
 *
 * Newest-event-per-store-page wins, which is `latestByKey()`'s rule said about this table.
 * A `shared` event is the **withdrawal** — the shape `cleared` has on `overrides` — so the
 * page simply leaves the complement, and the history underneath still says who withdrew it.
 *
 * @param {RecordLayoutEvent[]} events In any order.
 * @returns {RecordLayout}
 */
export function recordLayoutFrom(events) {
  /** @type {Map<string, RecordLayoutEvent>} */
  const latest = new Map();
  /** @type {RecordLayoutEvent[]} */
  const readings = [];

  for (const event of events) {
    if (event.kind === 'reading') {
      readings.push(event);
      continue;
    }
    const key = `${event.store}|${event.page}`;
    if (isNewer(event, latest.get(key))) latest.set(key, event);
  }

  readings.sort((one, two) => (isNewer(one, two) ? -1 : 1));

  /** @type {SeparateRecord[]} */
  const notShared = [];
  for (const event of latest.values()) {
    if (event.kind !== 'separate') continue;
    notShared.push({
      store: /** @type {string} */ (event.store),
      page: /** @type {string} */ (event.page),
      record: /** @type {number} */ (event.recordId),
      reason: /** @type {string} */ (event.reason),
      editor: event.editor,
      writtenAt: event.createdAt,
    });
  }

  return {
    notShared,
    takenOn: readings[0]?.takenOn ?? null,
    readings: readings.map((one) => ({
      takenOn: /** @type {string} */ (one.takenOn),
      editor: one.editor,
      writtenAt: one.createdAt,
    })),
  };
}

/**
 * The three events the interface writes, in the table's own column names.
 *
 * They **refuse** what the table's constraints refuse, so a caller learns at this seam
 * rather than from a constraint violation surfacing in a browser. `editor` is added by the
 * port, which is where it is known.
 *
 * @param {{ store: string, page: string, record: number | null, reason: string }} input
 */
export function separateEventFor({ store, page, record, reason }) {
  const why = reason?.trim() ?? '';
  if (!store || !page) throw new Error('a separate record names a store page');
  if (!Number.isInteger(record)) {
    throw new Error('a separate record names its Magento record id, so it can be looked up');
  }
  if (!why) throw new Error('a separate record says why it is one');
  return { kind: 'separate', store, page, record_id: record, reason: why };
}

/**
 * The withdrawal. It says why, because *the merge landed* and *the earlier reading was
 * wrong* are different facts and the next reader has to tell them apart.
 *
 * @param {{ store: string, page: string, reason: string }} input
 */
export function sharedEventFor({ store, page, reason }) {
  const why = reason?.trim() ?? '';
  if (!store || !page) throw new Error('a withdrawal names a store page');
  if (!why) throw new Error('a withdrawal says why the page is shared again');
  return { kind: 'shared', store, page, reason: why };
}

/**
 * The day the grid was read. A day and not a stamp: it is a fact about a reading, and the
 * moment somebody typed is `created_at`.
 *
 * @param {string} takenOn
 */
export function readingEventFor(takenOn) {
  if (!A_DAY.test(takenOn ?? '')) throw new Error('a reading is dated YYYY-MM-DD');
  return { kind: 'reading', taken_on: takenOn };
}
