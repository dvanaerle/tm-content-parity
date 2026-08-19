/**
 * The store pages whose new-site Magento record is **not** shared with their block
 * sibling, read off the new site's admin grid by hand.
 *
 * This file is the **fact**. The rule that spends it is `./shared-pages.mjs`, and the
 * reasoning behind both is ADR 0025. They are two files because a person edits this one
 * on the grid's rhythm and the guard in the other exists to catch that edit.
 *
 * It states the **complement**, which is the short list: roughly 105 of `be`'s 131 pages
 * share a record with `nl`, so the pages that do not are about 29 lines. The complement is
 * sound because a record is shared inside a language block or not at all, so a store page
 * has exactly one possible partner — its sibling store.
 *
 * **A fact about today, never a plan.** An entry leaves this file the day the merge lands
 * in Magento. Removing it because a merge is intended grants a correction travel it cannot
 * yet make.
 *
 * **Nothing is keyed on `record`.** It is imported and rendered so that a person can find
 * the row in the grid again. Every id in this repo is content-addressed and expires on
 * purpose; a record id is not one, and a page moved between store views must not expire
 * findings whose content did not change.
 */

/**
 * One entry.
 *
 * @typedef {object} NotSharedPage
 * @property {string} key    `<store>/<path>`, as the grid spells the url key. The leading
 *                          `fr/` on a `be_fr` path may be there or not: it is a host
 *                          artefact, and it is the **only** thing normalised on the way to
 *                          a store page. Every key must resolve, or the suite fails and
 *                          names it — a stale key is never mapped onto a live page.
 * @property {number} record The Magento record id, for a reader with the grid open.
 * @property {string} reason Why this page is its own record. The next reader will ask.
 */

/**
 * The day the grid was read, as `YYYY-MM-DD`, or `null` while no reading exists.
 *
 * A store page whose first sighting in the run log is **later** than this reads as **not
 * shared**: the reading cannot have seen it, so it grants nothing. `null` is that rule at
 * its limit and makes **no** page shared — which is the only safe answer for an undated
 * complement, because an empty complement would otherwise claim that every page in both
 * blocks is shared.
 *
 * @type {string | null}
 */
export const TAKEN_ON = null;

/**
 * @type {NotSharedPage[]}
 */
export const NOT_SHARED_PAGES = [];
