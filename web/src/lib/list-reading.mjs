import { STORE_LANGUAGE } from './stores.mjs';
import { crossesStore, spansEveryStore } from './view.mjs';

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
  'The stores translate these words — decide it on one of the stores named.';

/**
 * @typedef {object} RowReading
 * @property {string | null} refusal Why this row may not be pressed here, or `null` where
 *   it may. Words and never a flag, so a caller cannot invent a refusal of its own.
 * @property {string | null} language What the row's two quoted strings are in, or `null`
 *   where the row spans languages and there is nothing true to declare.
 * @property {boolean} namesStore Whether the row and its pages say which store they are on.
 * @property {string | null} classHref Where the row's class label lands, or `null` where the
 *   screen offers no way into a class.
 * @property {(entry: import('./view.mjs').RepeatEntry) => string} pageHref Where one page of
 *   the row lands, on that page's **own** store and at this difference.
 */

/**
 * @typedef {object} ListReading
 * @property {string | null} store The store the list is about: an id on a store's screen,
 *   and `null` above the stores.
 * @property {Map<string, object>} byFinding What the log says about each finding.
 * @property {boolean} searched Whether the list answers a question somebody typed.
 * @property {(repeat: import('./view.mjs').Repeat) => RowReading} of Everything one row
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
 * @param {string | null} [input.store] The store the list is about, and `null` above the
 *   stores. Defaulted to none because that is the wide reading, and a screen that forgets to
 *   name its store refuses presses rather than offering ones it should not.
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
export function listReading({ store = null, byFinding, searched = false, link, classLink = null }) {
  /*
   * The list's own language, where it has one. On a store's screen it answers for every row:
   * a difference has no report and no store in scope of its own, and two stores of a block
   * share a language, so a repeat crossing one is still in one. Above the stores there is no
   * such answer — six stores speak four languages — and each row answers for itself.
   */
  const language = store ? STORE_LANGUAGE[store] : null;

  return {
    store,
    byFinding,
    searched,
    of: (repeat) => ({
      refusal: store || spansEveryStore(repeat.class) ? null : TRANSLATED_ELSEWHERE,
      language: language ?? spokenOn(repeat),
      namesStore: !store || crossesStore(repeat),
      classHref: classLink?.(repeat.class) ?? null,
      pageHref: (entry) => link(entry.store, entry.page, entry.id),
    }),
  };
}

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
 * @param {import('./view.mjs').Repeat} repeat
 */
const spokenOn = (repeat) => {
  const spoken = new Set(repeat.stores.map((store) => STORE_LANGUAGE[store]));
  return spoken.size === 1 ? (spoken.values().next().value ?? null) : null;
};
