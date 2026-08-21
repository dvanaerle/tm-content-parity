/**
 * What is on screen in the content view, and nothing about what it adds up to
 * (ticket 36).
 *
 * The content view is the whole page in document order, with each run of rows holding no
 * open work standing in one context marker. Which rows those are, where a run begins and
 * ends, what a marker is called and which heading a jump reaches are the judgements in
 * this feature, so they live here as pure functions rather than inside a component.
 *
 * This module is given the derived findings and it reads them. It returns rows, the
 * classes the page carries, and how many rows the page has. It returns no bar, no
 * denominator and no closed count, because a filterable denominator would make two people
 * quoting "the number" mean different things (spec 32, decision 25) — `filter.mjs` states
 * that rule for every surface that narrows, and this one obeys it.
 *
 * The **diagnostics control** is the one narrowing that is not a filter and is therefore
 * here: `prepareRows()` reads it, it belongs to the whole ledger, and it survives a click
 * on *clear filter* — an editor who asked to see what a rule saw did not ask a question
 * about classes.
 */

// `canDecide()` is the interface's other rule derived from the visibility, and it lives
// beside `toneOf()` rather than here: two of its three callers are the Links and
// Images tabs, which have no rows at all (ticket 86).
import { canDecide } from './classes.mjs';
// The Closed bucket, from the one function that groups the four derived states (ticket
// 80). Read and never restated: a second list of which states are closed is how the
// content view would come to disagree with the counts above it.
import { bucketOf } from '../../../overrides/state.mjs';
// The narrowing itself, from the module that states it for every surface that narrows.
// This one holds only what a narrowed content view *looks like*; what a filter is, and
// the order its pills are drawn in, are the same questions on the dashboard.
import { classCounts, isNarrowed } from './filter.mjs';

/** @typedef {import('./filter.mjs').ContentFilter} ContentFilter */

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
