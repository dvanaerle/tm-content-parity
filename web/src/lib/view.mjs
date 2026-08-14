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
 * and it survives a click on *clear filter*: an editor who asked to see what a rule
 * saw did not ask a question about classes.
 */

// The closed vocabulary, for the **order** of the class groups and nothing else. The
// import site is `vocabulary.mjs` for the reason `classes.mjs` states.
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';
// `canDecide()` is the interface's other rule derived from the visibility, and it lives
// beside `toneOf()` rather than here: two of its three callers are the Links and
// Images tabs, which have no rows at all (ticket 86).
import { canDecide } from './classes.mjs';

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
 * One row of the content view: a `DiffRow` with both sides read into their unit
 * and its finding attached.
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
 * @property {object | null} finding    The **derived** finding, with `state` and `visibility`.
 * @property {boolean} decidable        Whether there is anything to ask about this row.
 *                                     `canDecide()` in `classes.mjs` is the rule; the
 *                                     field is it applied to the row, so ticket 79's
 *                                     context marker reads one thing off the row and
 *                                     does not have to reach for the finding again.
 * @property {ContentUnit | null} prod
 * @property {ContentUnit | null} new
 */

/**
 * @param {object} input
 * @param {import('../../../compare/contract.mjs').DiffRow[]} input.rows
 * @param {object[]} input.findings   Derived findings, from `derivePageState()`.
 * @param {{ production: ContentUnit[], new: ContentUnit[] }} input.elements
 * @param {ContentFilter} input.filter
 * @param {boolean} input.showNoise   The ledger's toggle: the classes it does not show.
 * @returns {{ rows: ContentRow[], total: number, classes: { class: string, rows: number }[] }}
 *   `total` counts the rows the page has under the noise toggle, so the interface can
 *   say *42 of 310 rows*. It is a row count and never a finding count.
 */
