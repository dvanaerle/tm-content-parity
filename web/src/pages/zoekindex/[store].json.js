import { loadSearchIndex, storesInLog } from '../../lib/reports.mjs';

/**
 * One store's search index, as a file the build writes (ticket 82).
 *
 * Static, like every other route here: the hosted log carries the index beside its pages
 * and search needs no service to answer. There is no all-stores route and there is not
 * meant to be — ticket 38 settled that there is no all-stores surface, and a cross-store
 * index would be the back door to one.
 *
 * It sits at `/zoekindex/<store>.json` and not under `/<store>/`, where the catch-all
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
