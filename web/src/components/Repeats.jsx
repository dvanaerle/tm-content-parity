import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// `bucketOf()` for the one question *Include closed* asks of a page — is it in the Closed
// bucket — read from the function that groups the four derived states rather than restated
// here (ticket 80).
import { barOf, bucketOf } from "../../../overrides/state.mjs";
import { Detail, Occurrences, onePageHint } from "./Annotations.jsx";
import { Hint } from "./Hint.jsx";
import BulkControl from "./BulkControl.jsx";
import { ClassPill } from "./Chips.jsx";
import { BUCKET_TONE } from "../lib/buckets.mjs";
import { Comparison } from "./Diff.jsx";
import { STATE, attributionTone } from "./OverrideControl.jsx";
import { Attribution } from "./Attribution.jsx";
import { Button } from "./ui/button.jsx";
import { Checkbox } from "./ui/checkbox.jsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible.jsx";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table.jsx";
import { CHROME } from "../lib/palette.mjs";
import { cn } from "../lib/utils.js";
import {
  findingsIn,
  groupRepeatsByClass,
  repeatsByOpenWork,
  repeatsWithWorkLeft,
} from "../lib/repeat-list.mjs";

/**
 * A store's work listed as differences rather than as pages (ticket 81).
 *
 * One footer line that is wrong on thirty pages is **one row** here, saying it is on
 * thirty pages, and opening it shows them. An editor stops meeting the same
 * difference thirty times.
 *
 * It is the second view over the derivation the page list already uses, and not a
 * second surface: `repeatsInStore()` decides what the rows are, `repeatsWithClasses()`
 * decides which of them the class pills leave on screen, and this component draws
 * them. The pills above it are the ones the page list uses, so a pill that lists its
 * findings directly *is* this view with a class pre-selected.
 *
 * This is the **flat** reading of that list, and it is what a search draws (ticket 82).
 * *Repeats* draws `ClassGroups` below instead, which is the same rows in a class group
 * for each class (ticket 100). A search **is** narrowed by the classes since ticket 102 —
 * the pills are a filter and a term does not withdraw one — but it is not *grouped* by
 * them: the term is the grouping the editor asked for, so grouping its result by class as
 * well would be a second grouping over one answer.
 *
 * **The backlog is not drained.** A repeat is a grouping and never a finding, so a
 * decision on a repeat is still one decision per finding — every number here says how
 * much is *decided*, and none of them counts down to an empty list.
 *
 * **The screen it is drawn on arrives as one reading** (ADR 0030). Everything that used to
 * be drilled from here to the cell that used it — what a press may cross, the refusal's
 * words, the list's language, whether rows name their store, whether a term was typed, the
 * two href builders and the log itself — is derived by `listReading()` off the one fact the
 * screen states about itself. It is provided from here rather than handed on as a prop,
 * because the three levels below only passed it through and the selection beside it already
 * arrives this way.
 */
export default function Repeats({
  repeats,
  reading,
  logRead,
  bulk = null,
  builtAt = null,
}) {
  return (
    <UnderReading reading={reading}>
      <FlatList
        repeats={repeats}
        logRead={logRead}
        bulk={bulk}
        builtAt={builtAt}
      />
    </UnderReading>
  );
}

/** The flat list itself, drawn under the reading its entry point provides. */
function FlatList({ repeats, logRead, bulk, builtAt }) {
  const reading = useListReading();

  // **Nothing is hidden on the flat list**, which is why the flag is a literal here and not a
  // prop: a search has already dropped its inactive findings before it grouped them
  // (`searchStore()`, ticket 09), so there is nothing left to take away — and where the editor
  // did ask for closed work, these are the rows they asked for. Only the dashboard's *Repeats*
  // view hides one, and `ClassGroups` below is where the control reaches.
  const { rows: worstFirst } = useWorstFirst(
    repeats,
    reading.byFinding,
    logRead,
    {
      includeClosed: true,
    },
  );

  /**
   * The rows a press on this screen may reach (ticket 04).
   *
   * The refusal is the **screen's**, because it is a property of the screen and not of the
   * row: the same `copy` difference is pressed on its own dashboard and refused above the
   * stores, and the row cannot tell which of the two it is in. The reading answers with the
   * *reason* and not a flag, so the list cannot draw a refusal it has no words for.
   *
   * The selection is narrowed **here** and once, so every control under it agrees: the
   * result-wide tick reaches only these rows, the bar counts only their pages as its
   * denominator, and a refused row draws no tick of its own. A refusal enforced only at the
   * row would leave a select-all quietly ticking what the rows would not.
   */
  const pressable = useMemo(
    () => worstFirst.filter((repeat) => !reading.of(repeat).refusal),
    [worstFirst, reading],
  );

  if (repeats.length === 0) return <NoRepeats />;

  const rows = (
    <>
      <RowList repeats={worstFirst} />
      <Total repeats={worstFirst} />
    </>
  );

  /*
   * **No `bulk`, no press.** The caller withholds the seam and this list draws no tick, no
   * select-all and no bar — the selection context is `null`, and the three controls that read
   * it return nothing rather than each testing a flag of their own.
   *
   * It is the caller's decision and not this component's, said in the one shape a component
   * cannot get wrong: there is nothing here to press *with*. The refusal above is the other,
   * narrower shape of the same decision — the press exists and some rows are outside it — and
   * the two are not alternatives: a screen with no editor and no log withholds `bulk`, and a
   * screen with both refuses rows.
   */
  if (!bulk) return rows;

  // Nothing on the list may be pressed, so there is nothing to press with — the same shape
  // the caller uses when it withholds `bulk` altogether, and for the same reason: a bar and a
  // select-all over an empty selection are controls that write nothing.
  if (pressable.length === 0) return rows;

  return (
    <FlatSelection repeats={pressable} bulk={bulk} builtAt={builtAt}>
      {/* The control that ticks the whole result, and the **only** place the condition for
          offering it is stated (ticket 138, ADR 0022).

          Whether a term was typed is that condition, spelled here rather than left to fall
          out of the routing. It is nearly free — the flat list is what a search draws and
          nothing else draws it — and that is exactly why it is written down: a rule that
          holds by accident is a rule the next reader deletes as an oversight.

          A wide press needs a proposition to be about. A term, a page scope or a class pill
          is one; the bare *Repeats* list is every difference in the store and no proposition
          anyone made, so `ClassGroups` below offers nothing of the kind. */}
      {reading.searched && <SelectResult repeats={pressable} />}
      {rows}
    </FlatSelection>
  );
}

