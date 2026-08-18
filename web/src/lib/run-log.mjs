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
 * Every id in the index, against the day it was first seen.
 *
 * Read and inverted **once for the whole build**: the index holds some 40,000 rows and
 * each of the 816 page routes asks it about its own thirty, so a scan per page is 27
 * million comparisons for an answer a map gives in one.
 *
 * @type {Promise<Map<string, string>> | null}
 */
let cache = null;

/**
 * @returns {Promise<Map<string, string>>} Empty where the index has not been written
 *   yet, which a fresh clone must build through rather than fail on.
 */
export function loadFirstSeen() {
  cache ??= readRunLog(FILE).then(
    (log) => new Map(log?.rows.map((row) => [row.id, observedAt(row.firstSeen)]) ?? []),
  );
  return cache;
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
