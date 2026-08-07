import { STORES } from '../../../compare/vocabulary.mjs';

/**
 * The Dutch name of each store view, for the one place a reader needs the id
 * explained. The id itself stays the label everywhere (`CONTEXT.md`).
 *
 * The interface is Dutch on every store, including `de` and `uk`. The log's
 * question is whether two strings match, which needs no comprehension of either
 * (ticket 38).
 *
 * @type {Record<string, string>}
 */
const NAMES = {
  nl: 'Nederland',
  be: 'België (Nederlands)',
  be_fr: 'België (Frans)',
  de: 'Duitsland',
  fr: 'Frankrijk',
  uk: 'Verenigd Koninkrijk',
};

// `STORES` holds the list of stores and this file only names them. A seventh store
// with no name here gave the switcher a `title` of `undefined`, which is a silent
// hole in the interface. The build stops on it instead.
const unnamed = STORES.filter((store) => !NAMES[store]);
if (unnamed.length > 0) {
  throw new Error(`No Dutch name for ${unnamed.join(', ')}. Add it to web/src/lib/stores.mjs.`);
}

/** @type {Record<string, string>} */
export const STORE_NAME = Object.fromEntries(STORES.map((store) => [store, NAMES[store]]));