/**
 * A difference's bar: the same rules the page bar obeys, over this difference's findings.
 *
 * Nothing leaves the denominator, a dismissal enters the numerator, and a contradicted
 * claim reads as open. The lookup cannot miss — `byFinding` is derived from the same store
 * summaries the repeats are — and it is **left to throw** rather than skipping a missing
 * one: a skipped member would quietly lower the denominator, so the row would say *3 of 3
 * closed* about four findings, and since ticket 141 it would quietly move the row as well.
 */
const barFor = (repeat, stateOf) =>
  barOf(repeat.on.map((entry) => stateOf(entry.id)));

/**
 * The list **worst-first and with the settled differences off it** — the difference with
 * the most work left on top, and nothing on it that is wholly decided (tickets 141, 144).
 *
 * It is **one place answering three questions off one reading of one bar**: whether a row is
 * drawn, where it sits, and which of its pages are drawn with it. The order is taken here
 * and not in `repeatsInStore()` because it is the log that decides it — that derivation is
 * pure over the page summaries, and the closed count is `barOf()` over the log, read one row
 * down. This is the layer where both are in scope, so a row's presence, its position and the
 * *N of N closed* it prints cannot be three counts of one thing.
 *
 * **The count is not held and membership is.** *Numbers are readings and move; membership
 * is a position and is held.* The reading is taken when the list arrives and kept, so closing
 * the last finding of a difference re-counts that row to *2 of 2 closed* and re-seats and
 * removes nothing — the row is gone the next time the list opens. It is re-taken when the
 * list itself changes: the pills and *Include closed* on the dashboard, and the term, the
 * scope, the pills or *Include closed* in a search, each of which remounts this list. The
 * precedent is ticket 141's held position and the context marker's collapse set, which is
 * taken when the page opens for the same reason; this ticket adds no third timing rule.
 *
 * **It waits for the log.** `byFinding` reports every finding open until the log has been
 * read — the events start as `null` and the derivation runs over an empty list — and the
 * dashboard mounts this list on that first paint. A reading held from there would be an
 * all-open one: the order would be ticket 81's for the life of the list, and nothing would
 * ever be hidden. That failure is silent in the second half, because a pill showing the full
 * count on an unread log is the **correct** answer — so the pills would look right while the
 * hiding never engaged. `logRead` is the guard.
 *
 * A finding the list did not hold when the reading was taken — a block sibling's pages land
 * in a second fetch — is read from the log as it is now, because there is no earlier
 * reading of it to hold.
 *
 * @param {import('../lib/repeat-list.mjs').Repeat[]} repeats
 * @param {Map<string, object>} byFinding
 * @param {boolean} logRead  Whether the log has answered. Until it has, there is no reading
 *                           of it worth holding.
 * @param {{ includeClosed: boolean }} options  *Include closed*, and required rather than
 *   defaulted: a list that hides a wholly decided difference and one that does not are two
 *   different screens, and a caller must say which it is drawing. One name and one polarity
 *   all the way down — a `hidesClosed` here inverted into an `includeClosed` one line below
 *   would be two names for one bit.
 * @returns {{ rows: import('../lib/repeat-list.mjs').Repeat[], closedPages: Set<string> | null }}
 *   `closedPages` is the pages standing behind the same control, as finding ids off the
 *   **held** reading, and `null` where nothing is hidden. It is one set over the whole list
 *   rather than a question each page asks the live log, so a page cannot leave the table
 *   under the editor who just decided it.
 */
function useWorstFirst(repeats, byFinding, logRead, { includeClosed }) {
  const [held, setHeld] = useState(
    /** @type {null | { rows: object[], log: Map }} */ (null),
  );

  useEffect(() => {
    if (logRead && !sameRows(held?.rows, repeats))
      setHeld({ rows: repeats, log: byFinding });
  }, [logRead, repeats, byFinding, held]);

  const asArrived = held?.log ?? byFinding;

  return useMemo(
    // `byFinding` is deliberately out of the dependencies: it changes on every decision an
    // editor makes, and re-taking this on those is exactly the row moving out from under
    // them. It is still read for a finding the held reading does not know.
    () => {
      const stateOf = (/** @type {string} */ id) =>
        asArrived.get(id) ?? byFinding.get(id);
      const openIn = (/** @type {import('../lib/repeat-list.mjs').Repeat} */ repeat) =>
        barFor(repeat, stateOf).open;
      const left = repeatsWithWorkLeft(repeats, openIn, { includeClosed });

      return {
        rows: repeatsByOpenWork(left, openIn),
        closedPages: includeClosed ? null : closedPagesIn(left, stateOf),
      };
    },
    [repeats, asArrived, includeClosed],
  );
}

/**
 * Which pages of one difference are **drawn**: all of them, or the ones *Include closed* has
 * not taken away.
 *
 * One spelling, because two things ask it and they must agree — the row that draws the table,
 * and the selection that says how many pages a press is about. Said twice, a select-all could
 * come to tick a page the row did not draw.
 *
 * `null` means the control is on and nothing is hidden, which is why the question is asked of
 * the **set** rather than of a boolean: a caller that has nothing to hide holds no set.
 *
 * @param {import('../lib/repeat-list.mjs').Repeat} repeat
 * @param {Set<string> | null} closedPages
 */
/**
 * The pages of these differences that are **closed**, as finding ids.
 *
 * The two things that close a finding are a dismissal and a claimed fix, and *closed* is the
 * bucket that holds them — read off `bucketOf()` rather than listed here, so this and the
 * bar it is drawn beside cannot come to disagree about which states are done. A contradicted
 * claim is not one of them: it reads as open everywhere else, so its page is still drawn.
 *
 * The lookup is **left to throw**, for `barFor()`'s reason one step further: skipping a
 * missing id would quietly lower a denominator, and now it would quietly keep a page on
 * screen as well.
 */
const drawnPagesOf = (repeat, closedPages) =>
  closedPages
    ? repeat.on.filter((entry) => !closedPages.has(entry.id))
    : repeat.on;

