import { STORES } from '../../../compare/vocabulary.mjs';

/**
 * The name of each store view, for the one place a reader needs the id explained.
 * The id itself stays the label everywhere (`CONTEXT.md`).
 *
 * The interface is English on every store, including `nl` and `de`. The log's
 * question is whether two strings match, which needs no comprehension of either —
 * that rule is ticket 38's and it survives; only the language it names changed
 * (ADR 0014).
 *
 * @type {Record<string, string>}
 */
const NAMES = {
  nl: 'Netherlands',
  be: 'Belgium (Dutch)',
  be_fr: 'Belgium (French)',
  de: 'Germany',
  fr: 'France',
  uk: 'United Kingdom',
};

// `STORES` holds the list of stores and this file only names them. A seventh store
// with no name here gave the switcher a `title` of `undefined`, which is a silent
// hole in the interface. The build stops on it instead.
const unnamed = STORES.filter((store) => !NAMES[store]);
if (unnamed.length > 0) {
  throw new Error(`No name for ${unnamed.join(', ')}. Add it to web/src/lib/stores.mjs.`);
}

/** @type {Record<string, string>} */
export const STORE_NAME = Object.fromEntries(STORES.map((store) => [store, NAMES[store]]));
