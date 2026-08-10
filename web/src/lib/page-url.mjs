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
 * The link to one page of the log.
 *
 * @param {string} store
 * @param {string} page
 * @returns {string}
 */
export const pageHref = (store, page) => `/${store}/${encodePage(page)}/`;

/**
 * The re-check endpoint for one page. `api/server.mjs` decodes it.
 *
 * @param {string} store
 * @param {string} page
 * @returns {string}
 */
export const recheckPath = (store, page) => `/api/recheck/${store}/${encodePage(page)}`;
