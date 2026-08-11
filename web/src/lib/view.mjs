/**
 * What is on screen in the content view, and nothing about what it adds up to
 * (ticket 36).
 *
 * The content view is the whole page in document order. An editor narrows it to do
 * a pass of one class, and that narrowing is the judgement in this feature, so it
 * lives here as a pure function rather than inside a component.
 *
 * **A filter never moves a count.** This module is given the derived findings and
 * it reads them. It returns rows, the classes the page carries, and how many rows
 * the page has. It returns no bar, no denominator and no closed count, because a
 * filterable denominator would make two people quoting "the number" mean different
 * things (spec 32, decision 25).
 *
 * The noise toggle is **not** part of the filter. It belongs to the whole ledger
 * and it survives a click on *filter wissen*: an editor who asked to see the muted
 * rows did not ask a question about classes.
 */

/**
 * @typedef {object} ContentFilter
 * @property {boolean} onlyDifferences  The inverse control. Matched rows are the default.
 * @property {string[]} classes         Empty means every class.
 */

/** @type {ContentFilter} */
export const NO_FILTER = Object.freeze({ onlyDifferences: false, classes: Object.freeze([]) });

/** @param {ContentFilter} filter */
export const isNarrowed = (filter) => filter.onlyDifferences || filter.classes.length > 0;

/**
 * What *Alleen verschillen* must draw. A class filter already implies the differences
 * — `prepareRows` drops every matched row as soon as a class is on — so an unticked
 * box over a differences-only view is a control that says one thing while the view
 * does another. While a class is on the box is on, and it is disabled, because
 * turning it off would change nothing.
 *
 * @param {ContentFilter} filter
 * @returns {{ checked: boolean, disabled: boolean }}
 */
export function onlyDifferencesState(filter) {
  const impliedByClass = filter.classes.length > 0;
  return { checked: impliedByClass || filter.onlyDifferences, disabled: impliedByClass };
}

/**
 * Add or remove one item. The dashboard holds a bare class list and the content view
 * holds a whole filter, so the set operation is separate from the filter it lives in:
 * a caller with no `onlyDifferences` to carry must not have to invent one.
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
 * One row of the content view: a `DiffRow` with both sides resolved to their
 * unit and its finding attached.
 *
 * @typedef {import('../../../compare/contract.mjs').ContentUnit} ContentUnit
 *
 * @typedef {object} ContentRow
 * @property {string} key               The anchor. `p<n>` is production's document
 *                                     position, `n<n>` the new site's on a row that
 *                                     exists there only. See `anchorKey()`.
 * @property {string | null} class
 * @property {boolean} equal            Both sides are present and their `norm` is the
 *                                     same string. The renderer must not diff it.
 * @property {number | null} score
 * @property {object | null} finding    The **derived** finding, with `state` and `shown`.
 * @property {ContentUnit | null} prod
 * @property {ContentUnit | null} new
 */

/**
 * @param {object} input
 * @param {import('../../../compare/contract.mjs').DiffRow[]} input.rows
 * @param {object[]} input.findings   Derived findings, from `derivePageState()`.
 * @param {{ production: ContentUnit[], new: ContentUnit[] }} input.elements
 * @param {ContentFilter} input.filter
 * @param {boolean} input.showNoise   The ledger's toggle: hidden classes and muted rows.
 * @returns {{ rows: ContentRow[], total: number, classes: { class: string, rows: number }[] }}
 *   `total` counts the rows the page has under the noise toggle, so the interface can
 *   say *42 van 310 regels*. It is a row count and never a finding count.
 */
export function prepareRows({ rows, findings, elements, filter, showNoise }) {
  const byId = new Map(findings.map((finding) => [finding.id, finding]));

  /** @type {ContentRow[]} */
  const onThePage = [];
  for (const row of rows) {
    const finding = row.finding ? byId.get(row.finding) ?? null : null;

    // A muted finding stays visible behind the toggle: muting is not deleting, and
    // an editor who muted a class by mistake must be able to find it again.
    const noise = Boolean(row.class) && !(finding?.shown && finding.state !== 'muted');
    if (noise && !showNoise) continue;

    const prod = row.prod === null ? null : elements.production[row.prod] ?? null;
    const next = row.new === null ? null : elements.new[row.new] ?? null;

    onThePage.push({
      key: anchorKey(prod, next),
      // The word diff is the cost of this view, and two identical strings are the
      // largest part of it (ticket 68). The comparison of the two `norm` strings is
      // the whole rule: a row can hold `heading-level` or `tag-changed` and still
      // agree about every word, and that row is not worth a table either.
      equal: prod !== null && next !== null && prod.norm === next.norm,
      class: row.class,
      score: row.score,
      finding,
      prod,
      new: next,
    });
  }

  return {
    // A class filter implies the differences: an editor narrowing to `copy` asked
    // for the copy edits, not for the copy edits inside the whole document.
    rows: isNarrowed(filter) ? onThePage.filter((row) => matches(row, filter)) : onThePage,
    total: onThePage.length,
    classes: classCounts(onThePage),
  };
}

/**
 * A row's anchor, and what a hash link in the log points at (ticket 68).
 *
 * It names **where the unit is in the document**, from ticket 34's shared counter,
 * and never where the row is in the row list. A row list is a view: a filter, a
 * collapsed run of equal rows, or one paragraph the new site invented above this one
 * all move a position in it, and every one of them would carry a saved link to the
 * wrong row.
 *
 * Production is the reference here as everywhere, so a two-sided row takes
 * production's position. The two documents count on their own, thus a row that
 * exists on the new site only takes the other letter and the two can never collide.
 *
 * @param {ContentUnit | null} prod
 * @param {ContentUnit | null} next
 * @returns {string}
 */
