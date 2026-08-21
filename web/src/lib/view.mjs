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
 * The diagnostics control is **not** part of the filter. It belongs to the whole ledger
 * and it survives a click on *clear filter*: an editor who asked to see what a rule
 * saw did not ask a question about classes.
 */

// The closed vocabulary, for the **order** of the class groups and nothing else. The
// import site is `vocabulary.mjs` for the reason `classes.mjs` states.
// `isWork` is the second thing read out of it, and only for the pill row: the repeat list
// is built out of `work` findings alone, so a class that is not one can never appear in it
// and its pill has to be counted off the snapshot instead (ticket 144).
import { FINDING_CLASSES, isWork } from '../../../compare/vocabulary.mjs';
// `canDecide()` is the interface's other rule derived from the visibility, and it lives
// beside `toneOf()` rather than here: two of its three callers are the Links and
// Images tabs, which have no rows at all (ticket 86).
import { canDecide } from './classes.mjs';
// The block a store is in, for the **first term of the repeat key** and nothing else
// (ticket 03). It is derived from `HREFLANG_STORE` and never hand-written, which is what
// keeps `{de, uk}` from ever becoming a block — see ADR 0018.
import { blockOf } from './language-blocks.mjs';
// The Closed bucket, from the one function that groups the four derived states (ticket
// 80). Read and never restated: a second list of which states are closed is how the
// content view would come to disagree with the counts above it.
import { bucketOf } from '../../../overrides/state.mjs';

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
 * @property {ContentUnit[] | null} prodRun  On a `regrouped` merge only (ticket 116): the
 *                                     production run the new site sends as one block, in
 *                                     document order. `prod` is its first member, so a
 *                                     reader of this row that knows nothing about runs still
 *                                     has the unit the row is anchored to.
 * @property {ContentUnit | null} new
 * @property {ContentUnit[] | null} newRun   On a `regrouped` split only (ticket 120): the
 *                                     run the new site divides production's block over,
 *                                     `new` being its first member. A row holds one run or
 *                                     the other, never both.
 */

/**
 * What a surface says when the **diagnostics control** is the whole reason it is empty.
 *
 * Two surfaces reach this: the content view, where what is withheld is a block, and a
 * finding table, where it is a finding of one check. They were about to say it in two
 * near-identical sentences, which is one sentence's worth of meaning and two places for a
 * rewording to land in one of them. So the noun is the argument and the sentence is not.
 *
 * It names the **control** and not an absence, which is the whole point: *nothing found* is
 * the answer an editor is working towards, and *you switched it off* is one press from being
 * undone. Saying the first about the second is the bug this replaces.
 *
 * @param {object} said
 * @param {number} said.count  How many the control is holding back. Never zero: a caller with
 *   nothing withheld has a different sentence to say.
 * @param {string} said.noun  What one of them is, as the surface's own reader would name it —
 *   `block` in the content view, `Links finding` on a finding tab.
 * @returns {string}
 */
export const allDiagnostic = ({ count, noun }) =>
  `Every ${noun} on this page is a diagnostic. Show diagnostics to read the ${count}.`;

/**
 * @param {object} input
 * @param {import('../../../compare/contract.mjs').DiffRow[]} input.rows
 * @param {object[]} input.findings   Derived findings, from `derivePageState()`.
 * @param {{ production: ContentUnit[], new: ContentUnit[] }} input.elements
 * @param {ContentFilter} input.filter
 * @param {boolean} input.showDiagnostics   The ledger's toggle: the classes it does not show.
 * @returns {{ rows: ContentRow[], total: number, classes: { class: string, count: number }[] }}
 *   `total` counts the rows the page has under the diagnostics control, so the interface can
 *   say *42 of 310 rows*. It is a row count and never a finding count.
 */
