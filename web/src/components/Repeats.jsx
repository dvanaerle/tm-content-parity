import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { barOf } from '../../../overrides/state.mjs';
import { Detail, Occurrences, onePageTitle } from './Annotations.jsx';
import BulkControl from './BulkControl.jsx';
import { ClassPill } from './Chips.jsx';
import { BUCKET_TONE } from '../lib/buckets.mjs';
import { Comparison } from './Diff.jsx';
import { STATE, attributionTone } from './OverrideControl.jsx';
import { Attribution } from './Attribution.jsx';
import { Button } from './ui/button.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.jsx';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table.jsx';
import { CHROME } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';
import { crossesBlock, findingsIn, groupRepeatsByClass, repeatsByOpenWork } from '../lib/view.mjs';

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
 */
export default function Repeats({
  repeats,
  byFinding,
  logRead,
  bulk,
  link,
  language,
  searched = false,
  builtAt = null,
}) {
  const worstFirst = useWorstFirst(repeats, byFinding, logRead);

  if (repeats.length === 0) return <NoRepeats />;

  return (
    <FlatSelection repeats={worstFirst} byFinding={byFinding} bulk={bulk} builtAt={builtAt}>
      {/* The control that ticks the whole result, and the **only** place the condition for
          offering it is stated (ticket 138, ADR 0022).

          `searched` is that condition, spelled here rather than left to fall out of the
          routing. It is nearly free — the flat list is what a search draws and nothing else
          draws it — and that is exactly why it is written down: a rule that holds by accident
          is a rule the next reader deletes as an oversight. A wide press needs a proposition
          to be about. A term, a page scope or a class pill is one; the bare *Repeats* list is
          every difference in the store and no proposition anyone made, so `ClassGroups` below
          offers nothing of the kind. */}
      {searched && <SelectResult repeats={worstFirst} />}
      <RowList
        repeats={worstFirst}
        byFinding={byFinding}
        link={link}
        language={language}
        searched={searched}
      />
      <Total repeats={worstFirst} />
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
const barFor = (repeat, stateOf) => barOf(repeat.on.map((entry) => stateOf(entry.id)));

/**
 * The list **worst-first**, which is the difference with the most work left on top
 * (ticket 141).
 *
 * The order is taken **here** and not in `repeatsInStore()`, because it is the log that
 * decides it: that derivation is pure over the page summaries and the closed count is
 * `barOf()` over the log, read one row down. This is the layer where both are in scope, so
 * a row's position and the *N of N closed* it prints come off one reading of one bar.
 *
 * **A row does not move under the editor working in it.** The reading is taken when the
 * list arrives and held, so closing findings inside an expanded difference re-counts that
 * row's number and re-seats nothing — a held position, never a stale count. It is re-taken
 * when the list itself changes: the pills on the dashboard, and the term, the scope, the
 * pills or *Include closed* in a search, which each hand this component a different set of
 * differences.
 *
 * **It waits for the log.** `byFinding` reports every finding open until the log has been
 * read — the events start as `null` and the derivation runs over an empty list — and the
 * dashboard mounts this list on that first paint. A reading held from there would be an
 * all-open one, so the order would be ticket 81's for the life of the list and this would
 * be a ticket built and inert.
 *
 * A finding the list did not hold when the reading was taken — a block sibling's pages land
 * in a second fetch — is read from the log as it is now, because there is no earlier
 * reading of it to hold.
 *
 * @param {import('../lib/view.mjs').Repeat[]} repeats
 * @param {Map<string, object>} byFinding
 * @param {boolean} logRead  Whether the log has answered. Until it has, there is no reading
 *                           of it worth holding.
 */
function useWorstFirst(repeats, byFinding, logRead) {
  const [held, setHeld] = useState(/** @type {null | { rows: object[], log: Map }} */ (null));

  useEffect(() => {
    if (logRead && !sameRows(held?.rows, repeats)) setHeld({ rows: repeats, log: byFinding });
  }, [logRead, repeats, byFinding, held]);

  const asArrived = held?.log ?? byFinding;

  return useMemo(
    // `byFinding` is deliberately out of the dependencies: it changes on every decision an
    // editor makes, and re-taking the order on those is exactly the row moving out from
    // under them. It is still read for a finding the held reading does not know.
    () =>
      repeatsByOpenWork(
        repeats,
        (repeat) => barFor(repeat, (id) => asArrived.get(id) ?? byFinding.get(id)).open,
      ),
    [repeats, asArrived],
  );
}

/**
 * Whether a new list holds the same differences as the one the order was taken over.
 *
 * The array's identity is not the question: a search re-derives its result on every
 * decision, so it hands over a new array of the same rows, and re-taking the order on that
 * is the row moving under the editor. What the rows **are** is the question, and the two
 * lists arrive in the same derived order, so they are compared where they stand.
 */
const sameRows = (rows, repeats) =>
  rows?.length === repeats.length && rows.every((row, at) => row.key === repeats[at].key);

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
function FlatSelection({ repeats, byFinding, bulk, builtAt = null, children }) {
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
    /** @type {null | import('../../../overrides/bulk.mjs').PressReport} */ (null),
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

  // Every page the selection could reach, flattened once. It is the denominator the bar
  // states — *12 of 472 pages* — and the list the ticked ones are drawn from.
  const entries = useMemo(() => repeats.flatMap((repeat) => repeat.on), [repeats]);

  // The pages the presses are aimed at, narrowed **here** and once. This is the seam
  // `bulk.mjs` takes: it never sees a repeat and never sees the selection either, so a press
  // covering 259 differences is one short list of pages to it. Narrowing it there instead
  // would re-filter every page on screen — 25,657 differences' worth on the unnarrowed
  // list — on every keystroke of the note, because the note is what the press is memoised on.
  const chosen = useMemo(
    () => (ticked.size === 0 ? [] : entries.filter((entry) => ticked.has(entry.id))),
    [entries, ticked],
  );

  // Which differences the ticks are in, which decides what the bar can call itself and
  // nothing else. It is skipped while nothing is ticked, so an untouched list does not walk
  // 25,657 rows on every render.
  const holding = useMemo(
    () =>
      ticked.size === 0
        ? []
        : repeats.filter((repeat) => repeat.on.some((entry) => ticked.has(entry.id))),
    [repeats, ticked],
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
  const wide = holding.length > 1 || (ticked.size > 0 && ticked.size === entries.length);

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
  /** @type {null | { ticked: Set<string>, tick: Function, clear: Function }} */ (null),
);

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
function TriStateTick({ ids, label, title }) {
  const selection = useContext(SelectionContext);

  const all = ids.every((id) => selection.ticked.has(id));
  const some = !all && ids.some((id) => selection.ticked.has(id));

  return (
    <Checkbox
      checked={all}
      indeterminate={some}
      onCheckedChange={(ticked) => selection.tick(ids, some ? false : ticked)}
      aria-label={label}
      title={title}
    />
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
        title={SELECT_RESULT_TITLE}
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

const SELECT_RESULT_TITLE =
  'Selects every page of every difference in this result, including the ones not drawn' +
  ' yet. A selection decides nothing.';

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
export function ClassGroups({ repeats, classes, byFinding, logRead, bulk, link, language }) {
  const worstFirst = useWorstFirst(repeats, byFinding, logRead);
  const groups = useMemo(() => groupRepeatsByClass(worstFirst, classes), [worstFirst, classes]);

  // Which groups are open. The initial state is the derivation's `opensOnLoad`: closed,
  // unless a group is the only one holding anything or the pills already chose it.
  const [open, setOpen] = useState(() =>
    groups.filter((group) => group.opensOnLoad).map((group) => group.class),
  );

  // One at a time, on a click: two open groups is the wall again in halves. The pills may
  // still open several at load, and that is their call to make — they are the control that
  // chose those classes. Clicking from there collapses the rest, and re-toggling a pill is
  // what brings the pair back.
  const toggle = (cls) => setOpen(open.includes(cls) ? open.filter((held) => held !== cls) : [cls]);

  // How many rows each group draws, held **here** rather than inside the group. A closed
  // group unmounts its rows, so a budget living down there would reset every time: an
  // editor who paged `copy` to three hundred rows, looked at `casing` and came back would
  // find the paging gone. The budget is the group's, and the group keeps it for as long as
  // this list is on screen.
  const [budget, setBudget] = useState(/** @type {Record<string, number>} */ ({}));

  if (repeats.length === 0) return <NoRepeats />;

  return (
    // No `SelectResult` here — see the gate on it above, which is where that rule is
    // written. The selection itself is the same flat one: ticks made in two groups are one
    // selection, and one bar says so.
    <FlatSelection repeats={worstFirst} byFinding={byFinding} bulk={bulk}>
      <ul>
        {groups.map((group) => (
          <ClassGroupRow
            key={group.class}
            group={group}
            open={open.includes(group.class)}
            onToggle={() => toggle(group.class)}
            drawn={budget[group.class] ?? PAGE_SIZE}
            onDraw={(next) => setBudget({ ...budget, [group.class]: next })}
            byFinding={byFinding}
            link={link}
            language={language}
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
function ClassGroupRow({ group, open, onToggle, drawn, onDraw, byFinding, link, language }) {
  const count = group.repeats.length;

  return (
    <li className="border-b border-border last:border-0">
      <Collapsible open={open} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted">
          <span aria-hidden className="w-3 text-muted-foreground">
            {open ? '▾' : '▸'}
          </span>
          <ClassPill class={group.class} />
          {/* The count is this group's own rows and nothing summed from elsewhere.
              Opening it moves no count, no bar and no denominator: the repeat total
              across the groups is the total the footer states. */}
          <span className="text-muted-foreground tabular-nums">
            {count} {count === 1 ? 'difference' : 'differences'}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* The budget belongs to **this** group, and so does the button that pages it.
              One number over the whole list would draw a hundred rows of the first class
              and none of the fifth. */}
          <RowList
            repeats={group.repeats}
            byFinding={byFinding}
            link={link}
            language={language}
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
function RowList({ repeats, byFinding, link, language, drawn: given, onDraw, searched = false }) {
  const [held, setHeld] = useState(PAGE_SIZE);
  const drawn = given ?? held;
  const draw = (next) => (onDraw ? onDraw(next) : setHeld(next));

  return (
    <>
      <ul className="text-sm">
        {repeats.slice(0, drawn).map((repeat) => (
          <Row
            key={repeat.key}
            repeat={repeat}
            byFinding={byFinding}
            link={link}
            language={language}
            searched={searched}
          />
        ))}
      </ul>

      {drawn < repeats.length && (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {drawn} of {repeats.length} differences drawn.{' '}
          <Button variant="outline" size="xs" onClick={() => draw(drawn + PAGE_SIZE)}>
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
  <p className="px-4 py-6 text-sm text-muted-foreground">No difference found.</p>
);

/** How many rows are drawn at once, and how many the button adds. */
const PAGE_SIZE = 100;

/**
 * What the `×N` mark means on a repeat, which is not what it means on a finding: it
 * counts over the pages, and the row already says how many pages there are. Confusing
 * the two is this ticket's named trap, so the two sentences are written apart.
 */
const acrossPagesTitle = (repeat) =>
  `${repeat.occurrences} times in total, on ${repeat.on.length} ` +
  'pages. On some of those pages the difference is there more than once.';

function Row({ repeat, byFinding, link, language, searched }) {
  const [open, setOpen] = useState(false);

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
          <span className="mt-0.5 shrink-0">
            <SelectAll repeat={repeat} />
          </span>

          <CollapsibleTrigger className="flex flex-1 flex-wrap items-start gap-2 text-left">
            <span className="mt-0.5 shrink-0">
              <ClassPill class={repeat.class} />
              <Detail detail={repeat.detail} />
              <MatchedFields fields={repeat.fields} />
            </span>

            {/* The language is the list's and not this row's to find: a difference has no
                report and no store in scope, and reaching for a module-level store to get
                one would make a fact about two strings into application state. Two stores
                of a block share a language, so a repeat crossing one is still in one. */}
            <Comparison
              prod={repeat.prod}
              new={repeat.new}
              language={language}
              className="min-w-48 flex-1"
            />

            <span className="shrink-0 text-right text-xs">
              {/* The page count is the size of the difference. There is no separate
                finding count beside it: the page is inside the finding id, so one page
                carries one finding of this difference and the two numbers are one
                number. `occurrences` is the number that genuinely differs — the same
                difference several times on a single page — and it is named apart. */}
              <span className="font-medium tabular-nums">on {repeat.on.length} pages</span>
              {/* Drawn only when it exceeds the page count, so the mark appears exactly
                when it says something the page count does not. */}
              {repeat.occurrences > repeat.on.length && (
                <Occurrences count={repeat.occurrences} title={acrossPagesTitle(repeat)} />
              )}
              <span
                data-wears={closedTone ? 'ink' : null}
                data-tone={closedTone}
                className={cn('ml-2 tabular-nums', !closedTone && 'text-muted-foreground')}
              >
                {bar.closed} of {bar.denominator} closed
              </span>
            </span>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <PageTable repeat={repeat} byFinding={byFinding} link={link} searched={searched} />
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
 * Its label says **select** and never *closed*. The ledger already spends a checkbox on
 * the tri-state *Fixed* control, which genuinely is a decision (tickets 36 and 48), so
 * two checkboxes with two meanings share this screen and each has to say which it is.
 */
const SelectAll = ({ repeat }) => (
  <TriStateTick
    ids={repeat.on.map((entry) => entry.id)}
    label={`Select all ${repeat.on.length} pages of this difference`}
    title="Selects each page of this difference. A selection decides nothing."
  />
);

/**
 * What one tick announces. It names the store only where the difference crosses a block,
 * which is the same test — and the same one call — the cell beside it draws under.
 *
 * Two pages of one difference can otherwise carry the same name: `afhalen` on `nl` and
 * `afhalen` on `be` are two ticks a screen reader could not tell apart (ticket 03).
 */
const selectLabel = (repeat, entry) =>
  crossesBlock(repeat) ? `Select ${entry.page} on ${entry.store}` : `Select ${entry.page}`;

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
 */
function PageTable({ repeat, byFinding, link, searched }) {
  const selection = useContext(SelectionContext);

  return (
    <div className="border-t border-border bg-muted px-4 py-2 text-sm">
      <Table>
        {/* Under a search these are the **matching** pages and a difference may be on
            more: `searchStore()` builds its repeats out of matched findings only, and a
            term can be in one page's key and not another's. Ticking all of them is then a
            press on the matches, which is right — and unsayable if this line is missing. */}
        {searched && (
          <TableCaption className="mt-2 text-left text-xs">
            These are the pages where the search term was found. This difference can be on more
            pages; those are not here and they are not decided with these.
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            {/* The header word is drawn for a screen reader and not for an eye. A header
                cell holding nothing but a checkbox announces nothing, and *Select* beside
                the tick would be a word repeated in every label under it. */}
            <TableHead className="w-8">
              <SelectAll repeat={repeat} />
              <span className="sr-only">Select</span>
            </TableHead>
            <TableHead>Page</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repeat.on.map((entry) => (
            <TableRow
              key={entry.id}
              data-state={selection.ticked.has(entry.id) ? 'selected' : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selection.ticked.has(entry.id)}
                  onCheckedChange={(ticked) => selection.tick([entry.id], ticked)}
                  aria-label={selectLabel(repeat, entry)}
                />
              </TableCell>
              <TableCell className="whitespace-normal">
                <a
                  className={cn('hover:underline', CHROME.link)}
                  href={link(entry.store, entry.page, entry.id)}
                >
                  {entry.page}
                </a>
                {/* Which store this page is on, and **only** where the difference crosses a
                    block. On a row inside a single store it would be the store whose
                    dashboard this is, printed once per page for no reader. */}
                {crossesBlock(repeat) && (
                  <span className="ml-2 text-xs text-muted-foreground">on {entry.store}</span>
                )}
                <Occurrences count={entry.occurrences} title={onePageTitle(entry.occurrences)} />
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
 * Nothing here when there are no fields, which is the *Repeats* view: it lists every
 * difference and no term was typed, so there is nowhere a match could have been.
 */
const MatchedFields = ({ fields }) =>
  fields?.length ? (
    <span className="ml-2 text-xs text-muted-foreground">
      in {fields.map((field) => FIELD_LABEL[field]).join(', ')}
    </span>
  ) : null;

/** The six searchable fields, as the dashboard says them. */
const FIELD_LABEL = {
  page: 'the page name',
  prodText: 'the text on production',
  newText: 'the text on the new site',
  linkTarget: 'the link target',
  linkText: 'the link text',
  anchorHeading: 'the heading',
};

/**
 * What is decided about this finding, in **the log's own words for it** — the map
 * the override control reads, and not a second copy of it. An `open` finding says
 * nothing: it is the default, and a badge on every row would make the decided ones
 * harder to find rather than easier.
 */
const FindingState = ({ finding }) =>
  finding && finding.state !== 'open' ? (
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
