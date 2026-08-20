import { loadSearchIndex, storesInLog } from '../../lib/reports.mjs';

/**
 * One store's search index, as a file the build writes (ticket 82).
 *
 * Static, like every other route here: the hosted log carries the index beside its pages
 * and search needs no service to answer.
 *
 * **One file per store, and still no all-stores file** (ticket 03 of cross-store reuse).
 * There is an all-stores *screen* now, and it fetches these six and merges them in the
 * browser — `mergeIndexes()`. A seventh route serving the merge would be the same bytes
 * emitted twice, and it would be the one file a store dashboard could not reuse: a store
 * fetches its own and its sibling's, and the browser cache is what makes the wide screen
 * cheap for an editor who was already searching.
 *
 * It sits at `/search-index/<store>.json` and not under `/<store>/`, where the catch-all
 * `[...page].astro` would be its neighbour: a page key can hold a slash, so a route under
 * the store is a route in the same space the page keys live in.
 */
export async function getStaticPaths() {
  const stores = await storesInLog();
  return stores.map((store) => ({ params: { store } }));
}

/** @param {{ params: { store: string } }} context */
export async function GET({ params }) {
  return new Response(JSON.stringify(await loadSearchIndex(params.store)), {
    headers: { 'content-type': 'application/json' },
  });
}
