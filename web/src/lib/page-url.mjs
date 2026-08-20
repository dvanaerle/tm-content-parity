/**
 * A page key made into a URL.
 *
 * Three builders held the key raw: two links on the dashboard and the re-check
 * fetch. Nothing broke, because every key was a Dutch url key or `(home)` and
 * neither needs encoding. The set of keys is wider now, so the builders state the
 * encoding instead of depending on the characters the input happens to hold
 * (ticket 54). Measured: encoding changes 0 of the 550 committed keys.
 *
 * The encoding is **per segment**. A page key can hold a slash, as
 * `faq/productinformatie` does, and the Astro route is a rest parameter. So the
 * slash is a route separator and must not become `%2F`.
 *
 * @param {string} page
 * @returns {string}
 */
const encodePage = (page) => page.split('/').map(encodeURIComponent).join('/');

/**
 * The finding a link into the log names (ticket 109).
 *
 * It is a **finding id** and not a row anchor. The dashboard holds finding ids; the
 * row anchor `p12` is production's document position, which only the page's own report
 * knows. So the link names the finding and the page resolves it.
 */
export const FINDING_PARAM = 'finding';

/**
 * The screen a link came from: the dashboard's own query string, carried through so
 * the way back is that screen and not a bare store.
 *
 * It is read by nothing but `screenFromSearch()`, which keeps the keys it knows and
 * drops the rest. That is what makes it safe to put a value off the address bar into
 * a link the page draws.
 */
export const BACK_PARAM = 'back';

/**
 * The link to one page of the log.
 *
 * @param {string} store
 * @param {string} page
 * @param {object} [asks]
 * @param {string | null} [asks.finding]  A finding id: the page lands on it.
 * @param {string | null} [asks.back]     The dashboard's query string, for the way back.
 * @returns {string}
 */
export function pageHref(store, page, { finding = null, back = null } = {}) {
  const asked = new URLSearchParams();
  if (finding) asked.set(FINDING_PARAM, finding);
  if (back) asked.set(BACK_PARAM, back);

  const query = asked.toString();
  return `/${store}/${encodePage(page)}/${query ? `?${query}` : ''}`;
}

/**
 * The finding a link named, or null.
 *
 * @param {string} search  `location.search`, with the `?`.
 * @returns {string | null}
 */
export const findingInSearch = (search) => new URLSearchParams(search).get(FINDING_PARAM) || null;

/**
 * The dashboard query a link carried back, or null. **Unvalidated**: the caller hands
 * it to `screenFromSearch()`, which is the one thing that decides what a screen is.
 *
 * @param {string} search  `location.search`, with the `?`.
 * @returns {string | null}
 */
export const backInSearch = (search) => new URLSearchParams(search).get(BACK_PARAM) || null;

/**
 * The link back to a store's dashboard, on the screen it was left on.
 *
 * @param {string} store
 * @param {string | null} [back]  A query string, already narrowed to the keys the
 *                                dashboard knows. Pass what `searchFromScreen()` wrote.
 * @returns {string}
 */
export const storeHref = (store, back = null) => `/${store}/${back ? `?${back}` : ''}`;

/**
 * The search screen **above** the stores (ticket 03).
 *
 * It is not under a store route, and that is the whole of what this one line records: a
 * result that can return a `uk` row has stopped being a view of `nl`, so a URL saying it is
 * one would be a lie a Back button then repeats. It is also not in the page keys' space,
 * for the reason `search-index/` is not: the store route's catch-all is a rest parameter
 * and a page key can hold a slash.
 *
 * The screen it carries is `searchFromScreen()`'s — the same query string the store
 * dashboard writes, read by the same `screenFromSearch()`. There is no second contract, so
 * a class query is that screen with `classes` set and `query` empty.
 *
 * @param {string | null} [screen]  A query string, already narrowed to the keys a screen
 *                                  knows. Pass what `searchFromScreen()` or
 *                                  `searchForClass()` wrote.
 * @returns {string}
 */
export const searchHref = (screen = null) => `/search/${screen ? `?${screen}` : ''}`;

/**
 * The re-check endpoint for one page. `api/server.mjs` decodes it.
 *
 * @param {string} store
 * @param {string} page
 * @returns {string}
 */
export const recheckPath = (store, page) => `/api/recheck/${store}/${encodePage(page)}`;
