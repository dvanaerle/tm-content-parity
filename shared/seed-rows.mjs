/**
 * The one rule that reads a **cell** out of a **seed row** (`CONTEXT.md`).
 *
 * `data/10-store-seeds.json` is a row for each page and a cell for each of the
 * six stores. Who reads it: the crawler, the compare step, the api and the web
 * build. Ticket 38's review found two of them asking the same question with two
 * different conditions, so the question lives here now.
 */

/**
 * @typedef {{ prodUrl?: string, newUrl?: string } | null} Cell
 * @typedef {{ page: string, stores?: Record<string, Cell> }} SeedRow
 */

/**
 * The store's cell, when the store has the page on **both** sides.
 *
 * Axis A compares production against the new site. One side is nothing axis A
 * can check, so it is not a store page of this store for axis A's purpose. Two
 * shapes say the same thing and both count here. A null cell says the store does
 * not have the page, which is axis B's subject. An empty url says the seed step
 * found no counterpart — `veranda-configurator` carries empty strings on the
 * five non-nl stores.
 *
 * @param {SeedRow} row
 * @param {string} store
 * @returns {Cell}
 */
export function cellWithBothSides(row, store) {
  const cell = row.stores?.[store];
  if (!cell?.prodUrl || !cell.newUrl) return null;
  return cell;
}
