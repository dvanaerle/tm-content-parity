/**
 * The two identity keys, and nothing else.
 *
 * The crawl and the meta panel must fold a host the same way. One folding, and
 * not two that become different. Two stages read this file, thus it is in
 * `shared/`: pure, and it imports nothing. See ADR 0001.
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