const closedPagesIn = (repeats, stateOf) =>
  new Set(
    repeats.flatMap((repeat) =>
      repeat.on
        .filter((entry) => bucketOf(stateOf(entry.id).state) === "closed")
        .map((entry) => entry.id),
    ),
  );

/**
 * How much open work one difference holds, off the bar the row prints (ticket 144).
 *
 * The dashboard reads it for the class pills, which count the open findings of a class over
 * this very list. It is exported rather than spelled again there because a pill counting one
 * bar and the rows under it counting another is the disagreement this ticket exists to end:
 * `Case or punctuation 40` over a group header saying *52 differences*.
 */
export const openWorkIn = (repeat, byFinding) =>
  barFor(repeat, (id) => byFinding.get(id)).open;

/**
 * Whether a new list holds the same differences as the one the order was taken over.
 *
 * The array's identity is not the question: a search re-derives its result on every
 * decision, so it hands over a new array of the same rows, and re-taking the order on that
 * is the row moving under the editor. What the rows **are** is the question, and the two
 * lists arrive in the same derived order, so they are compared where they stand.
 */
const sameRows = (rows, repeats) =>
  rows?.length === repeats.length &&
  rows.every((row, at) => row.key === repeats[at].key);

/**
 * The ticked pages: **one flat set of findings over the whole list** (ticket 138).
 *
 * It held `{ key, ids }` until this ticket — one difference's ids at a time — so ticking in
 * a second difference silently took the selection away from the first. An editor whose
 * search answered 472 findings in 259 differences, every one of them wanting the same
 * sentence, paid 259 expansions and 259 presses for it.
 *
 * "Which difference" is no longer a term of the selection's identity, only of how the ticks
 * are drawn and of what the bar can call itself. Nothing under it moves: a press is still N
 * ordinary events, one per page, `scope: 'finding'` — the presses take the pages they are
 * aimed at and cannot tell whether those came from one difference or from 259.
 *
 * It is **session-only** and never in the URL (ADR 0022): a copied link arriving with 472
 * rows pre-ticked is a press somebody else armed. The caller drops it by remounting this
 * component when the term, the scope, the pills or *Include closed* change, which is what
 * the `key` on `Search.jsx`'s `<Repeats>` is for.
 *
 * The bar is rendered **here** and not by a difference, because the selection is no longer
 * one difference's to own. There is one of it; it wears the words of the single difference
 * holding the ticks where there is one and the words of the result where there are several,
 * so two surfaces can never claim the same ticks.
 */
function FlatSelection({
  repeats,
  closedPages = null,
  bulk,
  builtAt = null,
  children,
}) {
  const { byFinding } = useListReading();
  const [ticked, setTicked] = useState(/** @type {Set<string>} */ (NOTHING));

  /**
   * The last press's report, held **here** and not in the bar (ADR 0019).
   *
   * A press that writes everything takes its own bar off the screen: the ticks of what was
   * written come off, nothing is left ticked, and the bar unmounts with the sentence saying
   * it worked still inside it. That is the exact silence the pass set out to fix — forty
   * pages decided and no word about it — so the report outlives the selection, and the bar
   * stays for as long as it has something to say.
   *
   * It is cleared by the editor and never by the press: a new tick is a new question, and a
   * press that unticks what it wrote must not wipe its own answer.
   */
  const [reported, setReported] = useState(
    /** @type {null | import('../../../overrides/bulk.mjs').PressReport} */ (
      null
    ),
  );

  // Ids in or out of the set, with no opinion about the report. Both the editor's controls
  // and the press's own untick go through it, so the set has one arithmetic.
  const move = useCallback(
    (/** @type {string[]} */ ids, /** @type {boolean} */ on) =>
      setTicked((last) => {
        const next = new Set(last);
        for (const id of ids) {
          if (on) next.add(id);
          else next.delete(id);
        }
        return next;
      }),
    [],
  );

  const selection = useMemo(
    () => ({
      ticked,
      // One call for one page, for a whole difference and for a whole result: a tick is a
      // set of ids going in or coming out, and the three controls differ only in how many
      // ids they hand over.
      tick: (ids, on) => {
        setReported(null);
        move(ids, on);
      },
      clear: () => {
        setReported(null);
        setTicked(NOTHING);
      },
    }),
    [ticked, move],
  );

  /**
   * The differences as the **selection** sees them: their drawn pages and no others (ticket
   * 144).
   *
   * A page *Include closed* has taken off the screen is not a page a tick could reach, so it
   * is out of the denominator every control below states. Narrowed **once**, here, because
   * three things read it and they must agree: the bar's *N of M pages*, the sentence naming
   * the one difference the ticks are in, and the test for whether a press is wide. A
   * select-all on a partly settled difference reporting *2 of 3 pages* would read as an
   * editor having missed one.
   *
   * The **rows are untouched**: a row's own bar counts the whole difference, because nothing
   * leaves a denominator. This is a different question — what a press can reach.
   */
  const reachable = useMemo(
    () =>
      closedPages
        ? repeats.map((repeat) => ({
            ...repeat,
            on: drawnPagesOf(repeat, closedPages),
          }))
        : repeats,
    [repeats, closedPages],
  );

  // Every page the selection could reach, flattened once. It is the denominator the bar
  // states — *12 of 472 pages* — and the list the ticked ones are drawn from.
  const entries = useMemo(
    () => reachable.flatMap((repeat) => repeat.on),
    [reachable],
  );

  // The pages the presses are aimed at, narrowed **here** and once. This is the seam
  // `bulk.mjs` takes: it never sees a repeat and never sees the selection either, so a press
  // covering 259 differences is one short list of pages to it. Narrowing it there instead
  // would re-filter every page on screen — 25,657 differences' worth on the unnarrowed
  // list — on every keystroke of the note, because the note is what the press is memoised on.
  const chosen = useMemo(
    () =>
      ticked.size === 0 ? [] : entries.filter((entry) => ticked.has(entry.id)),
    [entries, ticked],
  );

  // Which differences the ticks are in, which decides what the bar can call itself and
  // nothing else. It is skipped while nothing is ticked, so an untouched list does not walk
  // 25,657 rows on every render.
  const holding = useMemo(
    () =>
      ticked.size === 0
        ? []
        : reachable.filter((repeat) =>
            repeat.on.some((entry) => ticked.has(entry.id)),
          ),
    [reachable, ticked],
  );

  /**
   * Whether this is a **wide** press: one no editor built by eye.
   *
   * It is what the snapshot line is drawn on, and it is a shape rather than a size, because
   * a size would be a number nobody could defend. Ticks spanning differences, or covering
   * every page of the result, can only have come from a wide control — a select-all on a
   * difference row, or the one beside the result's count. A handful of pages ticked inside
   * one difference is the narrow press ticket 110 shipped, and it is left alone.
   */
  const wide =
    holding.length > 1 || (ticked.size > 0 && ticked.size === entries.length);

  return (
    <SelectionContext.Provider value={selection}>
      {children}
      {/* One reason, many findings (ticket 31), on the pages that were ticked (ticket 110),
          across as many differences as they were ticked in (ticket 138). It is drawn only
          when something is ticked: a bar carrying buttons that would write nothing is worse
          than no bar. */}
      {(ticked.size > 0 || reported) && (
        <BulkControl
          entries={chosen}
          pages={entries.length}
          byFinding={byFinding}
          bulk={bulk}
          onClear={selection.clear}
          onWritten={(ids) => move(ids, false)}
          report={reported}
          onReport={setReported}
          holding={holding}
          builtAt={wide ? builtAt : null}
        />
      )}
    </SelectionContext.Provider>
  );
}