export function prepareRows({ rows, findings, elements, filter, showDiagnostics }) {
  const byId = new Map(findings.map((finding) => [finding.id, finding]));

  /** @type {ContentRow[]} */
  const onThePage = [];
  for (const row of rows) {
    const finding = row.finding ? (byId.get(row.finding) ?? null) : null;

    // The control asks about the **class** and about nothing else. What it reveals is a
    // `diagnostic` row — what the rule saw, for the author of the rule. An
    // `information` row is drawn beside the work and simply counts nowhere, and what
    // an editor decided about a row never moves it out from under this toggle.
    //
    // A row that carries a class the derivation did not reach is a diagnostic as well: that
    // is `visibilityOf()`'s answer for a name the vocabulary does not hold, and it is
    // the behaviour `!finding?.shown` had before ticket 75.
    const diagnostic = Boolean(row.class) && (finding?.visibility ?? 'diagnostic') === 'diagnostic';
    if (diagnostic && !showDiagnostics) continue;

    const prod = row.prod === null ? null : (elements.production[row.prod] ?? null);
    const next = row.new === null ? null : (elements.new[row.new] ?? null);
    const prodRun = runOf(row.prodRun, elements.production);
    const newRun = runOf(row.newRun, elements.new);

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
      prodRun,
      new: next,
      newRun,
    });
  }

  return {
    // A class filter implies the differences: an editor narrowing to `copy` asked
    // for the copy edits, not for the copy edits inside the whole document.
    rows: isNarrowed(filter) ? onThePage.filter((row) => matches(row, filter)) : onThePage,
    // The page whole, which is what `collapsedKeys()` is taken from (ticket 48). A
    // filter decides what is **drawn** and never what holds open work, so a collapse
    // set taken from the narrowed rows would leave every other row on the page unable
    // to collapse for as long as the view stood, and clearing the filter would show a
    // page of finished work as if it were open. It is the same array as `rows` when
    // nothing is narrowed, and it is not a count: `total` is still the only number.
    all: onThePage,
    total: onThePage.length,
    classes: classesOnThePage(onThePage),
  };
}

/**
 * One side's run on a `regrouped` row, read into its units (tickets 116 and 120).
 *
 * **A member that does not resolve makes the whole run absent**, and that is not
 * defensiveness for its own sake: the class asserts *total* coverage, so a row drawing
 * three members of a run of four would claim the words on one side are the words on the
 * other while showing less than all of them. Absent, the row falls back to its first member
 * against the single block — visibly not a whole answer — and that is the failure this
 * class exists to refuse in the first place (ADR 0012).
 *
 * @param {number[] | undefined} positions
 * @param {ContentUnit[]} elements
 * @returns {ContentUnit[] | null}
 */
function runOf(positions, elements) {
  if (!positions) return null;
  const run = positions.map((at) => elements[at] ?? null);
  return run.every(Boolean) ? /** @type {ContentUnit[]} */ (run) : null;
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

/** @param {ContentRow[]} rows */
function classesOnThePage(rows) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const row of rows) {
    if (row.class) counts.set(row.class, (counts.get(row.class) ?? 0) + 1);
  }
  return classCounts(counts);
}

/**
 * Whether a row belongs behind a **context marker** rather than on screen: it holds
 * **no open work** (ticket 48, ticket 79, ADR 0006).
 *
 * It is **not** `row.equal`, and that is the whole decision. Ticket 68 set `equal` as
 * `prod.norm === next.norm` and said plainly that a row "can carry `heading-level` or
 * `tag-changed` and agree about every word" and still be equal. That is right for a
 * clamp, which compacts a row with nothing to read, and wrong for a marker, which
 * **removes** it: an open finding is work, and the view opens on the work. So `equal`
 * stays exactly as 68 left it — the word diff still skips those rows and that saving is
 * untouched — and the marker reads this rule instead. Ticket 79 shipped its first term
 * only, deliberately, because narrowing collapses less and is the safe direction to be
 * wrong in.
 *
 * Three things hold no open work, and the second and third are 48's widening:
 *
 * 1. **Nothing was found here.** The two sides agree and the row carries no class, so
 *    there is nothing to read and nothing to decide.
 * 2. **The finding is Closed** — absent, dismissed, or claimed fixed and not
 *    contradicted, which is ticket 80's bucket read through `bucketOf()` and never
 *    restated. A **contradicted** claim is Needs attention and stays on screen: it is
 *    open work wearing a tick, and it is the row an editor most needs to see.
 * 3. **Nothing is being asked.** An `information` finding is *not open*, and this is
 *    where 48 says so in its own words: `CONTEXT.md` defines it as a finding you can
 *    link to and cannot decide, so no editor is waiting on it and its two sides may
 *    differ as much as they like. `canDecide()` is the rule and `row.decidable` is it
 *    applied to the row (ticket 86).
 *
 * A row carrying a class the derivation never reached has **no finding at all**, and it
 * stays on screen. `decidable` is false for it too, for want of anything to read, and
 * reading that as *no work* would quietly collapse a diagnostic an editor asked to see.
 *
 * One decision closes **every position** of one finding, because occurrence count is
 * not part of a finding id: the rule reads the finding, so six rows drawn from it
 * cannot come apart.
 *
 * @param {{ equal: boolean, class: string | null, finding: { state: string } | null,
 *   decidable: boolean }} row
 * @returns {boolean}
 */