export function prepareRows({ rows, findings, elements, filter, showNoise }) {
  const byId = new Map(findings.map((finding) => [finding.id, finding]));

  /** @type {ContentRow[]} */
  const onThePage = [];
  for (const row of rows) {
    const finding = row.finding ? (byId.get(row.finding) ?? null) : null;

    // The toggle asks about the **class** and about nothing else. Noise is a
    // `diagnostic` row — what the rule saw, for the author of the rule. An
    // `information` row is drawn beside the work and simply counts nowhere, and what
    // an editor decided about a row never moves it out from under this toggle.
    //
    // A row that carries a class the derivation did not reach is noise as well: that
    // is `visibilityOf()`'s answer for a name the vocabulary does not hold, and it is
    // the behaviour `!finding?.shown` had before ticket 75.
    const noise = Boolean(row.class) && (finding?.visibility ?? 'diagnostic') === 'diagnostic';
    if (noise && !showNoise) continue;

    const prod = row.prod === null ? null : (elements.production[row.prod] ?? null);
    const next = row.new === null ? null : (elements.new[row.new] ?? null);

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
      decidable: canDecide(finding),
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
 * Whether a row belongs behind a **context marker** rather than on screen (ticket 79,
 * ADR 0006).
 *
 * It is **not** `row.equal`, and the difference is the decision this ticket carries.
 * Ticket 68 set `equal` as `prod.norm === next.norm` and said plainly that a row "can
 * carry `heading-level` or `tag-changed` and agree about every word" and still be
 * equal. That is right for a clamp, which compacts a row with nothing to read, and
 * wrong for a marker, which **removes** it: a `heading-level` finding is a difference,
 * and the view is supposed to open with the differing rows visible. So `equal` stays
 * exactly as 68 left it — the word diff still skips those rows and that saving is
 * untouched — and the marker reads a narrower rule of its own.
 *
 * **Narrowing is the safe direction**: it collapses less. Ticket 48 widens this again,
 * to *no open work* — a row is also behind the marker once its finding is Closed, or
 * once it is not `decidable` — and it can widen it in one deliberate step because this
 * rule is here rather than spread through a component. `ContentRow.decidable` is
 * already on the row for that.
 *
 * @param {{ equal: boolean, class: string | null }} row
 * @returns {boolean}
 */
export const collapses = (row) => row.equal && row.class === null;

/**
 * One thing the content view draws: a row, or a marker standing for a run of them.
 *
 * @typedef {object} ContextMarker
 * @property {'marker'} kind
 * @property {string} key      `run-<the first row's anchor>`. Its own name, because a
 *                             marker and a row are in one document and two anchors that
 *                             can collide is a hash link landing on the wrong one.
 * @property {number} blocks   How many blocks the run holds. A **distance between two
 *                             findings** and never a denominator: it counts rows, the
 *                             bar counts findings, and no bar is reachable from here.
 * @property {boolean} open    Whether the run is expanded.
 * @property {ContentRow[]} rows
 *
 * @typedef {{ kind: 'row', key: string, row: ContentRow } | ContextMarker} ContentItem
 */

/**
 * The content view as it is drawn: the whole page in document order, with each run of
 * collapsible rows folded into one context marker (ticket 79, ADR 0006).
 *
 * **This is not a view mode.** It is one order with a fold in it. No row moves, no row
 * is filtered away, and the heading outline still names the same places — a marker
 * states the distance between two findings and gives the blocks back on one click,
 * where the retired *Diff* tab deleted the position outright. Ticket 37 held the mode
 * question and was parked, so nothing defines what a mode may do to document order;
 * this function must not be read as the first answer to that.
 *
 * The measurement behind the default: a comparable page holds a median of 37 shown
 * findings, 151 at the p90 and 399 on the worst page. At that density an editor pays
 * for the context at nearly every row and reads it at few of them. It stays reachable
 * because 82% of shown findings are one-sided, and for those the question is not what
 * changed but whether the text is gone or moved — which only the neighbouring blocks
 * answer.
 *
 * @param {ContentRow[]} rows          From `prepareRows()`, already filtered.
 * @param {object} [reader]
 * @param {string[]} [reader.open]     The markers the reader opened, by marker key.
 * @param {string | null} [reader.reveal]  A row key a jump named. The run holding it
 *                                     opens with it, or the link lands on a marker.
 * @returns {ContentItem[]}
 */
export function collapseRuns(rows, { open = [], reveal = null } = {}) {
  const opened = new Set(open);

  /** @type {ContentItem[]} */
  const drawn = [];
  /** @type {ContentRow[]} */
  let run = [];

  const closeRun = () => {
    if (run.length === 0) return;
    const key = `run-${run[0].key}`;
    drawn.push({
      kind: 'marker',
      key,
      blocks: run.length,
      open: opened.has(key) || run.some((row) => row.key === reveal),
      rows: run,
    });
    run = [];
  };

  for (const row of rows) {
    if (collapses(row)) {
      run.push(row);
      continue;
    }
    closeRun();
    drawn.push({ kind: 'row', key: row.key, row });
  }
  closeRun();

  return drawn;
}

/**
 * The row a hash link names, or null.
 *
 * Ticket 68 wrote this rule so a jump could open the clamped row it landed on, and it
 * went out with the clamp on 2026-08-14. It comes back for the marker, which is the one
 * criterion 68 could not finish: a run holding this key has to be open in the same
 * render, or the browser lands on a marker and the outline stops reaching its headings.
 *
 * A row anchor is `p<n>` or `n<n>` — production's document position, or the new site's
 * on a row that exists there only. `finding-<digest>` is the other scheme in this
 * document and belongs to the Links and Images tables, so anything that is not a row
 * anchor answers null rather than opening nothing quietly.
 *
 * @param {string | null | undefined} hash  `location.hash`, with its `#`.
 * @returns {string | null}
 */
export function rowKeyFromHash(hash) {
  return /^#([pn]\d+)$/.exec(hash ?? '')?.[1] ?? null;
}

/**
 * The heading jump-list, from the rows that are on screen (spec 32, decision 19).
 *
 * Outline was production's unit list indented by heading level, which the merged
 * view now contains. What is left is navigation, and it is derived from the
 * **rendered** rows so that a narrowed view never offers a jump to a row that is
 * filtered away.
 *
 * It is given the rows and never `collapseRuns()`'s items, which is the difference
 * between a filter and a fold: a filtered row is not on the page, and a collapsed row
 * is one click away. So a heading inside a run keeps its entry, and `rowKeyFromHash()`
 * is what opens the run the jump lands in.
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
 * The caller decides which findings reach here. `loadSummaries()` keeps the `work`
 * classes only, so a class that is not work is out of this list for the same reason
 * ticket 09 keeps it out of the bar.
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
      const key = JSON.stringify([
        page.store,
        finding.class,
        finding.prod,
        finding.new,
        finding.detail,
      ]);
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
  return [...groups.values()].sort(
    (a, b) => b.on.length - a.on.length || a.key.localeCompare(b.key),
  );
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

/**
 * How many findings a list of repeats holds.
 *
 * Counted off the list it is given and never from elsewhere, so a number beside a list
 * cannot disagree with it — a filtered row count over an unfiltered finding count is
 * exactly the mismatched pair ticket 81 exists to stop. Two callers ask (the repeats
 * footer and a search result), and one of them asking differently is how they would drift.
 *
 * It is not a count of *work*: a repeat is a grouping, so this says how much the rows add
 * up to and never how much is left to do.
 *
 * @param {Repeat[]} repeats
 * @returns {number}
 */
export const findingsIn = (repeats) => repeats.reduce((sum, repeat) => sum + repeat.on.length, 0);

/**
 * The repeat list in a **class group** for each class (ticket 100).
 *
 * One wall of rows asks an editor to read it before it says anything. Six or so numbers,
 * one for each kind of difference, is a choice instead: *which kind do I work through*.
 * It changes nothing about which work is on top — the rows in a group are the rows
 * `repeatsInStore()` returned, in its worst-first order.
 *
 * The word is **group** and never *section*: `CONTEXT.md` spends "section" on a run of one
 * page under an anchor heading, and one word with two meanings is what that glossary exists
 * to stop. That the override keyed on a section is withdrawn (ADR 0011) does not free the
 * word — the anchor heading is still how a difference says where it is. Ticket 100 asked
 * for "sections"; the concept it describes is this, and the name is refused.
 *
 * Opening a group is **not** a filter: it changes what is drawn and never what is
 * included, so it stays out of the amber strip and *clear filter* does not touch it. The
 * class pills stay the one filter, and this function reads them — with a pill on, only the
 * selected groups exist and they are open, so the two controls cannot tell different
 * stories.
 *
 * A class that holds nothing gets **no group**. It used to get an empty one saying so, to
 * keep *nothing wrong here* apart from *this class does not exist*; that is a row of
 * clutter apiece in the list an editor reads to find work, and a store where most rules
 * come back clean paid it on every line. Which rules ran is a property of the run and not
 * of this queue.
 *
 * @typedef {object} ClassGroup
 * @property {string} class
 * @property {Repeat[]} repeats
 * @property {boolean} opensOnLoad  The **initial** state, not the state. Which group is
 *                                  open is session state in the component.
 *
 * @param {Repeat[]} repeats
 * @param {string[]} classes  The pills that are on. Empty means every class.
 * @returns {ClassGroup[]}
 */
export function groupRepeatsByClass(repeats, classes = []) {
  /** @type {Map<string, Repeat[]>} */
  const byClass = new Map();
  for (const repeat of repeats) {
    if (!byClass.has(repeat.class)) byClass.set(repeat.class, []);
    byClass.get(repeat.class).push(repeat);
  }

  // Which classes are drawn: the ones that **hold something**. Every `work` class used to
  // be drawn with no pill on, empty ones as well, saying *no difference of this class in
  // this store* — *nothing wrong here* kept apart from *this class does not exist*. That
  // answer costs a row apiece in the list an editor reads to find work, and a store where
  // most rules come back clean pays it on every line. Which rules ran is a property of the
  // run, and this queue is for what is there.
  //
  // With a pill on the selected classes narrow it further: opening a group is not a
  // filter, so the two controls must not be able to tell different stories about what is
  // included.
  const isDrawn = (cls) => byClass.has(cls) && (classes.length === 0 || classes.includes(cls));

  // A class the closed vocabulary does not name cannot be ordered by it, so it goes last
  // rather than nowhere. Nothing reaches here today that is not in the vocabulary; the
  // guard is for the failure being silent, because the row would leave the screen while
  // the footer below kept counting it.
  const unnamed = [...byClass.keys()].filter((cls) => !FINDING_CLASSES[cls]).sort();

  // The vocabulary's order and never the counts. A group that changes position as the
  // work is done is a group nobody can learn where to look for.
  const groups = [...Object.keys(FINDING_CLASSES), ...unnamed]
    .filter(isDrawn)
    .map((cls) => ({ class: cls, repeats: byClass.get(cls) ?? [] }));

  // Groups start closed, and two of them is the case this ticket exists for: the editor
  // chooses. A lone group opens, because a closed single group is a click that asks
  // nothing — and so does a selected one, because the pill was that choice already. There
  // is no empty group to keep shut any more: every group here holds something.
  //
  // Two pills therefore open two groups, which the ticket also asks to be one at a time.
  // The two rules meet only here, and the pills win: they are the control that chose those
  // classes, so the queue must not answer a two-class filter with one class drawn open.
  // One-at-a-time governs the **clicks** — the component collapses the rest on a click —
  // and re-toggling a pill is what restores the pair.
  //
  // `opensOnLoad` is the **initial** state and not the state itself. Which group is open
  // is session state in the component, it is not a filter, and it never enters the amber
  // strip.
  const chosen = classes.length > 0 ? groups.map((group) => group.class) : [];
  const lone = groups.length === 1 ? [groups[0].class] : [];
  const opening = new Set([...chosen, ...lone]);

  return groups.map((group) => ({ ...group, opensOnLoad: opening.has(group.class) }));
}