const SelectionContext = createContext(
  /** @type {null | { ticked: Set<string>, tick: Function, clear: Function }} */ (
    null
  ),
);

/**
 * The screen this list is drawn on, as one reading of it (ADR 0030).
 *
 * It is **not exported**, and that is the point of it being a context at all: the two entry
 * points take the reading as a prop and provide it here, so a screen cannot read it out of
 * band and the three levels of drawing code below stop carrying facts they never used.
 */
const ListReadingContext = createContext(
  /** @type {null | import('../lib/list-reading.mjs').ListReading} */ (null),
);

/**
 * The reading, or a crash.
 *
 * **A missing one throws** and is never defaulted. A neutral reading would be *above the
 * stores with everything refused*, which is a real screen — so the bug would draw a plausible
 * page rather than fail, and an editor would read a refusal nobody decided. The selection
 * beside it may default because *nothing selected* is genuinely neutral; *nothing readable*
 * is not.
 */
const useListReading = () => requireReading(useContext(ListReadingContext));

const requireReading = (reading) => {
  if (!reading) throw new Error(NO_READING);
  return reading;
};

/**
 * The one place a reading becomes a list's, written once for the two entry points.
 *
 * Both take the reading as a prop and provide it here, and neither adds anything of its own
 * to the wrapping — so the wrapping is one component rather than the same three lines twice.
 */
const UnderReading = ({ reading, children }) => (
  <ListReadingContext.Provider value={requireReading(reading)}>
    {children}
  </ListReadingContext.Provider>
);

const NO_READING =
  "A repeat list needs a list reading. Build one with listReading() and give it to Repeats" +
  " or ClassGroups.";

/**
 * One frozen empty set, so an untouched list and a list an editor emptied are the same
 * value. A fresh `new Set()` would be a new identity, and the seams below are memoised on
 * exactly that value.
 */
const NOTHING = new Set();

/**
 * A tick over a set of pages: ticked when every one of them is, unticked when none is,
 * `aria-checked="mixed"` in between — and from mixed a press clears, because a control
 * that cannot be pressed back is not a control.
 *
 * It is a **control before it is a summary**, and it is written once because three of them
 * are drawn: on a difference's row, in the header of that difference's page table, and over
 * a whole search result. Three copies of one tri-state rule would be three rules, and the
 * one they would disagree about first is `some` — which is asked of the ids this tick is
 * over and never of the size of the selection, because the selection spans differences and
 * a tick in another one is not this control's *mixed*.
 *
 * `checked` and `indeterminate` are what Base UI draws; from the mixed state it would
 * otherwise answer `true`, which would re-tick the same rows and leave the control stuck.
 */
function TriStateTick({ ids, label, hint }) {
  const selection = useContext(SelectionContext);

  // No selection to be part of, so no tick. It is read off the context and never off a prop
  // threaded down beside it: the list that offers no press does not provide one, and a tick
  // drawn without one would be a control whose press goes nowhere. See `Repeats` above.
  if (!selection) return null;

  const all = ids.every((id) => selection.ticked.has(id));
  const some = !all && ids.some((id) => selection.ticked.has(id));

  // The hint is beside the tick's own name and never instead of it, and the trigger merges
  // onto the checkbox rather than wrapping it: the mixed press this control answers by
  // clearing has to stay the checkbox's own press (ticket 129).
  return (
    <Hint text={hint}>
      <Checkbox
        checked={all}
        indeterminate={some}
        onCheckedChange={(ticked) => selection.tick(ids, some ? false : ticked)}
        aria-label={label}
      />
    </Hint>
  );
}

/**
 * The tick that takes the **whole result**, beside the count it is an answer to
 * (ticket 138, ADR 0022).
 *
 * It reaches every page of every difference in the result, and that is the point rather than
 * a side effect: a collapsed difference, and a difference below the render budget that is not
 * on the screen at all, are both in the answer and both in the press.
 *
 * It is not in the amber strip and must not move there. That strip enumerates what narrows
 * the list; a selection narrows nothing, and a strip enumerating *some* of what narrows is
 * worse than none.
 */
function SelectResult({ repeats }) {
  const ids = useMemo(
    () => repeats.flatMap((repeat) => repeat.on.map((entry) => entry.id)),
    [repeats],
  );

  return (
    <div
      data-slot="select-result"
      className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm"
    >
      <TriStateTick
        ids={ids}
        label={`Select all ${ids.length} pages of the ${repeats.length} differences found`}
        hint={SELECT_RESULT_HINT}
      />
      {/* The sentence says what the tick reaches and states no second count: the size of the
          result is on the line above this one already, and one figure in two wordings is two
          figures as far as a reader is concerned. What is worth saying here is the part the
          eye cannot check — that the rows below the budget are in it too. */}
      <span className="text-muted-foreground">
        Select every difference found, including the ones not drawn yet.
      </span>
    </div>
  );
}

