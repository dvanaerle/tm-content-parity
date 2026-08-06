/**
 * The two identity keys, and nothing else.
 *
 * They were in `extract.mjs` until ticket 35. They moved here for the same reason
 * that made `vocabulary.mjs` a separate file from `contract.mjs`: the **browser**
 * needs `linkKey()` now. The meta panel folds the host out of a canonical before it
 * compares it. It uses the folding of the links check, and not a second folding
 * that can become different. `extract.mjs` imports `node-html-parser`, and a React
 * island must not import that package.
 *
 * Both functions are pure and import nothing.
 */

/** A true trailing size suffix, per ticket 06. A bare `_N` is never one. */
const SIZE_SUFFIX = /[_-]\d{2,4}x\d{2,4}$/;

/**
 * Target identity from ticket 05. The page's own two hosts fold to one token. The
 * path becomes lower case and loses its trailing slash. The query stays, and the
 * fragment is removed.
 *
 * @param {URL} url
 * @param {{ prodHost?: string, newHost?: string }} hosts
 * @returns {string}
 */
export function linkKey(url, { prodHost, newHost } = {}) {
  const host = url.host.toLowerCase();
  const own = [prodHost, newHost].filter(Boolean).map((h) => h.toLowerCase());
  const token = own.includes(host) ? 'self' : host;
  const path = url.pathname.toLowerCase().replace(/\/+$/, '');
  // One page sends the same filter target as `6039,6040` and as `6039%2C6040`.
  // The encoding is invisible to a reader, so it folds like tier 1 does.
  const query = new URLSearchParams(url.search).toString();
  return `${token}${path}${query ? `?${query}` : ''}`;
}

/**
 * Image identity from ticket 06: the basename, lowercased, extension kept.
 * Full-path matching scores 2.8%, because production resizes through Cloudflare
 * and the two environments carry different catalog cache hashes.
 *
 * @param {string} src
 * @returns {string}
 */
export function imageKey(src) {
  const withoutQuery = src.split('#')[0].split('?')[0];
  let base = withoutQuery.split('/').pop() ?? '';
  try {
    base = decodeURIComponent(base);
  } catch {
    // A malformed escape keeps the raw basename.
  }
  base = base.toLowerCase();
  const extension = base.match(/\.[a-z0-9]{2,5}$/)?.[0] ?? '';
  const stem = extension ? base.slice(0, -extension.length) : base;
  return stem.replace(SIZE_SUFFIX, '') + extension;
}
