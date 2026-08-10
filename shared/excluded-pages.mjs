/**
 * Pages that are deliberately outside the content parity log (ticket 19).
 *
 * An **application page** is a page whose `<main>` holds a mounted JavaScript
 * application instead of content. It has no content unit, so there is nothing
 * to compare: its text is transient UI state, not something an editor writes.
 *
 * Exact page keys, never a pattern. A pattern such as `/configurator/` would
 * also swallow a future `configurator-vergelijken` content page. Every entry
 * carries the reason, because the next reader will ask.
 *
 * The web build lists these under "Not checked" with the reason, so an
 * excluded page is visibly excluded rather than silently absent. Ticket 56 put
 * two more kinds in that list beside this one, and
 * `web/src/lib/not-checked.mjs` does the merge.
 */
export const EXCLUDED_PAGES = [
  {
    page: 'veranda-configurator',
    reason:
      'Application page. `<main>` holds one PageBuilder html block that mounts '
      + 'Dinoxi_ConfiguratorBff on `#configurator-root`; it has no content. '
      + 'Production answers 404 on this key and on every other configurator key, '
      + 'so there is no counterpart to compare it with.',
  },
];

const BY_PAGE = new Map(EXCLUDED_PAGES.map((entry) => [entry.page, entry]));

/**
 * @param {string} page
 * @returns {boolean}
 */
export function isExcludedPage(page) {
  return BY_PAGE.has(page);
}

/**
 * @param {string} page
 * @returns {string | null}
 */
export function exclusionReason(page) {
  return BY_PAGE.get(page)?.reason ?? null;
}
