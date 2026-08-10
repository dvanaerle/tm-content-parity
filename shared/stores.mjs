/**
 * The six store views, and nothing else.
 *
 * `crawl/` builds the seed list against them and `compare/` reads a store out of
 * a report filename against them. Two stages, thus `shared/`: pure, and it
 * imports nothing. See ADR 0001.
 *
 * One list. The log's most load-bearing piece of vocabulary must not be able to
 * drift between two copies of itself.
 */

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} Store */

/** In the order every table in the log uses. */
export const STORES = /** @type {Store[]} */ (['nl', 'be', 'be_fr', 'de', 'fr', 'uk']);