function anchorKey(prod, next) {
  return prod ? `p${prod.index}` : `n${next?.index}`;
}

/** The shape `anchorKey()` writes, and nothing else. */
const ROW_ANCHOR = /^[pn]\d+$/;

/**
 * The row a hash link names, or null (ticket 68).
 *
 * **A jump is a request to read that one row**, so the row it lands on opens. The
 * clamp is what makes a jump land somewhere legible, and a reader who followed a
 * link to a row and then found four lines of it would have to open it by hand every
 * time.
 *
 * @param {string | null | undefined} hash  `location.hash`, with the `#`.
 * @returns {string | null}
 */
export function rowKeyFromHash(hash) {
  const key = (hash ?? '').replace(/^#/, '');
  return ROW_ANCHOR.test(key) ? key : null;
}

/**
 * @param {ContentRow} row
 * @param {ContentFilter} filter
 */
function matches(row, filter) {
  if (!row.class) return false;
  return filter.classes.length === 0 || filter.classes.includes(row.class);
}

/** @param {ContentRow[]} rows */
function classCounts(rows) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of rows) {
    if (row.class) counts.set(row.class, (counts.get(row.class) ?? 0) + 1);
  }
  return [...counts]
    .map(([cls, count]) => ({ class: cls, rows: count }))
    .sort((a, b) => b.rows - a.rows || a.class.localeCompare(b.class));
}

/**
 * The heading jump-list, from the rows that are on screen (spec 32, decision 19).
 *
 * Outline was production's unit list indented by heading level, which the merged
 * view now contains. What is left is navigation, and it is derived from the
 * **rendered** rows so that a narrowed view never offers a jump to a row that is
 * filtered away.
 *
 * @param {ContentRow[]} rows
 * @returns {{ key: string, level: number, text: string }[]}
 */
export function outlineFrom(rows) {
  /** @type {{ key: string, level: number, text: string }[]} */
  const out = [];
  for (const row of rows) {
    const unit = row.prod ?? row.new;
    if (unit?.kind !== 'heading') continue;
    // A heading with no level indents deepest rather than not at all: guessing it
    // is an `h1` would put an invented section at the top of the list.
    out.push({ key: row.key, level: unit.level ?? 6, text: unit.raw });
  }
  return out;
}

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
 * A store's work listed as differences rather than as pages (ticket 81).
 *
 * A **repeat** is every finding in **one store** with the same class, the same two
 * texts and the same detail. One footer line that is wrong on thirty pages is one row
 * here, and an editor meets it once instead of thirty times.
 *
 * A repeat never crosses a store, because the stores translate the text: the same
 * defect in six stores is six repeats. There is nothing better to key on — an element
 * carries no DOM path (tickets 01 and 34), so a key on the literal text is the only
 * key there is, and it multiplies by six.
 *
 * **A repeat is not a finding.** It has no id, no override and no history, and every
 * decision on it is still N decisions on N findings. `key` is the grouping made
 * printable, for React and for the row an editor opened; it expires with the text in
 * the same way a finding id does.
 *
 * The row states **pages** and never a separate finding count. `page` is a term of
 * `sha256(store | page | check | rule | prodNorm | newNorm | detail)`, so one page can
 * hold at most one finding with this key — measured over the corpus, 25,657 repeats
 * and no exception. `on` says it in its shape: one entry is a page and its finding.
 *
 * The caller decides which findings reach here. `loadSummaries()` keeps the shown
 * classes only, so a hidden class is out of this list for the same reason ticket 09
 * keeps it out of the bar.
 *
 * @typedef {object} Repeat
 * @property {string} key       The grouping, printable. Not an identity.
 * @property {string} store
 * @property {string} class
 * @property {string | null} prod
 * @property {string | null} new
 * @property {string | null} detail
 * @property {number} occurrences  Summed over the pages. **Not** the page count: a
 *                                 page can hold the same difference several times,
 *                                 and `on.length` is what counts pages.
 * @property {{ page: string, id: string, occurrences: number }[]} on
 *
 * @param {{ store: string, page: string, findings: { id: string, class: string, prod: string | null, new: string | null, detail: string | null, occurrences?: number }[] }[]} pages
 * @returns {Repeat[]}
 */
export function repeatsInStore(pages) {
  /** @type {Map<string, Repeat>} */
  const groups = new Map();

  for (const page of pages) {
    for (const finding of page.findings) {
      const key = JSON.stringify([page.store, finding.class, finding.prod, finding.new, finding.detail]);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          store: page.store,
          class: finding.class,
          prod: finding.prod,
          new: finding.new,
          detail: finding.detail,
          occurrences: 0,
          on: [],
        });
      }
      const repeat = groups.get(key);
      const occurrences = finding.occurrences ?? 1;
      repeat.occurrences += occurrences;
      repeat.on.push({ page: page.page, id: finding.id, occurrences });
    }
  }

  // Worst-first, which here is the repeat on the most pages. The tie-break is the
  // key, so two repeats of equal size never swap places between two renders.
  return [...groups.values()].sort((a, b) => b.on.length - a.on.length || a.key.localeCompare(b.key));
}

/**
 * The class filter over the repeat list, and the same rule as everywhere: it narrows
 * what is on screen and it moves no count.
 *
 * This is where the quick-filter want lands. A class pill that lists its findings
 * directly **is** the repeat list with a class pre-selected, so no second surface is
 * added (ticket 81).
 *
 * @param {Repeat[]} repeats
 * @param {string[]} classes  Empty means every class.
 * @returns {Repeat[]}
 */
export function repeatsWithClasses(repeats, classes) {
  if (classes.length === 0) return repeats;
  return repeats.filter((repeat) => classes.includes(repeat.class));
}
