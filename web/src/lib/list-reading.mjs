import { STORE_LANGUAGE } from "./stores.mjs";
import { spansEveryStore } from "./classes.mjs";
import { crossesStore } from "./language-blocks.mjs";

/**
 * Why a difference cannot be pressed above the stores, or `null` where it can (ticket 04).
 *
 * It says **why** and **where instead**, because a refusal that only says no leaves an
 * editor with a row they cannot act on and no next move. It does not name the stores by id:
 * the row already names them, and this is a fact about the words rather than about which two
 * hold them.
 *
 * It is exported so a test can assert the whole sentence rather than a substring of it. A
 * reworded refusal is a change an editor meets, and it fails loudly here.
 */
export const TRANSLATED_ELSEWHERE =
  "The stores translate these words — decide it on one of the stores named.";

/**
 * @typedef {object} RowReading
 * @property {string | null} refusal Why this row may not be pressed here, or `null` where
 *   it may. Words and never a flag, so a caller cannot invent a refusal of its own.
 * @property {string | null} language What the row's two quoted strings are in, or `null`
 *   where the row spans languages and there is nothing true to declare.
 * @property {boolean} namesStore Whether the row and its pages say which store they are on.
 * @property {string[]} matchedFields Which fields the typed term was found in, and none where
 *   nobody typed one — the row's own account of why a search put it on screen.
 * @property {string | null} classHref Where the row's class label lands, or `null` where the
 *   screen offers no way into a class.
 * @property {(entry: import('./repeat-list.mjs').RepeatEntry) => string} pageHref Where one page of
 *   the row lands, on that page's **own** store and at this difference.
 */

/**
 * @typedef {object} ListReading
 * @property {string | null} store The store the list is about: an id on a store's screen,
 *   and `null` above the stores.
 * @property {boolean} acrossStores Whether the list spans stores rather than being one
 *   store's. Answered here so no screen reads it off `store` a second time.
 * @property {Map<string, object>} byFinding What the log says about each finding.
 * @property {boolean} searched Whether the list answers a question somebody typed.
 * @property {(store: string, page: string) => string} hrefOfPage Where a page lands, at no
 *   particular difference — what a header naming pages links to. A row asks
 *   `of(repeat).pageHref()` instead, which lands at the difference as well.
 * @property {(repeat: import('./repeat-list.mjs').Repeat) => RowReading} of Everything one row
 *   needs, in one call.
 */

/**
 * Everything one repeat list needs to know about the screen it is drawn on, derived from the
 * one fact a screen states about itself (ADR 0030).
 *
 * That fact is **which store the list is about**. It is not a convenience: a named store *is*
 * a language block and no store *is* all six, so the store is the half-and-whole distinction
 * of ADR 0021 written as one value. From it follow what a press may cross, what language the
 * quoted strings are in, and whether a row names its store — three answers that were derived
 * in five places from four spellings of this one fact, and whose rule moved twice in a month.
 *
 * The **refusal is still the screen's**, which is why the reading exists rather than being
 * the reversal of that rule: a screen that names its store has said everything about itself
 * the list needs, and it has said it in one word instead of four answers. What moved is where
 * the sentence is written.
 *
 * @param {object} input
 * @param {string | null} input.store The store the list is about, and `null` above the
 *   stores. **Stated and never defaulted**, for the reason the provider throws on a missing
 *   reading: *no store* is not neutral but a real screen — the wide one — so a screen that
 *   forgot to name its store would build a valid reading and draw a plausible page.
 * @param {Map<string, object>} input.byFinding The log, indexed by finding id.
 * @param {boolean} [input.searched] Whether a term was typed. It decides whether a row draws
 *   the fields the term matched, and it is the screen's own answer: only a search has one.
 * @param {(store: string, page: string, finding: string) => string} input.link Where a page
 *   of a row lands.
 * @param {((cls: string) => string) | null} [input.classLink] Where a row's class label
 *   lands. Absent where the screen offers no way into a class, and then the label is the
 *   plain statement it always was.
 * @returns {ListReading}
 */
export function listReading({
  store,
  byFinding,
  searched = false,
  link,
  classLink = null,
}) {
  if (store === undefined) throw new Error(NO_STORE);

  /*
   * The list's own language, where it has one. On a store's screen it answers for every row:
   * a difference has no report and no store in scope of its own, and two stores of a block
   * share a language, so a repeat crossing one is still in one. Above the stores there is no
   * such answer — six stores speak four languages — and each row answers for itself.
   */
  const language = store ? STORE_LANGUAGE[store] : null;

  return {
    store,
    /*
     * Whether the list spans stores. It is *no store of its own* and not *more than one store
     * in the corpus*: a block store's search reaches two stores and is still `nl`'s screen,
     * drawing `nl`'s page list and speaking Dutch. Answered here because a screen deriving it
     * from `store` again is the fifth site this reading exists to remove.
     */
    acrossStores: !store,
    byFinding,
    searched,
    hrefOfPage: (pageStore, page) => link(pageStore, page, null),
    of: (repeat) => ({
      refusal:
        store || spansEveryStore(repeat.class) ? null : TRANSLATED_ELSEWHERE,
      language: language ?? spokenOn(repeat),
      namesStore: !store || crossesStore(repeat),
      /*
       * The fields are the row's, and whether they are *drawn* is the screen's: on a list
       * nobody asked a question of, *in the page name* is two dead words about a match that
       * never happened. So the flag decides it here rather than at the cell.
       */
      matchedFields: searched ? (repeat.fields ?? []) : [],
      classHref: classLink?.(repeat.class) ?? null,
      pageHref: (entry) => link(entry.store, entry.page, entry.id),
    }),
  };
}

const NO_STORE =
  "A list reading needs the store its list is about. Pass the store id, or null above the" +
  " stores — no store is a screen and not a default.";

/**
 * What language a row's two quoted strings are in when the list has no answer (ticket 125,
 * widened by tickets 03 and 04).
 *
 * Asked of the row's **stores** and never assumed off the grouping: since ticket 04 an
 * `images` or `links` row groups over all six, which is four languages, so the first store no
 * longer speaks for the rest. It does not need to — the two strings on such a row are a
 * basename and a link target, which are in no language. One language between the stores and it
 * is theirs; more than one and there is none to declare, because telling a screen reader that
 * German content is Dutch is worse than telling it nothing.
 *
 * @param {import('./repeat-list.mjs').Repeat} repeat
 */
const spokenOn = (repeat) => {
  const spoken = new Set(repeat.stores.map((store) => STORE_LANGUAGE[store]));
  return spoken.size === 1 ? (spoken.values().next().value ?? null) : null;
};
