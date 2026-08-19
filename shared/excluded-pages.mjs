/**
 * Pages that are deliberately outside the content parity log (ticket 19).
 *
 * An **application page** is a page whose `<main>` holds a mounted JavaScript
 * application instead of content. It has no content unit, so there is nothing
 * to compare: its text is transient UI state, not something an editor writes.
 *
 * A page also belongs here when `skipReason()` in `compare/30-compare.mjs`
 * cannot reach it. That gate keeps an error page out of the log by its status,
 * and the 404 page itself defeats it — see `no-route`'s reason below (ticket 93).
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
    reason: 'Application page with no comparable editorial content.',
  },
  {
    page: 'no-route',
    reason:
      'The 404 page itself. Both sides answer 200 with a 404 page, so the status gate ' +
      'cannot see it, and comparing two error pages tells an editor nothing.',
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
