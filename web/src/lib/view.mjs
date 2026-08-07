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
 * @property {string} key
 * @property {string | null} class
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
  for (const [index, row] of rows.entries()) {
    const finding = row.finding ? byId.get(row.finding) ?? null : null;

    // A muted finding stays visible behind the toggle: muting is not deleting, and
    // an editor who muted a class by mistake must be able to find it again.
    const noise = Boolean(row.class) && !(finding?.shown && finding.state !== 'muted');
    if (noise && !showNoise) continue;

    onThePage.push({
      key: `r${index}`,
      class: row.class,
      score: row.score,
      finding,
      prod: row.prod === null ? null : elements.production[row.prod] ?? null,
      new: row.new === null ? null : elements.new[row.new] ?? null,
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
