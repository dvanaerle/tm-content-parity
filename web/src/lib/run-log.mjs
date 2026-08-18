/**
 * The run log, as a page reads it: the day each of its findings was first seen.
 *
 * `compare/run-log.mjs` writes the index and this reads it, which is the arrow ADR 0004
 * draws. Nothing here decides anything — the index says when an id was first seen, and a
 * finding whose id is not in it gets no date at all.
 */

import { pathToFileURL } from 'node:url';
import { observedAt } from '../../../compare/contract.mjs';
import { readRunLog } from '../../../compare/run-log.mjs';
import { fromRoot } from './repo-root.mjs';

/**
 * The path comes from `repo-root.mjs` and **not** from the writer's own `RUN_LOG`, which
 * is relative to `import.meta.url`. That is ticket 72's trap: the Astro build bundles
 * server modules into `web/.astro/.prerender/chunks/`, and a relative path read from
 * there names a file that does not exist. The read then answers nothing and every page
 * quietly loses its dates — which is exactly what it did before this line.
 */
const FILE = pathToFileURL(fromRoot('history/run-log.jsonl'));

/**
 * The index itself, read **once for the whole build**. It holds some 40,000 rows and each
 * of the 816 page routes asks it about its own thirty, so the two projections below are
 * built from one read and each is inverted once: a scan per page is 27 million
 * comparisons for an answer a map gives in one.
 *
 * @type {Promise<import('../../../compare/contract.mjs').RunLog | null> | null}
 */
let cache = null;

const whole = () => (cache ??= readRunLog(FILE));

/** @type {Promise<Map<string, string>> | null} */
let dates = null;

/**
 * Every id in the index, against the day it was first seen.
 *
 * @returns {Promise<Map<string, string>>} Empty where the index has not been written
 *   yet, which a fresh clone must build through rather than fail on.
 */
export function loadFirstSeen() {
  dates ??= whole().then(
    (log) => new Map(log?.rows.map((row) => [row.id, observedAt(row.firstSeen)]) ?? []),
  );
  return dates;
}

/** @type {Promise<Closings> | null} */
let closings = null;

/**
 * @returns {Promise<Closings>} Empty where there is no index, the same way the dates are.
 */
export function loadClosings() {
  closings ??= whole().then((log) => closingsOf(log ?? EMPTY));
  return closings;
}

/**
 * The dates of the findings named, keyed on the id, as an object rather than a `Map`
 * because it crosses into an island as a prop.
 *
 * An id the index does not hold is **absent** and never null: a finding with no row says
 * nothing rather than guessing, and an index older than the reports beside it is the
 * normal case on a fresh clone.
 *
 * @param {Map<string, string>} index
 * @param {{ id: string }[]} findings
 * @returns {Record<string, string>} Id to an ISO 8601 stamp.
 */
export function firstSeenOn(index, findings) {
  /** @type {Record<string, string>} */
  const dates = {};
  for (const finding of findings) {
    const at = index.get(finding.id);
    if (at) dates[finding.id] = at;
  }
  return dates;
}

/** @typedef {import('../../../compare/contract.mjs').RunLog} RunLog */

/** @type {RunLog} */
const EMPTY = { observationId: '', stores: {}, rows: [] };

/** @param {import('../../../compare/contract.mjs').FindingRef} row */
const placeOf = (row) => `${row.store}|${row.page}|${row.class}`;

/**
 * What the note asks the index, inverted once for the whole build (ticket 78).
 *
 * `retired` is the ids that stopped being seen, grouped by where they sat and by the run
 * that stopped seeing them. `firstSeen` is each id's own first observation, at full
 * precision — the day the interface draws is not comparable against a run.
 *
 * @typedef {object} Closings
 * @property {Map<string, Map<string, string[]>>} retired  Place, then run, to the ids.
 * @property {Map<string, string>} firstSeen               Id to an observation id.
 */

/**
 * The index, read as *which run retired this row*.
 *
 * The run is on the row — `retiredAt`, which the compare stage writes and `lastSeen` is one
 * run short of. It is deliberately not rebuilt here from the observations the rows name: a
 * run that retires an id without introducing one names itself nowhere, because every row it
 * still sees is seen again later and overwrites it, so it would drop out of the sequence and
 * its closures would land on a finding that appeared a run after them.
 *
 * @param {RunLog} log
 * @returns {Closings}
 */
export function closingsOf(log) {
  /** @type {Closings} */
  const closings = { retired: new Map(), firstSeen: new Map() };
  for (const row of log.rows) {
    closings.firstSeen.set(row.id, row.firstSeen);
    if (row.seen || !row.retiredAt) continue;

    const place = placeOf(row);
    const byRun = closings.retired.get(place) ?? new Map();
    const ids = byRun.get(row.retiredAt) ?? [];
    closings.retired.set(place, byRun.set(row.retiredAt, [...ids, row.id]));
  }
  return closings;
}

/**
 * The ids that stopped being seen in the run that first saw each finding named — same
 * store, same page, same class.
 *
 * It **asserts no identity**, and the shape is where that is kept: a list of ids, and never
 * a predecessor. Two ids of one class on one page, one of them retired by the run that
 * introduced the other, is a coincidence of run and place, and ADR 0004 refuses every
 * attempt to make it more than that. No text is read here, so there is nothing to make it
 * more with.
 *
 * A finding with no row of its own gets nothing, the same way it gets no date: an index
 * older than the report beside it is the ordinary reading on a fresh clone.
 *
 * @param {Closings} closings
 * @param {import('../../../compare/contract.mjs').FindingRef[]} findings
 * @returns {Record<string, string[]>} Finding id to the ids that closed as it appeared.
 */
export function closingsFor(closings, findings) {
  /** @type {Record<string, string[]>} */
  const closed = {};
  for (const finding of findings) {
    const first = closings.firstSeen.get(finding.id);
    if (!first) continue;

    const ids = closings.retired.get(placeOf(finding))?.get(first) ?? [];
    // Its own id, where an index somehow holds it both seen and retired. One run cannot say
    // both, and a note about itself is the one reading this must never produce.
    const others = ids.filter((id) => id !== finding.id);
    if (others.length > 0) closed[finding.id] = others;
  }
  return closed;
}
