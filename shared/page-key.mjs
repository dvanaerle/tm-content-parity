/**
 * The shape of the **page key**, and the one module allowed to read it.
 *
 * `compare/contract.mjs` says every reader treats the page value as an opaque
 * string. That is true of about 70 of its 82 readers, and it must stay true: the
 * key is in the finding id, in the mute key and in the override table, which is
 * append-only by policy. This module is the named exception, so the sentinel has
 * one definition instead of one for each reader who guessed.
 *
 * ADR 0001 asks three questions. The first two are plain: the module is pure, and
 * it imports no stage. The third — that more than one stage needs it — passes on
 * the **shape**, not on any one symbol: `crawl/seed-list.mjs` writes the form and
 * `compare/30-compare.mjs` reads it back, and each function has one caller today.
 * That is the weakest of the three answers, and it is written down rather than
 * asserted. If the shape ever has one reader again, the module belongs in that
 * reader's folder.
 */

import { STORES } from './stores.mjs';

/** @typedef {import('./stores.mjs').Store} Store */

/**
 * The home row. All six store roots key to it, whatever they declare: `be/` and
 * `de/` declare no alternate at all and `be/fr/` and `fr/` declare each other, so
 * the alternate rule alone would make four one-store rows out of one page and
 * detach every finding stored against `(home)` (ticket 53).
 */
export const HOME = '(home)';

const SENTINEL = /^\(([^)]+)\)/;

/**
 * The store of an **unanchored** page: one that production declares in no Dutch
 * alternate, so it is a row of its own store and is keyed `(store)path`.
 *
 * @param {string} page
 * @returns {Store | null} `null` on a page that production declares in Dutch.
 */
export function unanchoredStore(page) {
  const named = SENTINEL.exec(page)?.[1];
  return STORES.includes(/** @type {Store} */ (named)) ? /** @type {Store} */ (named) : null;
}

/**
 * The key of an unanchored page. `unanchoredStore()` reads back what this writes.
 *
 * The writer belongs beside the reader. While they sat in two files the sentinel
 * had two definitions and could drift, which is the thing this module exists to
 * stop. `pageKey()` in `crawl/seed-list.mjs` decides **which** pages are
 * unanchored; this decides what the key of one looks like.
 *
 * @param {Store} store
 * @param {string} path
 * @returns {string}
 */
export const unanchoredKey = (store, path) => `(${store})${path}`;

/**
 * Why this string cannot be a page key, or `null` when it can.
 *
 * Two characters are refused, and each one for a measured reason.
 *
 * A **colon** is the NTFS alternate-data-stream separator, so it breaks the
 * extract writer, the report writer and the static build alike. The old
 * generator's unused store-scoped fallback used one, and ticket 54 says do not
 * ship it. The sentinel is a parenthesis, which `(home)` has carried since
 * ticket 04 and which survives all three.
 *
 * A **double underscore** is what `reportFilename()` writes in place of a slash,
 * so the name is not injective: a key holding one collides with a page path.
 *
 * @param {string} page
 * @returns {string | null}
 */
export function unsafeReason(page) {
  if (page.includes(':')) return 'a colon is not a safe page key';
  if (page.includes('__')) return 'a double underscore is not a safe page key';
  return null;
}
