/**
 * The two identity keys, and nothing else.
 *
 * They lived in `extract.mjs` until ticket 35, and they moved here for the same
 * reason `vocabulary.mjs` split out of `contract.mjs`: the **browser** needs
 * `linkKey()` now. The meta panel host-folds a canonical before it compares it,
 * and it does so with the folding the links check already uses rather than a
 * second one that would drift from it. `extract.mjs` imports `node-html-parser`,
 * which has no business in a React island.
 *
 * Both functions are pure and import nothing.
 */

/** A true trailing size suffix, per ticket 06. A bare `_N` is never one. */
const SIZE_SUFFIX = /[_-]\d{2,4}x\d{2,4}$/;

/**
 * Target identity from ticket 05: the page's own two hosts fold to one token,
 * the path is lowercased and loses its trailing slash, the query stays and the
 * fragment goes.
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
