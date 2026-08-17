/**
 * A **language block** — two stores whose hreflang codes share a language
 * (`CONTEXT.md`).
 *
 * It is **derived** from `HREFLANG_STORE` and it is not a hand-written list, which
 * is what makes "may `de` and `uk` be a block" a question with an answer instead of
 * a debate: each of them is the only store of its language, so there is no second
 * store whose words could be compared with theirs.
 *
 * A block is a **view and not an axis**. See ADR 0017.
 */

import { HREFLANG_STORE } from './stores.mjs';

/** @typedef {import('./stores.mjs').Store} Store */

/** @typedef {{ language: string, stores: Store[] }} LanguageBlock */

/** @type {Map<string, Store[]>} */
const BY_LANGUAGE = new Map();
for (const [code, store] of Object.entries(HREFLANG_STORE)) {
  const language = code.slice(0, code.indexOf('-'));
  BY_LANGUAGE.set(language, [...(BY_LANGUAGE.get(language) ?? []), store]);
}

/**
 * Every block, in the order `HREFLANG_STORE` declares the languages, with the
 * stores of one in the order it declares them.
 *
 * @type {LanguageBlock[]}
 */
export const LANGUAGE_BLOCKS = [...BY_LANGUAGE]
  .filter(([, stores]) => stores.length > 1)
  .map(([language, stores]) => ({ language, stores }));

/**
 * The language a store speaks, which is the part of its hreflang code before the
 * region. `null` for a store the map does not know.
 *
 * @param {string} store
 * @returns {string | null}
 */
export function languageOf(store) {
  const code = Object.keys(HREFLANG_STORE).find(
    (one) => HREFLANG_STORE[/** @type {never} */ (one)] === store,
  );
  return code ? code.slice(0, code.indexOf('-')) : null;
}

/**
 * The block this store is in, or `null` where it is in none.
 *
 * @param {string} store
 * @returns {LanguageBlock | null}
 */
export function blockOf(store) {
  return (
    LANGUAGE_BLOCKS.find((block) => block.stores.includes(/** @type {never} */ (store))) ?? null
  );
}

/**
 * The other store of this store's block, or `null` where it has no block.
 *
 * It answers with **one** store, because a block holds two — which
 * `language-blocks.test.mjs` asserts rather than this function assuming. A third
 * store of one language would make the question unanswerable, so it answers `null`
 * there rather than choosing.
 *
 * @param {string} store
 * @returns {Store | null}
 */
export function siblingOf(store) {
  const others = blockOf(store)?.stores.filter((one) => one !== store) ?? [];
  return others.length === 1 ? others[0] : null;
}
