/**
 * The run log: a committed index, keyed on the finding id alone, that says when an id
 * was first seen, whether the run that last looked still saw it, when it was last seen, and
 * which run stopped seeing it. ADR 0004 is the decision and every rule in it.
 *
 * It **never re-attaches**. `nextRunLog()` is not given a finding's text, so no
 * threshold can be added later without changing the signature — which is the point of
 * the signature. ADR 0004 says why: a matcher that is wrong carries a dismissal onto
 * text nobody dismissed, and it fails silently.
 *
 * **Here and not in `crawl/`**, which is what ADR 0004 wrote. The index is keyed on the
 * finding id and no finding id exists until the comparison has run, so `crawl/` could
 * only write it by reading `compare/`'s output back — and a module under `crawl/` that
 * `compare/` and `web/` both import is the back-arrow ADR 0001 exists to refuse. Here
 * the arrow is the one the layers already allow, the same way `web/` reads
 * `compare/vocabulary.mjs`. Not `shared/` either: `shared/` is for pure rules, and half
 * of this file is a disk.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

/** @typedef {import('./contract.mjs').FindingRef} FindingRef */

/** @typedef {import('./contract.mjs').RunLogRow} RunLogRow */

/** @typedef {import('./contract.mjs').RunLog} RunLog */

/** @type {RunLog} */
const EMPTY = { observationId: '', stores: {}, rows: [] };

/**
 * The index this run leaves behind.
 *
 * Pure, and a pure function of the **ids** in the snapshot and the previous index. The
 * two texts of a finding are not arguments, so no amount of later editing here can make
 * a new id inherit an old id's history — which is the one failure ADR 0004 rules out,
 * because it carries a dismissal onto text nobody dismissed and does it silently.
 *
 * Pure — no clock among other things, which is why the header carries no separate
 * build stamp: `observedAt(observationId)` is the moment the run began and a second
 * one to the millisecond is precision nobody reads.
 *
 * @param {object} input
 * @param {RunLog | null} input.previous
 * @param {FindingRef[]} input.snapshot   Every finding this run compared.
 * @param {string} input.observationId    This run's.
 * @param {string[]} input.covered        The stores this run compared. Rows of a store
 *                                        outside it are carried over untouched.
 * @returns {RunLog}
 */
export function nextRunLog({ previous, snapshot, observationId, covered }) {
  const before = previous ?? EMPTY;
  const looked = new Set(covered);
  const found = new Map(snapshot.map((finding) => [finding.id, finding]));

  /** @type {RunLogRow[]} */
  const rows = [];
  for (const row of before.rows) {
    if (!looked.has(row.store)) {
      rows.push(row);
      continue;
    }
    if (found.delete(row.id)) {
      rows.push({ ...row, seen: true, lastSeen: observationId, retiredAt: null });
      continue;
    }
    // The run that stopped seeing it, kept once. A retirement happened in one run, and a
    // later run that also does not see the id has stopped seeing nothing — restamping it
    // would walk the answer forward and make every closure read as the newest run's.
    rows.push({ ...row, seen: false, retiredAt: row.retiredAt ?? observationId });
  }

  for (const finding of found.values()) {
    rows.push({
      id: finding.id,
      store: finding.store,
      page: finding.page,
      class: finding.class,
      firstSeen: observationId,
      lastSeen: observationId,
      seen: true,
      retiredAt: null,
    });
  }

  rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    observationId,
    stores: { ...before.stores, ...Object.fromEntries(covered.map((s) => [s, observationId])) },
    rows,
  };
}

/**
 * Where the index is committed.
 *
 * **Not under `data/`.** That folder is gitignored — the log's reports are 181 MB and
 * are rebuilt from the sites — and this index is the one artefact of a run that cannot
 * be rebuilt from anything: the run that saw an id first is over. So it goes in a folder
 * of its own, whose name says what it holds, and it is in git because git history is
 * the archive the ADR chose instead of a file per run.
 */
export const RUN_LOG = new URL('../history/run-log.jsonl', import.meta.url);

/**
 * One JSON object per line: a header, then the rows in id order.
 *
 * A row that is still seen omits `last`, because it equals the observation the header
 * records for that row's store. That is not a byte saving — it is what makes `git log`
 * on this file readable. Written in full, every row of an unchanged corpus would be
 * rewritten by every run, and 60,000 rewritten lines is a diff that says nothing.
 *
 * @param {RunLog} log
 * @returns {string}
 */
export function encodeRunLog(log) {
  const header = {
    index: 'finding-run-log',
    observationId: log.observationId,
    stores: log.stores,
  };
  const lines = log.rows.map((row) => {
    const line = {
      id: row.id,
      store: row.store,
      page: row.page,
      class: row.class,
      first: row.firstSeen,
    };
    if (!row.seen) {
      line.last = row.lastSeen;
      // `gone` is the run that stopped seeing it, which `last` is one run short of
      // (ticket 78). It is on the retired rows only, so a run over an unchanged corpus
      // still rewrites no line.
      if (row.retiredAt) line.gone = row.retiredAt;
    }
    return JSON.stringify(line);
  });
  return [JSON.stringify(header), ...lines].join('\n');
}

/**
 * @param {string} text
 * @returns {RunLog}
 */
export function decodeRunLog(text) {
  const [first, ...lines] = text.split('\n').filter((line) => line.length > 0);
  const header = JSON.parse(first);

  return {
    observationId: header.observationId,
    stores: header.stores,
    rows: lines.map((line) => {
      const row = JSON.parse(line);
      const covering = header.stores[row.store];
      return {
        id: row.id,
        store: row.store,
        page: row.page,
        class: row.class,
        firstSeen: row.first,
        lastSeen: row.last ?? covering,
        seen: row.last === undefined,
        // `null` on a row written before this field existed. The honest answer: nothing
        // recorded which run stopped seeing it, so nothing reports one.
        retiredAt: row.gone ?? null,
      };
    }),
  };
}

/**
 * @param {URL} [url]
 * @returns {Promise<RunLog | null>} `null` where there is no index yet, which is the
 *   first run of a fresh clone and is not an error.
 */
export async function readRunLog(url = RUN_LOG) {
  try {
    return decodeRunLog(await readFile(url, 'utf8'));
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return null;
    throw error;
  }
}

/**
 * Written beside the index and renamed onto it, which is the one write in this repo that
 * has to be atomic: a run that aborts half way through must leave the previous index
 * whole. Every other artefact of a run is rebuilt by the next one; this one is the
 * record of the runs before it.
 *
 * @param {RunLog} log
 * @param {URL} [url]
 */
export async function writeRunLog(log, url = RUN_LOG) {
  await mkdir(new URL('.', url), { recursive: true });
  const partial = new URL(`${url.href}.partial`);
  await writeFile(partial, `${encodeRunLog(log)}\n`);
  await rename(partial, url);
}
