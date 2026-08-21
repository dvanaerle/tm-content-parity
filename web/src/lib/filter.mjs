/**
 * **Narrowing** — the rule for what an editor has asked to see, wherever they ask it.
 *
 * *Filter* is a glossary term, and this is the one place it is implemented. The modules
 * that import from here have nothing else in common: a content view narrowing to one
 * class, a dashboard narrowing its page list, a repeat list selecting on a pill, a search
 * index selecting before it groups. What they share is the question, not the shape they
 * ask it of, so what lives here is the question and never the list.
 *
 * **A filter never moves a count.** Every function below decides what is on screen and
 * none of them touches a denominator, a bar or a roll-up (spec 32, decision 25). That is
 * the one rule this module exists to state once, and it is why `classCounts()` — a
 * pill-ordering rule — is here beside the pills it orders rather than beside anything
 * that counts.
 */

/**
 * @typedef {object} ContentFilter
 * @property {string[]} classes  Empty means every class. The **only** narrowing left:
 *                               *Differences only* went out with ticket 79, whose
 *                               marker makes the default a differences view and keeps
 *                               the agreeing rows one click away instead of removing
 *                               them.
 */

/** @type {ContentFilter} */
export const NO_FILTER = Object.freeze({ classes: Object.freeze([]) });

/** @param {ContentFilter} filter */
export const isNarrowed = (filter) => filter.classes.length > 0;

/**
 * Add or remove one item. The dashboard holds a bare class list and the content view
 * holds a whole filter, so the set operation is separate from the filter it lives in:
 * a caller with no wrapper to carry must not have to invent one.
 *
 * @template T
 * @param {readonly T[]} list
 * @param {T} item
 * @returns {T[]} A new list. The caller holds the old one in React state.
 */
export function toggleIn(list, item) {
  return list.includes(item) ? list.filter((held) => held !== item) : [...list, item];
}

/**
 * @param {ContentFilter} filter
 * @param {string} cls
 * @returns {ContentFilter} A new filter. The caller holds the old one in React state.
 */
export function toggleClass(filter, cls) {
  return { ...filter, classes: toggleIn(filter.classes, cls) };
}

/**
 * A tally of classes, in the order the pills are drawn: the biggest first, and ties by name.
 *
 * The **tie-break is why this is one function** and was three. The content view sorted by
 * count and then by name; the two dashboards sorted by count alone and left equal counts in
 * whatever order the tally was built in — so two pills carrying the same number could swap
 * places between one store and the next, and between one render and the next. A pill strip
 * an editor cannot learn the shape of is a strip they read from scratch every time.
 *
 * It takes the **tally** and not the items, because what is being counted is genuinely
 * different at each caller: a record already summed off the page summaries, the flat entries
 * of a search index, the rows of one page. Counting those is three loops and no duplication;
 * ordering them is one rule.
 *
 * @param {Record<string, number> | Map<string, number>} tally
 * @returns {{ class: string, count: number }[]}
 */
export function classCounts(tally) {
  const entries = tally instanceof Map ? [...tally] : Object.entries(tally);
  return entries
    .map(([cls, count]) => ({ class: cls, count }))
    .sort((a, b) => b.count - a.count || a.class.localeCompare(b.class));
}

/**
 * Whether the pills let this class through.
 *
 * The whole of what a class pill means, in one place: **empty means every class**, which is
 * what an untouched filter says rather than a filter matching nothing. It is asked of a
 * repeat here and of an index entry by `searchStore()`, which selects on the class before
 * grouping when the search box is empty (ticket 09) — two callers over two shapes, and the
 * same question. Written once so that the filter and the selector cannot come to disagree
 * about what an editor pressed.
 *
 * @param {string[]} classes
 * @param {string} cls
 */
export const classIsOn = (classes, cls) => classes.length === 0 || classes.includes(cls);

/**
 * The dashboard's side of the same filter (spec 32, decision 26). Clicking a class
 * pill narrows the page list to the pages carrying it — and, exactly as on the page,
 * it moves no bar and no roll-up.
 *
 * @template {{ summary: { byClass: Record<string, number> } }} P
 * @param {P[]} pages
 * @param {string[]} classes
 * @returns {P[]}
 */
export function pagesWithClasses(pages, classes) {
  if (classes.length === 0) return pages;
  return pages.filter((page) => classes.some((cls) => (page.summary.byClass[cls] ?? 0) > 0));
}

/**
 * The same narrowing for ticket 83's priority, and it **combines** with the class filter
 * rather than replacing it: two calls over one list, so an editor asking for the
 * high-priority `copy` pages gets the pages that satisfy both.
 *
 * The priority arrives as an **accessor** and not off the page, which is the one way this
 * differs from the filter above. A class count is a property of the snapshot and sits on
 * `summary`; a priority is an annotation an editor wrote afterwards, so it is derived from
 * the log and only the caller holding that derivation can answer for a page.
 *
 * An **unannotated page is never kept**. There is no `normal` in the list, so absence is
 * not a value that can be filtered for — selecting every priority still narrows the list
 * to the pages somebody has annotated, which is the honest reading of the question.
 *
 * @template P
 * @param {P[]} pages
 * @param {string[]} priorities
 * @param {(page: P) => string | null} priorityOf
 * @returns {P[]}
 */
export function pagesWithPriorities(pages, priorities, priorityOf) {
  if (priorities.length === 0) return pages;
  return pages.filter((page) => priorities.includes(/** @type {string} */ (priorityOf(page))));
}