const SELECT_RESULT_HINT =
  "Selects every page of every difference in this result, including the ones not drawn" +
  " yet. A selection decides nothing.";

/**
 * The same repeats, in a **class group** for each class (ticket 100).
 *
 * *Repeats* is the queue an editor lands on, and as one undifferentiated column it
 * asks to be read before it says anything. Six or so numbers is a choice instead: which
 * **kind** of difference to work through. The order inside a group is untouched, so
 * nothing changes about which work is on top — only how much of it arrives at once.
 *
 * The word is **group** and never *section*. `CONTEXT.md` spends "section" on a run of one
 * page under an anchor heading. ADR 0011 withdrew the override that was keyed on such a run,
 * and the word stays taken anyway, because that run is what an anchor heading names. One word
 * with two meanings is what that glossary exists to stop. Ticket 100 asked for sections;
 * the name is refused and the concept is kept.
 *
 * **Opening a group is not a filter.** It changes what is drawn and never what is
 * included, so it is session state here, it is absent from the amber strip, and *clear
 * filter* does not touch it. The class pills stay the one filter: while a pill is on, its
 * group is open and the unselected groups are not drawn at all, so the two controls cannot
 * tell different stories.
 *
 * The search draws the flat list above instead. Its result is narrowed by the classes
 * (ticket 102) and grouped by the term: the term is the grouping the editor asked for, and
 * grouping it by class as well would be a second grouping over one answer.
 */
export function ClassGroups({
  repeats,
  classes,
  reading,
  logRead,
  bulk,
  includeClosed = false,
}) {
  return (
    <UnderReading reading={reading}>
      <GroupedList
        repeats={repeats}
        classes={classes}
        logRead={logRead}
        bulk={bulk}
        includeClosed={includeClosed}
      />
    </UnderReading>
  );
}

/** The grouped list itself, drawn under the reading its entry point provides. */
function GroupedList({ repeats, classes, logRead, bulk, includeClosed }) {
  const { byFinding } = useListReading();

  // The one list on which a wholly decided difference is hidden (ticket 144). It is the queue
  // an editor lands on, so it answers *what is left*; the flat list a search draws answers a
  // question the editor typed and hides nothing of its own.
  const { rows: worstFirst, closedPages } = useWorstFirst(
    repeats,
    byFinding,
    logRead,
    {
      includeClosed,
    },
  );
  // A group of a class with nothing left is not drawn, and its header counts the differences
  // **drawn** — both of which fall out of the row rule rather than being built: this is the
  // narrowed list, and `groupRepeatsByClass()` already draws only the classes that hold
  // something.
  const groups = useMemo(
    () => groupRepeatsByClass(worstFirst, classes),
    [worstFirst, classes],
  );

  // Which groups are open. The initial state is the derivation's `opensOnLoad`: closed,
  // unless a group is the only one holding anything or the pills already chose it.
  const [open, setOpen] = useState(() =>
    groups.filter((group) => group.opensOnLoad).map((group) => group.class),
  );

  // One at a time, on a click: two open groups is the wall again in halves. The pills may
  // still open several at load, and that is their call to make — they are the control that
  // chose those classes. Clicking from there collapses the rest, and re-toggling a pill is
  // what brings the pair back.
  const toggle = (cls) =>
    setOpen(open.includes(cls) ? open.filter((held) => held !== cls) : [cls]);

  // How many rows each group draws, held **here** rather than inside the group. A closed
  // group unmounts its rows, so a budget living down there would reset every time: an
  // editor who paged `copy` to three hundred rows, looked at `casing` and came back would
  // find the paging gone. The budget is the group's, and the group keeps it for as long as
  // this list is on screen.
  const [budget, setBudget] = useState(
    /** @type {Record<string, number>} */ ({}),
  );

  if (repeats.length === 0) return <NoRepeats />;

  // Every difference in this store is decided, so the queue is empty and the control that
  // holds them is the way in. It is a different sentence from *No difference found*: nothing
  // **left** and nothing **there** are two answers, and this is the one the log earned.
  if (worstFirst.length === 0) return <AllClosed />;

  return (
    // No `SelectResult` here — see the gate on it above, which is where that rule is
    // written. The selection itself is the same flat one: ticks made in two groups are one
    // selection, and one bar says so.
    <FlatSelection repeats={worstFirst} closedPages={closedPages} bulk={bulk}>
      <ul>
        {groups.map((group) => (
          <ClassGroupRow
            key={group.class}
            group={group}
            open={open.includes(group.class)}
            onToggle={() => toggle(group.class)}
            drawn={budget[group.class] ?? PAGE_SIZE}
            onDraw={(next) => setBudget({ ...budget, [group.class]: next })}
            closedPages={closedPages}
          />
        ))}
      </ul>
      <Total repeats={worstFirst} />
    </FlatSelection>
  );
}

/**
 * One class, its repeat count, and its rows behind a click.
 *
 * Every group here holds something: `groupRepeatsByClass()` leaves an empty class out
 * rather than drawing a group that says *no difference of this class in this store*. That
 * sentence kept *nothing wrong here* apart from *this class does not exist*, and it cost a
 * row apiece in the list an editor reads to find work.
 *
 * Most repeats are singletons — 78.8% of them in `nl`, measured in ticket 81 — and grouping
 * makes that tail navigable; it does not get to decide the tail is not work. So no group is
 * left out for being small, and none of them hides its rows behind its count.
 */
