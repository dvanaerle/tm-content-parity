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
 *
 * It stays in `web/` and not in `shared/`, for the reason `blocks.mjs` beside it
 * does: ADR 0001 asks three questions and this fails the third — only the web layer
 * reads it. `HREFLANG_STORE` is the half two stages read, and that is what is in
 * `shared/stores.mjs`. `shared/` is not a place for pure code; it is a place for pure
 * code that two stages read.
 */

import { HREFLANG_STORE } from '../../../shared/stores.mjs';

/** @typedef {import('../../../shared/stores.mjs').Store} Store */

/** @typedef {{ language: string, stores: Store[] }} LanguageBlock */

/**
 * The language half of an hreflang code, which is the part before the region.
 *
 * One place, because the derivation below and `languageOf()` must never disagree
 * about where a code is cut.
 *
 * **A code with no region is the whole language.** `slice(0, indexOf('-'))` answered `d`
 * for `de`, silently — a missing separator is `-1` and that drops the last letter. Nothing
 * in `HREFLANG_STORE` is region-less today, and since ticket 125 the answer is written on a
 * cell as `lang`, where `d` is a language tag a screen reader would try to honour.
 *
 * @param {string} code
 */
const languageIn = (code) => code.split('-')[0];

/** @type {Map<string, Store[]>} */
const BY_LANGUAGE = new Map();
/** @type {Map<Store, string>} */
const LANGUAGE_BY_STORE = new Map();
for (const [code, store] of Object.entries(HREFLANG_STORE)) {
  const language = languageIn(code);
  BY_LANGUAGE.set(language, [...(BY_LANGUAGE.get(language) ?? []), store]);
  LANGUAGE_BY_STORE.set(store, language);
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
 * It reads the same walk of `HREFLANG_STORE` the blocks are built from, rather than
 * scanning the map a second time: two walks are two chances to cut a code
 * differently.
 *
 * @param {string} store
 * @returns {string | null}
 */
export function languageOf(store) {
  return LANGUAGE_BY_STORE.get(/** @type {Store} */ (store)) ?? null;
}

/**
 * The block this store is in, or `null` where it is in none.
 *
 * @param {string} store
 * @returns {LanguageBlock | null}
 */
export function blockOf(store) {
  return LANGUAGE_BLOCKS.find((block) => block.stores.some((one) => one === store)) ?? null;
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