export const collapses = (row) =>
  (row.equal && row.class === null) ||
  (Boolean(row.finding) && (!row.decidable || bucketOf(row.finding.state) === 'closed'));

/**
 * The rows that hold no open work, by anchor — the collapse set, taken **once**.
 *
 * The content view asks when the page opens and holds the answer; nothing here re-reads
 * it. A tick that collapsed its own row would move the page under the reader, and on a
 * 168-row page an editor working top-down would lose their place at every tick, which
 * is worse than the clutter this ticket removes. The fold answers *what did I arrive
 * with* and never *what am I doing now*, so a row an editor just ticked stays where
 * they can check it, and the run it would have joined is one page-open away.
 *
 * Keys and not rows, because the rows are rebuilt on every tick: an anchor survives
 * that, a row object does not.
 *
 * @param {ContentRow[]} rows
 * @returns {string[]}
 */
export const collapsedKeys = (rows) => rows.filter(collapses).map((row) => row.key);

/**
 * Which rows are behind a marker in **this** render: the set the page opened with, or
 * the rule itself when no set was taken.
 *
 * One function so that the two readers of the answer — the markers and the jump that
 * seeds them open — cannot ask it differently. A jump into a run that was never drawn
 * is a key nothing in the document carries, and it fails silently.
 *
 * The live branch is not a second mode for the interface: the content view always takes
 * a set. It is the rule stated where the rule is tested, so a test can say what
 * collapses and what the fold does with it in one assertion.
 *
 * @param {string[] | null} collapsed
 * @returns {(row: ContentRow) => boolean}
 */
function markerRule(collapsed) {
  if (!collapsed) return collapses;
  const keys = new Set(collapsed);
  return (row) => keys.has(row.key);
}

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
 * @property {boolean} agrees  Whether the run is blocks nobody found anything in, as
 *                             against a run holding work somebody closed. It is what
 *                             the marker's sentence is chosen by (ticket 48), and it is
 *                             a **kind and not a second count** — a mixed run says it
 *                             holds no open work, which is true of every row in it,
 *                             rather than splitting into two markers.
 * @property {boolean} open    Whether the run is expanded.
 * @property {ContentRow[]} rows
 *
 * @typedef {{ kind: 'row', key: string, row: ContentRow } | ContextMarker} ContentItem
 */

/**
 * The content view as it is drawn: the whole page in document order, with each run of
 * collapsible rows standing in one context marker (ticket 79, ADR 0006).
 *
 * **This is not a view mode.** It is one order with a collapse in it. No row moves, no
 * row is filtered away, and the heading outline still names the same places — a marker
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
 * A marker is open because `open` holds its key, and for **no other reason**. A jump
 * used to be a second answer here, and a second answer is a state a press cannot reach:
 * the reader pressed the chevron, `open` lost the key, and the run stayed open because
 * the hash still named a row inside it. A jump seeds `open` through `runKeyHolding()`
 * instead, so opening a run and keeping it open are one fact in one place.
 *
 * @param {ContentRow[]} rows          From `prepareRows()`, already filtered.
 * @param {object} [reader]
 * @param {string[]} [reader.open]     The markers the reader opened, by marker key.
 * @param {string[] | null} [reader.collapsed]  The collapse set, by **row** anchor, from
 *                                     `collapsedKeys()` when the page opened. It is then
 *                                     the whole answer and `collapses()` is not asked
 *                                     again, which is what stops a tick moving a row
 *                                     under the reader. The content view always passes
 *                                     it; left out, the rule answers live, which is how
 *                                     the tests state the rule and the fold in one
 *                                     assertion.
 * @returns {ContentItem[]}
 */
