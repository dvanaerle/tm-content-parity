import { STORES } from '../../../compare/vocabulary.mjs';
import { languageOf } from './language-blocks.mjs';

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

/**
 * The language the **content** of a store is written in, for the `lang` a scraped cell
 * declares (ticket 125).
 *
 * It is not a second interface language and it must never become the seam one is hung on:
 * ADR 0014 keeps the chrome English on all six stores, and this is a fact about the text
 * inside a cell, in the way `data-side` is a fact about which site the text came from.
 *
 * **Derived and not written out.** `languageOf()` cuts the language out of the store's
 * hreflang code, which is where production says it, and the language blocks are built from
 * the same walk — so a hand-written map here would be a second place for *what does `be_fr`
 * speak* to be answered, and the two could disagree.
 *
 * It is the bare language and not the hreflang code, which is what lets the sibling tab
 * declare one language over its two columns: a block is two stores of one language in two
 * regions, so `nl-NL` and `nl-BE` would make one row claim two languages for text that
 * `blocks.mjs` compares precisely because it is in one.
 *
 * @type {Record<string, string>}
 */
export const STORE_LANGUAGE = Object.fromEntries(STORES.map((store) => [store, languageOf(store)]));

// The same guard the names get, for the same reason: `lang={undefined}` is an attribute
// React silently omits, so a seventh store would announce its German content in English
// and nothing would say so. A missing language is a build failure.
const unspoken = STORES.filter((store) => !STORE_LANGUAGE[store]);
if (unspoken.length > 0) {
  throw new Error(
    `No language for ${unspoken.join(', ')}. Add its hreflang code to shared/stores.mjs.`,
  );
}
