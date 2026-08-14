/**
 * The status pass over a finished seed list (ticket 53, folding in ticket 22).
 *
 * It is **not** the generator. The generator writes a page list and makes no
 * live request; this is a second step over that list, and it writes its own
 * file. Two things in one script is what made the old seed file half page list
 * and half stale measurement: all 451 of its `prodStatus` values were 0, because
 * production was in maintenance mode for the whole of ticket 04's run.
 *
 * This module is pure. `crawl/11-page-status.mjs` is the run.
 */

import { STORES } from './seed-list.mjs';

/** @typedef {'prod' | 'new'} Side */

/**
 * Every url the pass has to ask about: both sides of every store page.
 *
 * @param {import('./seed-list.mjs').SeedRow[]} rows
 * @returns {{ store: string, page: string, side: Side, url: string }[]}
 */
export function statusTargets(rows) {
  const targets = [];
  for (const row of rows) {
    for (const store of STORES) {
      const cell = row.stores?.[store];
      if (!cell) continue;
      targets.push({ store, page: row.page, side: 'prod', url: cell.prodUrl });
      targets.push({ store, page: row.page, side: 'new', url: cell.newUrl });
    }
  }
  return targets;
}

/**
 * @typedef {object} StatusResult
 * @property {string} store
 * @property {string} page
 * @property {Side} side
 * @property {string} url
 * @property {number} status `0` says that no answer arrived at all.
 * @property {string} [redirect] The `location` header, on a 3xx.
 */

const EMPTY = {
  pairs: 0,
  prodOk: 0,
  prodRedirect: 0,
  prodMissing: 0,
  prodFailed: 0,
  newOk: 0,
  newRedirect: 0,
  newMissing: 0,
  newFailed: 0,
};

/**
 * The counts of one measurement, for each store.
 *
 * The two sides are counted apart. Production is the reference and the new site
 * is the side under test, so one number over both would hide which of the two
 * answered.
 *
 * @param {StatusResult[]} results
 * @returns {Record<string, typeof EMPTY>}
 */
export function summariseStatus(results) {
  const counts = {};
  for (const result of results) {
    const store = (counts[result.store] ??= { ...EMPTY });
    if (result.side === 'prod') store.pairs++;
    const side = result.side;
    if (result.status === 200) store[`${side}Ok`]++;
    else if (result.status >= 300 && result.status < 400) store[`${side}Redirect`]++;
    else if (result.status === 404) store[`${side}Missing`]++;
    else store[`${side}Failed`]++;
  }
  return counts;
}

const SIDE_NAME = { prod: 'production', new: 'the new site' };

/**
 * Every side of every store where nothing answered at all.
 *
 * A column of failures reads like a measurement and is not one. Ticket 22 found
 * 451 `prodStatus` values of 0 in the seed file, and nothing in the run said so.
 *
 * @param {Record<string, ReturnType<typeof summariseStatus>[string]>} counts
 * @returns {string[]}
 */
export function statusDisagreements(counts) {
  const said = [];
  for (const [store, side] of Object.entries(counts)) {
    for (const name of /** @type {Side[]} */ (['prod', 'new'])) {
      const answered = side[`${name}Ok`] + side[`${name}Redirect`] + side[`${name}Missing`];
      if (answered === 0 && side[`${name}Failed`] > 0) {
        said.push(
          `${store}: no url of ${SIDE_NAME[name]} answered, over ${side[`${name}Failed`]} pages`,
        );
      }
    }
  }
  return said;
}