function ClassGroupRow({
  group,
  open,
  onToggle,
  drawn,
  onDraw,
  closedPages = null,
}) {
  const count = group.repeats.length;

  return (
    <li className="border-b border-border last:border-0">
      <Collapsible open={open} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted">
          <span aria-hidden className="w-3 text-muted-foreground">
            {open ? "▾" : "▸"}
          </span>
          {/* The group heading is **not** a link, and that is the same rule the row's own
              label follows from the other side: the heading is inside a `CollapsibleTrigger`,
              whose press already means *show me these*, and a second press with a second verb
              inside it is what ticket 03 forbids. The row below it is where a class opens. */}
          <ClassPill class={group.class} />
          {/* The count is this group's own rows and nothing summed from elsewhere.
              Opening it moves no count, no bar and no denominator: the repeat total
              across the groups is the total the footer states. */}
          <span className="text-muted-foreground tabular-nums">
            {count} {count === 1 ? "difference" : "differences"}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* The budget belongs to **this** group, and so does the button that pages it.
              One number over the whole list would draw a hundred rows of the first class
              and none of the fifth. */}
          <RowList
            repeats={group.repeats}
            closedPages={closedPages}
            drawn={drawn}
            onDraw={onDraw}
          />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * The rows, and how many of them are drawn.
 *
 * A rendering budget: it is about length and not about findings. The line below says how
 * many rows there are, so nothing here is hidden — only not drawn yet.
 *
 * The budget is a prop when a class group owns it and state here when nobody else does,
 * which is the flat list a search draws. A list that is never taken off screen cannot lose
 * its paging, so there is nothing above it to hold.
 */
function RowList({ repeats, closedPages = null, drawn: given, onDraw }) {
  const [held, setHeld] = useState(PAGE_SIZE);
  const drawn = given ?? held;
  const draw = (next) => (onDraw ? onDraw(next) : setHeld(next));

  return (
    <>
      <ul className="text-sm">
        {repeats.slice(0, drawn).map((repeat) => (
          <Row key={repeat.key} repeat={repeat} closedPages={closedPages} />
        ))}
      </ul>

      {drawn < repeats.length && (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {drawn} of {repeats.length} differences drawn.{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => draw(drawn + PAGE_SIZE)}
          >
            Show the next {PAGE_SIZE}
          </Button>
        </p>
      )}
    </>
  );
}

/**
 * What the list adds up to, stated once at the bottom of it.
 *
 * Both numbers come from **this** list, so they cannot disagree about what they are
 * counting. A filtered row count over an unfiltered finding count would be exactly the
 * mismatched pair ticket 81 exists to stop — and the total is over the repeats given,
 * grouped or not, so grouping them cannot move it either.
 */
function Total({ repeats }) {
  return (
    <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
      {repeats.length} differences over {findingsIn(repeats)} findings.
    </p>
  );
}

/** Said by both readings, so it is said once. */
const NoRepeats = () => (
  <p className="px-4 py-6 text-sm text-muted-foreground">
    No difference found.
  </p>
);

/**
 * What *Repeats* says when the log has closed everything on it (ticket 144).
 *
 * Not `NoRepeats` above: that sentence says the snapshot found nothing, and this one says an
 * editor finished it. `CONTEXT.md` already owns the words for the second — **no open work**,
 * which a scoped search says about a page that holds differences and has closed every one of
 * them — so they are the words here, over a list instead of over a page. *Clean* and *no open
 * work* are two answers and not one, and a third wording for this one would make them three.
 *
 * Naming the control is the rest of it: a screen with rows behind a checkbox has to say which
 * checkbox.
 */
const AllClosed = () => (
  <p className="px-4 py-6 text-sm text-muted-foreground">
    No open work here. Include closed to read the differences that are closed.
  </p>
);

/** How many rows are drawn at once, and how many the button adds. */
const PAGE_SIZE = 100;

/**
 * What the `×N` mark means on a repeat, which is not what it means on a finding: it
 * counts over the pages, and the row already says how many pages there are. Confusing
 * the two is this ticket's named trap, so the two sentences are written apart.
 */
const acrossPagesHint = (repeat) =>
  `${repeat.occurrences} times in total, on ${repeat.on.length} ` +
  "pages. On some of those pages the difference is there more than once.";

function Row({ repeat, closedPages = null }) {
  const { byFinding, of } = useListReading();
  // Everything the screen has to say about **this** difference, in one call: what it may
  // press and, where it may not, the words saying why; what language its two quoted strings
  // are in; whether it names its store; and where its class label lands. Asked here rather
  // than handed down pre-narrowed, so no level of this list holds a slice of an answer a
  // level below could contradict (ADR 0030).
  const row = of(repeat);
  const [open, setOpen] = useState(false);

  /**
   * The pages of this difference that are **drawn** (ticket 144).
   *
   * Every one of them, unless *Include closed* is off on the list that offers it — and then
   * the ones this difference has already settled are behind it, the same control that keeps a
   * wholly settled difference off the list altogether. An editor working through a `casing`
   * pass meets the pages they have left and not the thirty they finished this morning.
   *
   * `closedPages` is read from the **held** reading and not asked of the live log, so a page
   * does not leave the table under the editor who has just decided it. The **bar below still
   * counts `repeat.on`**: nothing leaves a denominator, so a partly settled difference goes on
   * saying how many of it are closed while drawing only the rest.
   */
  const pages = useMemo(
    () => drawnPagesOf(repeat, closedPages),
    [repeat, closedPages],
  );

  /**
   * The list's selection, read for **this** difference's pages (ticket 110, ticket 138).
   *
   * A difference opens with nothing ticked: selection is something an editor does and
   * never something they arrive at, and a press pre-aimed at ten pages is the all-or-
   * nothing control this replaces.
   *
   * The set is one flat set over the whole list since ticket 138, so ticks made here and
   * ticks made in another difference coexist. This row does not own them and cannot put
   * them down, and it does not broker them either: each tick reads the selection itself.
   */
  // Live, and the row's own number: the order above holds this row's **position** and
  // never its count.
  const bar = barFor(repeat, (id) => byFinding.get(id));

  // The tone is worn only when something is closed. A row with nothing done reads as a plain
  // muted number, so a zero carries no colour at all.
  //
  // It is read off `BUCKET_TONE` and not written out here, so this row and the two bucket
  // strips cannot come to colour one bucket two ways. That is what caught it: the tone was the
  // literal `added` in both places, and green is Direction.
  const closedTone = bar.closed ? BUCKET_TONE.closed : null;

  return (
    <li className="border-b border-border last:border-0">
      {/* The tick is **beside** the trigger and never inside it (ticket 138). Round one of
          ticket 110 put a checkbox in the `CollapsibleTrigger` — a button inside a button,
          which is neither valid nor clickable — and the fix then was to move the tick into
          the table it selects. That left a collapsed difference untickable, which is 259
          expansions for one sentence. So the tick is back on the row and the row is two
          siblings instead: a checkbox, and a trigger that is everything after it.

          Ticking it does **not** open the difference. The page table inside one is
          unbudgeted, and 259 expanded differences is thousands of rows.

          `Collapsible` is what writes the `aria-expanded` this markup used to carry by
          hand — the state below decides, and the library draws it. Closing a difference no
          longer puts its ticks down: the selection is the list's, a collapsed difference can
          be ticked whole from this very checkbox, and ticks that vanished on a close would
          be ticks an editor could not keep. */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex w-full items-start gap-2 px-4 py-2 hover:bg-muted">
          {/* The tick, or nothing where the screen refuses the press (ticket 04). Nothing,
              and not a disabled checkbox: a control an editor cannot use is a control they
              have to work out the state of, and the sentence at the end of this row says
              what a disabled tick could only imply. */}
          <span className="mt-0.5 shrink-0">
            {row.refusal ? null : <SelectAll pages={pages} />}
          </span>

          {/* **Outside the trigger, because it is a link** (ticket 03). An anchor inside a
              button is neither valid nor clickable — the same trap the tick hit in ticket 138,
              from the other side — so the label is a sibling of the trigger rather than its
              first child.

              The **label alone** leaves, and the two readings beside it stay inside the
              trigger below. Round one moved all three out together, which bought one anchor
              and cost two dead words: on a searched list the matched fields are the row's own
              account of why it is there, and a click on them did nothing.

              The class href may be absent, and then this is the plain statement it always
              was. */}
          <span className="mt-0.5 shrink-0">
            <ClassPill class={repeat.class} href={row.classHref} />
          </span>

          {/* `data-row` names what this trigger opens, because two kinds of trigger are in
              this list: a difference's own row, and a class group's heading. They used to be
              told apart by what sat beside them, which stopped working the moment the class
              label moved out of this button. A reader — and a test — asks the markup what a
              thing is rather than inferring it from a sibling. */}
          <CollapsibleTrigger
            data-row="difference"
            className="flex flex-1 flex-wrap items-start gap-2 text-left"
          >
            {/* The two readings of the class, which are words and not a way in, so they open
                the row like the rest of the trigger does. */}
            <span className="mt-0.5 shrink-0">
              <Detail detail={repeat.detail} />
              <MatchedFields fields={row.matchedFields} />
            </span>

            {/* The language of the two quoted strings — the reading holds where it comes
                from, which is the list's on a store screen, the row's own above the stores,
                and none at all where the row spans four. */}
            <Comparison
              prod={repeat.prod}
              new={repeat.new}
              language={row.language}
              className="min-w-48 flex-1"
            />

            {/* Which stores this difference is on, on the **collapsed** line. The reading
                holds when it is said at all, and it is the same question the pages inside
                ask, so a row and its pages cannot disagree about whether the store is worth
                naming. It says every store of the difference because the row is the whole
                difference: which of them a single page is on is that page's own answer, in
                the table below. */}
            {row.namesStore && (
              <span className="shrink-0 text-xs text-muted-foreground">
                on {repeat.stores.join(", ")}
              </span>
            )}

            {/* Why this row cannot be pressed here, in the caller's words (ticket 04). It is
                drawn and not hidden: a difference an editor found is a difference they are
                entitled to read, and a row that simply had no tick would read as a bug in
                the tick. It sits inside the trigger, so it is announced with the row rather
                than as a note beside it. */}
            {row.refusal && (
              <span
                data-slot="no-press"
                className="shrink-0 text-xs text-muted-foreground"
              >
                {row.refusal}
              </span>
            )}

            <span className="shrink-0 text-right text-xs">
              {/* The page count is the size of the difference. There is no separate
                finding count beside it: the page is inside the finding id, so one page
                carries one finding of this difference and the two numbers are one
                number. `occurrences` is the number that genuinely differs — the same
                difference several times on a single page — and it is named apart. */}
              <span className="font-medium tabular-nums">
                on {repeat.on.length} pages
              </span>
              {/* Drawn only when it exceeds the page count, so the mark appears exactly
                when it says something the page count does not. */}
              {repeat.occurrences > repeat.on.length && (
                <Occurrences
                  count={repeat.occurrences}
                  hint={acrossPagesHint(repeat)}
                />
              )}
              <span
                data-wears={closedTone ? "ink" : null}
                data-tone={closedTone}
                className={cn(
                  "ml-2 tabular-nums",
                  !closedTone && "text-muted-foreground",
                )}
              >
                {bar.closed} of {bar.denominator} closed
              </span>
            </span>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <PageTable repeat={repeat} pages={pages} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * The tick that belongs to the difference itself (ticket 110).
 *
 * It ticks **every** page of the difference, decided or not. Round one ticked only the
 * pages a dismissal was offered on, which refused by select-all what the row-level tick
 * allowed by hand — and a decided page is not a page with nothing left to do: since round
 * two an undo is live there.
 *
 * It is drawn **twice** and is one control: on the difference's own row, where a collapsed
 * difference is ticked whole without being opened (ticket 138), and in the header of the
 * page table, where an open one is. Two copies of a tri-state rule would be two rules, so
 * there is one component and it reads the selection itself.
 *
 * It takes the pages that are **drawn** and not the difference. Every one of them, decided or
 * not — which is the whole of round two's rule and is unchanged — but a page *Include closed*
 * has taken off the screen is not one of them: a select-all that quietly armed a press on rows
 * an editor cannot see is the trap ADR 0022 states, and the label counts the same pages the
 * tick reaches so the two cannot disagree.
 *
 * Its label says **select** and never *closed*. The ledger already spends a checkbox on
 * the tri-state *Fixed* control, which genuinely is a decision (tickets 36 and 48), so
 * two checkboxes with two meanings share this screen and each has to say which it is.
 */
const SelectAll = ({ pages }) => (
  <TriStateTick
    ids={pages.map((entry) => entry.id)}
    label={`Select all ${pages.length} pages of this difference`}
    hint="Selects each page of this difference. A selection decides nothing."
  />
);

/**
 * What one tick announces. It names the store on the same answer the cell beside it draws
 * under — the row's own reading, asked once — because two pages of one difference can
 * otherwise carry the same name: `afhalen` on `nl` and `afhalen` on `be` are two ticks a
 * screen reader could not tell apart (ticket 03).
 */
const selectLabel = (namesStore, entry) =>
  namesStore
    ? `Select ${entry.page} on ${entry.store}`
    : `Select ${entry.page}`;

/**
 * The pages of one difference, with a tick each (ticket 110).
 *
 * It was a list until this ticket and it is a table now, because a tick is a column and a
 * column wants a header word. That word is the whole reason the table is here: the ledger
 * already spends a checkbox on the tri-state *Fixed* control, which **is** a decision,
 * and two checkboxes with two meanings on one screen have to say which is which. This one
 * says *Select*, and every tick repeats it in its label.
 *
 * A page name opens the **whole** content view for that page, and not a fragment of it
 * filtered to this difference. The question a one-sided difference asks is where the text
 * belongs, and only document order answers it (ADR 0006).
 *
 * Since ticket 109 the link also **names this finding**, and the page lands on it: the row
 * opens, the view scrolls to it, and it is marked. That is not a filter and it narrows
 * nothing — it is the difference between arriving at the row and arriving at the top of a
 * page 399 rows long. The link carries the dashboard back as well, so both Back and the
 * header link return to this screen: its view, its pills and its search term. **Not**
 * which group was open — that is session state by the rule `groupRepeatsByClass()` states,
 * and a pill that is on re-opens its own group anyway.
 *
 * `pages` and not `repeat.on`: which of the difference's pages are drawn is the row's answer
 * (ticket 144), because it is the row that holds the reading *Include closed* is read against.
 * The **bar on the row above still counts the whole difference** — nothing leaves a
 * denominator — so the two numbers are not two counts of one thing.
 */
function PageTable({ repeat, pages }) {
  const { byFinding, searched, of } = useListReading();
  // The same one call the row above made, asked again here rather than handed down narrowed
  // to a `refused` flag: two levels each holding a slice of one answer is what lets them
  // contradict each other (ADR 0030).
  const row = of(repeat);

  // The list's selection, and not this difference's share of it: a refused row is out of the
  // selection entirely, so the column goes with the tick that would have been in it. The
  // reason is on the row above, said once — a second copy of it in every page's cell would
  // be the same sentence N times.
  const list = useContext(SelectionContext);
  const selection = row.refusal ? null : list;

  return (
    <div className="border-t border-border bg-muted px-4 py-2 text-sm">
      <Table>
        {/* Under a search these are the **matching** pages and a difference may be on
            more: `searchStore()` builds its repeats out of matched findings only, and a
            term can be in one page's key and not another's. Ticking all of them is then a
            press on the matches, which is right — and unsayable if this line is missing. */}
        {searched && (
          <TableCaption className="mt-2 text-left text-xs">
            These are the pages where the search term was found. This difference
            can be on more pages; those are not here and they are not decided
            with these.
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            {/* The header word is drawn for a screen reader and not for an eye. A header
                cell holding nothing but a checkbox announces nothing, and *Select* beside
                the tick would be a word repeated in every label under it. */}
            {/* Both halves of the column go together, or neither does. A header word over no
                cells is a column an editor is told about and cannot use. */}
            {selection && (
              <TableHead className="w-8">
                <SelectAll pages={pages} />
                <span className="sr-only">Select</span>
              </TableHead>
            )}
            <TableHead>Page</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((entry) => (
            <TableRow
              key={entry.id}
              data-state={
                selection?.ticked.has(entry.id) ? "selected" : undefined
              }
            >
              {selection && (
                <TableCell>
                  <Checkbox
                    checked={selection.ticked.has(entry.id)}
                    onCheckedChange={(ticked) =>
                      selection.tick([entry.id], ticked)
                    }
                    aria-label={selectLabel(row.namesStore, entry)}
                  />
                </TableCell>
              )}
              <TableCell className="whitespace-normal">
                <a
                  className={cn("hover:underline", CHROME.link)}
                  href={row.pageHref(entry)}
                >
                  {entry.page}
                </a>
                {/* Which store this page is on. The reading holds the two reasons there are
                    for saying so and the one for staying quiet. */}
                {row.namesStore && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    on {entry.store}
                  </span>
                )}
                <Occurrences
                  count={entry.occurrences}
                  hint={onePageHint(entry.occurrences)}
                />
              </TableCell>
              <TableCell>
                <FindingState finding={byFinding.get(entry.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Where the searched words were found, on a row a search put on screen (ticket 82).
 *
 * A row reached by four different fields is four different reasons to look at it, and the
 * two texts are not the only place a term can hit: on a links check the same two columns
 * hold the target instead. Without this the row shows words that do not contain what was
 * typed — because what was typed is in the link, the heading or the page name.
 *
 * Nothing here when there are none, which is the *Repeats* view: no term was typed, so
 * there is nowhere a match could have been. Whether a list is one anybody asked a question
 * of is the **reading's** answer and not this cell's (ADR 0030).
 */
const MatchedFields = ({ fields }) =>
  fields.length ? (
    <span className="ml-2 text-xs text-muted-foreground">
      in {fields.map((field) => FIELD_LABEL[field]).join(", ")}
    </span>
  ) : null;

/** The six searchable fields, as the dashboard says them. */
const FIELD_LABEL = {
  page: "the page name",
  prodText: "the text on production",
  newText: "the text on the new site",
  linkTarget: "the link target",
  linkText: "the link text",
  anchorHeading: "the heading",
};

/**
 * What is decided about this finding, in **the log's own words for it** — the map
 * the override control reads, and not a second copy of it. An `open` finding says
 * nothing: it is the default, and a badge on every row would make the decided ones
 * harder to find rather than easier.
 */
const FindingState = ({ finding }) =>
  finding && finding.state !== "open" ? (
    /* The same attribution the ledger draws, and not a badge (ADR 0019). `fixed` and
       `dismissed` are closed states the surrounding table already accounts for, and
       *claimed fixed, still differs* names a person — a pill cannot hold a name, and the
       name is the part an editor needs before overturning the claim. */
    <Attribution
      action={STATE[finding.state].label}
      editor={finding.override.editor}
      at={finding.override.at}
      tone={attributionTone(finding.state)}
    />
  ) : null;