export function collapseRuns(rows, { open = [], collapsed = null } = {}) {
  const opened = new Set(open);
  const behind = markerRule(collapsed);

  /** @type {ContentItem[]} */
  const drawn = [];
  /** @type {ContentRow[]} */
  let run = [];

  const closeRun = () => {
    if (run.length === 0) return;
    const key = runKey(run[0]);
    drawn.push({
      kind: 'marker',
      key,
      blocks: run.length,
      agrees: run.every((row) => row.finding === null),
      open: opened.has(key),
      rows: run,
    });
    run = [];
  };

  for (const row of rows) {
    if (behind(row)) {
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
 * A marker's own name, from the first row of the run it stands for.
 *
 * A marker and a row are in one document, so the two anchor schemes must not be able to
 * collide: a hash link landing on the wrong one is silent and looks like the link was
 * wrong. `collapseRuns()` names markers and `runKeyHolding()` finds one by the rows it
 * holds, and the two agreeing about the name is the whole reason this is a function.
 *
 * @param {ContentRow} first
 * @returns {string}
 */
const runKey = (first) => `run-${first.key}`;

/**
 * The marker standing over a row, or null when the row is on screen already.
 *
 * This is the jump, said as a **seed** rather than as an override. A run holding a
 * jumped-to row has to be open in the same render, or the browser lands on a marker and
 * the outline stops reaching its headings — but "open because a hash names a row inside
 * it" is not a state a press can leave. So the caller adds this key to the runs the
 * reader has opened, once, and from then on the chevron is the only thing that answers.
 *
 * A row that is not behind a marker answers null rather than answering with the run
 * nearest it: the ordinary jump lands on a differing row, which is already drawn, and
 * opening some neighbouring run for it would be furniture the reader did not ask for.
 *
 * @param {ContentRow[]} rows            From `prepareRows()`, in the order `collapseRuns()`
 *                                       will read them.
 * @param {string | null | undefined} rowKey  A row anchor, from `rowKeyFromHash()` or
 *                                       `landingRow()`.
 * @param {string[] | null} [collapsed]  The collapse set `collapseRuns()` was given.
 *                                       The same answer reaches both, or this names a
 *                                       run the document does not hold.
 * @returns {string | null}
 */
export function runKeyHolding(rows, rowKey, collapsed = null) {
  if (!rowKey) return null;
  const behind = markerRule(collapsed);

  /** @type {ContentRow | null} */
  let first = null;
  for (const row of rows) {
    if (!behind(row)) {
      first = null;
      continue;
    }
    first ??= row;
    if (row.key === rowKey) return runKey(first);
  }

  return null;
}

/**
 * What the drawn items say about themselves: the markers, whether every one of them is
 * open, and whether the page is markers and nothing else.
 *
 * The three questions the content view asks of `collapseRuns()`'s answer, here rather
 * than in the component for the reason this module's header gives — what is on screen is
 * this module's decision. `allOpen` is what the expand-all control reads, and it is
 * false on a page with no marker, because that is the page where the control is not
 * drawn at all: a control over nothing teaches a reader that it does nothing.
 *
 * `everythingCollapsed` is **not** `markers.length === items.length`, and the difference
 * is a page with nothing on it. A filter that matched no row leaves no items, which
 * satisfies that comparison and would have the view claim every block agrees with
 * production. An empty view is a sentence the component already has, and it is a
 * different sentence. It is named for the **items** and not for the page — *nothing
 * differs* was the name until ticket 48 and the word turned false under it: on a page an
 * editor worked through every difference is still there, and what changed is that none
 * of them is open.
 *
 * `everythingAgrees` is what such a finished page is told apart by, and it decides which
 * of the two sentences is said. It is vacuously true of a page with no marker at all,
 * which no caller can see: only a page that is markers and nothing else is asked.
 *
 * @param {ContentItem[]} items
 * @returns {{ markers: ContextMarker[], allOpen: boolean, everythingCollapsed: boolean,
 *   everythingAgrees: boolean }}
 */
export function collapseState(items) {
  const markers = /** @type {ContextMarker[]} */ (items.filter((item) => item.kind === 'marker'));

  return {
    markers,
    allOpen: markers.length > 0 && markers.every((marker) => marker.open),
    everythingCollapsed: items.length > 0 && markers.length === items.length,
    everythingAgrees: markers.every((marker) => marker.agrees),
  };
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
 * between filtering a row away and collapsing it: a filtered row is not on the page,
 * and a collapsed row is one click away. So a heading inside a run keeps its entry, and
 * `runKeyHolding()` is what opens the run the jump lands in.
 *
 * **A regrouped row answers for every heading it holds** (ticket 121). One row stands for a
 * run of blocks on one side and a single block on the other, and a heading anywhere in that
 * run is a landmark that had a row of its own until the regrouping absorbed it — a production
 * heading the new site inlined, or, the shape the corpus actually holds, a heading the new
 * site promoted out of a production paragraph. Reading one unit per row would drop it, and
 * navigation on a view whose spine is production order would then depend on which side
 * divides the words. Every entry aims at the **row**, because the row is where the words are
 * drawn and an absorbed member's own anchor names no row at all.
 *
 * @param {ContentRow[]} rows
 * @returns {{ id: string, anchor: string, level: number, text: string }[]}
 *   `anchor` is the row a jump goes to, shared by every entry a run absorbed; `id` names the
 *   entry itself, for a list that has to key on something unique, and is never a link target.
 */
export function outlineFrom(rows) {
  /** @type {{ id: string, anchor: string, level: number, text: string }[]} */
  const out = [];
  for (const row of rows) {
    for (const { side, unit } of headingsIn(row)) {
      // A heading with no level indents deepest rather than not at all: guessing it
      // is an `h1` would put an invented section at the top of the list.
      out.push({
        id: `${row.key}:${side}${unit.index}`,
        anchor: row.key,
        level: unit.level ?? 6,
        text: unit.raw,
      });
    }
  }
  return out;
}

/**
 * The headings a row is the place on the page for, in document order, each with the side it
 * came from.
 *
 * An ordinary row answers with its one unit, production's or — where the row exists on the new
 * site only — the new site's. That is spec 32's rule and it is untouched here: a promotion the
 * two sides pair one-to-one is a `heading-level` finding and not a landmark this list gained.
 *
 * A regrouped row answers with **production's run, and with the new site's only where
 * production holds no heading at all**. The precedence is the same one, said over a run
 * instead of over a unit, and it is what decides the shape neither side of ticket 121
 * anticipated: `h2 → h3 + p`, production's heading split so that the new site keeps its first
 * sentence as a heading of its own. Both sides hold a heading there, it is **one** landmark
 * named twice, and concatenating the two would double the list at one anchor.
 *
 * A run may hold more than one heading on the side that answers, and then both are entries:
 * two blocks are two landmarks.
 *
 * @param {ContentRow} row
 * @returns {Array<{ side: string, unit: ContentUnit }>}
 */
function headingsIn(row) {
  const headings = (/** @type {Array<ContentUnit | null>} */ units) =>
    /** @type {ContentUnit[]} */ (units.filter((unit) => unit?.kind === 'heading'));

  if (!row.prodRun && !row.newRun) {
    const unit = row.prod ?? row.new;
    return unit?.kind === 'heading' ? [{ side: row.prod ? 'p' : 'n', unit }] : [];
  }

  const held = headings(row.prodRun ?? [row.prod]);
  return held.length
    ? held.map((unit) => ({ side: 'p', unit }))
    : headings(row.newRun ?? [row.new]).map((unit) => ({ side: 'n', unit }));
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
 * The stores a set of repeat entries is on, sorted (ticket 03).
 *
 * One definition, because there are two readers and they must never disagree: the row's own
 * `stores` below, and the sentence `bulk.mjs` says above the button about **where the events
 * go**. The two ask the same question of different arrays — the whole repeat, and the entries
 * one press can act on — and a second implementation of *which stores* would be free to drift
 * from the first exactly where the ticket's *80% is not 100%* trap lives.
 *
 * Sorted, so a row's answer does not depend on which page was read first.
 *
 * @param {{ store: string }[]} on
 * @returns {string[]}
 */
export const storesOf = (on) => [...new Set(on.map((entry) => entry.store))].sort();

/**
 * Whether a repeat — or a press on one — reaches past a single store (ticket 03, widened by
 * ticket 04).
 *
 * The test is *more than one store* and nothing narrower, which is why the name stopped
 * saying *block*: more than one store was only ever the two of one language block until
 * ticket 04, and on an `images` or `links` row it is now up to all six. Nothing about the
 * question changed with that — only how wide the answer can be.
 *
 * It is here rather than written out at each of the four places that ask it, because those
 * four have to agree: the row names its stores, each tick names one in its label, the
 * dismissal says where its events go, and the clearing says the same. A row spanning stores
 * that named them in three of the four is a row an editor cannot read.
 *
 * It takes anything carrying `stores`, which is a repeat and both presses' results. The
 * *subject* differs — a whole row, or the entries one press can act on — and that is the
 * caller's to choose; the question does not change with it.
 *
 * @param {{ stores: string[] }} subject
 */
export const crossesStore = (subject) => subject.stores.length > 1;

/**
 * One page of a repeat: the page, the store it is on, and the finding that is the
 * difference there.
 *
 * It is named because it is a **seam** and not only a field. A press takes a list of these
 * and nothing else (ticket 138): the entry carries everything an event needs — its own
 * store, so a block-spanning press files each row where its finding id exists — and none
 * of what a repeat carries for drawing a row. That is what lets one press cover a
 * selection spanning 259 differences without learning that differences exist.
 *
 * @typedef {object} RepeatEntry
 * @property {string} store
 * @property {string} page
 * @property {string} id           The finding on that page.
 * @property {number} occurrences  How often the difference is on this one page.
 */

/**
 * The checks whose two sides are **the same string on every store**.
 *
 * `images` compares basenames with the path stripped and `links` compares host-folded
 * targets, so `max.svg` and `/nl/oud-pad` are the strings they are in every language. The
 * asset convention keeps a filename English and semantic, which is what makes the basename
 * key language-independent in the first place.
 *
 * `text` and `meta` are not here, and that is the whole of the distinction: those two are
 * words an editor reads, the stores translate them, and the same defect in six stores is
 * four differences because the four texts are four texts.
 *
 * It is a set of **checks** and not of classes, so a class added to either check inherits
 * the answer rather than needing an entry — which is what stops the thirty-third class from
 * arriving with a corpus nobody chose.
 */
const SAME_STRING_ON_EVERY_STORE = new Set(['images', 'links']);

/**
 * Whether a difference of this class is the same string on every store, and so whether one
 * press on it may reach all six (ticket 04).
 *
 * It is exported because two surfaces ask it and must agree: this module keys the grouping
 * on it, and the screen above the stores offers a tick on it. A row grouped over six stores
 * that refused the press, or a tick offered on a row holding one block's words, are the two
 * ways those could come apart.
 *
 * A class the vocabulary does not name answers **false**, which is the narrow answer: an
 * unknown class stays inside its language block, where it decides no more than it did
 * before.
 *
 * @param {string} cls
 */
export const spansEveryStore = (cls) => SAME_STRING_ON_EVERY_STORE.has(FINDING_CLASSES[cls]?.check);

/**
 * The first term of a repeat's key: **which stores this difference may group over**.
 *
 * It is a function of the **check** and no longer of the block (ticket 04). Three answers,
 * and the middle one is the one ticket 03 wrote:
 *
 * - `images` and `links`: a constant, so every store groups together. One press decides
 *   `max.svg` everywhere.
 * - `text` and `meta` in a language block: the block's language, exactly as before.
 * - `text` and `meta` outside one: the store. `de` and `uk` are each alone in their
 *   language, so `blockOf()` gives them nothing and their text repeats are what they were.
 *
 * The term is a **key term** and nothing else. Nothing is keyed on it outside this
 * function: no finding id, no scope, no column and no URL. The table gains rows and never a
 * column, which has been true of a repeat since ticket 31.
 *
 * @param {string} store
 * @param {string} cls
 */
const corpusOf = (store, cls) =>
  spansEveryStore(cls) ? EVERY_STORE : (blockOf(store)?.language ?? store);

/**
 * The constant standing for *every store*, which is a name rather than a store list: the
 * corpus is not six stores that happen to be in the data, it is the absence of a store term
 * in the key. A literal list here would have to be kept in step with `STORES`.
 */
const EVERY_STORE = '*';

/**
 * A store's work listed as differences rather than as pages (ticket 81).
 *
 * A **repeat** is every finding in **one store** with the same class, the same two
 * texts and the same detail. One footer line that is wrong on thirty pages is one row
 * here, and an editor meets it once instead of thirty times.
 *
 * **How far a repeat crosses a store is decided by the check** (ticket 04), and
 * `corpusOf()` above is the whole of it. On `images` and `links` the two sides are basenames
 * and host-folded targets — the same strings on every store, in every language — so a repeat
 * spans all six and one press decides `max.svg` everywhere. On `text` and `meta` the two
 * sides are words the stores translate, so a repeat stays inside a **language block**: six
 * stores, four languages, and `{nl, be}` share Dutch while `{be_fr, fr}` share French. `de`
 * and `uk` are each alone in their language, so they join the first group and stay alone in
 * the second.
 *
 * That is the block's stated reason held to exactly what it covers. There is nothing better
 * to key on either way — an element carries no DOM path (tickets 01 and 34), so a key on the
 * literal string is the only key there is.
 *
 * The block is **derived** from the hreflang codes and never a hand-written list, which is
 * what stops `{de, uk}` from becoming a block because both are "the other ones". ADR 0018
 * records that boundary and ADR 0028 records why a filename is outside it; ADR 0017 records
 * why neither is an axis: this widens a **selection** over ordinary axis-A findings and
 * promotes nothing to a finding.
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
 * @property {string[]} stores  The stores its pages are on, sorted. It is derived from
 *                             `on`, so it can only be as wide as the key's first term lets
 *                             the grouping be: one store or a language block's two on a
 *                             `text` or `meta` row, and up to all six on an `images` or
 *                             `links` one (ticket 04).
 * @property {string} class
 * @property {string | null} prod
 * @property {string | null} new
 * @property {string | null} detail
 * @property {number} occurrences  Summed over the pages. **Not** the page count: a
 *                                 page can hold the same difference several times,
 *                                 and `on.length` is what counts pages.
 * @property {RepeatEntry[]} on
 *                             One entry is a page, its store and its finding. The store is
 *                             here and not only on the repeat because a press writes one
 *                             event per entry, and each event carries its own store.
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
        corpusOf(page.store, finding.class),
        finding.class,
        finding.prod,
        finding.new,
        finding.detail,
      ]);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
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
      repeat.on.push({ store: page.store, page: page.page, id: finding.id, occurrences });
    }
  }

  // `stores` is **derived from the entries** and never accumulated beside them, so the
  // row's answer to *in which stores* and the events a press writes cannot disagree. It
  // is one store on all but the block-spanning rows.
  const repeats = [...groups.values()].map((repeat) => ({
    ...repeat,
    stores: storesOf(repeat.on),
  }));

  // It is **size** and not worst-first: this derivation never sees the override log, so it
  // cannot know what is left in a row. `repeatsByOpenWork()` below takes the order an
  // editor reads, off the same bar the row prints, and falls back to this one where two
  // rows have equally much left (ticket 141).
  return repeats.sort(bySize);
}

/**
 * The largest difference first, with the key as the last word so two renders of one list
 * never disagree. Ticket 81's whole order, and the fallback of ticket 141's.
 *
 * It lives in one place because two spellings of it could drift, and a list whose two
 * orders disagree about a tie is a list that re-seats a row for no reason an editor can see.
 *
 * @param {Repeat} a
 * @param {Repeat} b
 */
const bySize = (a, b) => b.on.length - a.on.length || a.key.localeCompare(b.key);

/**
 * The repeat list **worst-first**, which is the difference with the most work left in it
 * (ticket 141).
 *
 * User story 33 of ticket 29 — *the worst page is the worst remaining page and not the
 * worst page of last week* — over the list ticket 81 built. That story says *page* because
 * it predates this list; 81 added the list afterwards and the rule never followed it across.
 *
 * It does not overturn 81's proof that a repeat's page count **is** its finding count: that
 * proof is about the findings a repeat *holds*, `page` being a term of the finding id, and
 * it holds. It says nothing about how many of them are still open, which is what an editor
 * reading top-down is looking for — twenty closed pages and two open is still twenty-two.
 *
 * So the open count is asked for rather than derived here: this module never sees the
 * override log, and the caller that draws a row already reads that row's bar. Handing the
 * same reading in is what keeps a row's position and its *N of N closed* from being two
 * counts of one thing.
 *
 * Nothing is removed and no number moves. A difference settled on all thirty pages stays
 * on the list reading *30 of 30 closed*; it sinks below every difference with work left.
 *
 * This is about **rows**. `groupRepeatsByClass()` refuses a count-based order for the
 * **groups** — a group that moves as the work is done is a group nobody can learn where to
 * look for — and that refusal stands: a group is a place on the screen and a row is the
 * work in it.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  How many of the repeat's findings are still
 *                                             open, off the bar the row prints.
 * @returns {Repeat[]}
 */
export function repeatsByOpenWork(repeats, openOf) {
  // Counted once per row and not inside the comparator, which would read the log O(n log n)
  // times over a 25,657-row list.
  const seats = repeats.map((repeat) => ({ repeat, open: openOf(repeat) }));

  // The fallback is ticket 81's whole order, so a list where nothing is decided arrives
  // exactly as it did before this ticket — and two renders of one list cannot disagree.
  seats.sort((a, b) => b.open - a.open || bySize(a.repeat, b.repeat));

  return seats.map((seat) => seat.repeat);
}

/**
 * The repeat list with the **fully decided differences off it** (ticket 144).
 *
 * The name is *with work left* and not *by open work*: `repeatsByOpenWork()` above **orders**
 * the list and this **narrows** it, `useWorstFirst()` calls the two on adjacent lines, and two
 * names a preposition apart would be two things a reader has to keep straight.
 *
 * Ticket 141 sank such a row instead of removing it, deliberately — sinking is the safe
 * direction to be wrong in, and the measurement since is that a sunk row is still a row an
 * editor scrolls. Fifteen `casing` rows all reading *2 of 2 closed* is the list answering
 * *what did this crawl find* to an editor asking *what is left*.
 *
 * It is the **same `openOf`** the order is taken with, and it is asked for rather than
 * derived here for the same reason: this module never sees the override log, and the caller
 * that draws a row already reads that row's bar. So a row's presence, its position and its
 * printed *N of N closed* are three readings of **one** bar and can never disagree.
 *
 * A difference is dropped whole or kept whole. **A partly closed one stays and keeps its
 * denominator** — its own row still says how many of it are closed, which is the sentence
 * that tells an editor the work landed.
 *
 * `information` needs no case here. A repeat is built out of the `work` findings a summary
 * carries (`loadSummaries()`), so a class that cannot be decided is not in this list to be
 * removed from it. The pill row below is where that class has to be answered for.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  How many of the repeat's findings are still
 *                                             open, off the bar the row prints.
 * @param {{ includeClosed?: boolean }} [options]  *Include closed*, which brings every
 *   dropped row back. It is the one control that decides this, and it decides **membership
 *   only**: no count below moves with it.
 * @returns {Repeat[]}
 */
export function repeatsWithWorkLeft(repeats, openOf, { includeClosed = false } = {}) {
  if (includeClosed) return repeats;
  return repeats.filter((repeat) => openOf(repeat) > 0);
}

/**
 * The class pills over a repeat list: how much **open work of that class is left** in it
 * (ticket 144).
 *
 * The pill counted `summary.byClass` until this ticket, which is a snapshot tally over this
 * store's comparable pages, and the list under it is `repeatsInStore()` over the language
 * block. Neither number was stale with respect to the other — `Case or punctuation 40` over
 * a group header saying *52 differences* is two units over two corpora — and a second count
 * made to agree with the first would have drifted again the next time either moved. So the
 * pill reads **the same list the rows come from** and the agreement is by construction. ADR
 * 0029 argues the two decisions that span it.
 *
 * The unit is the **finding**, because that is the unit of a decision and it is what the row's
 * *N of N closed* and the page bar already speak. 52 rows can hide 104 decisions, and *52*
 * would tell an editor they have half the work they have.
 *
 * It returns `classCounts()`'s own shape and order, so the pill component takes no new prop
 * and a class with nothing left is **absent** rather than a zero the component has to know
 * to hide.
 *
 * @param {Repeat[]} repeats
 * @param {(repeat: Repeat) => number} openOf  The same reading the rows are drawn from.
 * @param {{ tally?: Record<string, number>, includeClosed?: boolean }} [options]
 * @param {Record<string, number>} [options.tally] The snapshot's findings per class, for the
 *   classes this list **cannot hold**: a repeat is built out of `work` findings, so an
 *   `information` class has no row here and would silently lose its pill. Such a finding is
 *   one you can link to and cannot decide, so no decision can close it and the snapshot's
 *   figure is the live figure. Its `work` entries are ignored — those are what the list
 *   answers for.
 *
 *   Those pills therefore count whatever **corpus the caller's tally is over**, which on the
 *   dashboard is the store and not the block. It is a difference worth naming and not one
 *   worth removing: a number nothing can move cannot come to disagree with a list, and the
 *   store's own tally is the only one that screen holds — the sibling's summaries are there
 *   for the press and for this list, and ADR 0021 keeps every other number the store's.
 * @param {boolean} [options.includeClosed] Whether a class with nothing left still draws a
 *   pill. It reads `0`, and that is the only way into a fully decided class's rows. **The
 *   number never depends on this**; only a zero pill's presence does.
 * @returns {{ class: string, count: number }[]}
 */
export function classCountsByOpenWork(repeats, openOf, { tally = {}, includeClosed = false } = {}) {
  /** @type {Map<string, number>} */
  const open = new Map();
  for (const repeat of repeats) {
    open.set(repeat.class, (open.get(repeat.class) ?? 0) + openOf(repeat));
  }

  // A class the log has emptied draws no pill, so pressing one can no longer answer *No
  // difference found*. With *Include closed* on it stays, reading `0`.
  const counted = [...open].filter(([, count]) => includeClosed || count > 0);

  // The classes the repeat list cannot hold, off the snapshot. A `work` entry here is
  // ignored on purpose: the list above is the answer for those, and taking the larger of two
  // numbers is how the pill and the rows would come apart again.
  const undecidable = Object.entries(tally).filter(([cls, count]) => count > 0 && !isWork(cls));

  return classCounts(Object.fromEntries([...counted, ...undecidable]));
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
  return repeats.filter((repeat) => classIsOn(classes, repeat.class));
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
 * It changes nothing about which work is on top — the rows in a group arrive in the order
 * they were given, which is `repeatsByOpenWork()`'s worst-first since ticket 141.
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
