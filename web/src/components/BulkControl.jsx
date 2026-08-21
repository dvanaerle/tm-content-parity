import { useMemo, useRef, useState } from 'react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Label } from './ui/label.jsx';
import { Dismiss, Floating } from './Floating.jsx';
import PressReport from './PressReport.jsx';
import { OfPages, Selected } from './Selected.jsx';
import { bulkClear, bulkDismissal } from '../lib/bulk.mjs';
import { crossesBlock } from '../lib/view.mjs';
import { classInfo } from '../lib/classes.mjs';
import { day } from '../lib/dates.mjs';

/**
 * What this bar is called wherever it is reached for — the two states below draw the same
 * shell, and a name spelled twice is a name half of the tests can stop finding.
 */
const BAR = 'bulk-bar';

/**
 * One reason, many findings (ticket 31).
 *
 * An editor decides once about a difference that is on several pages, and the log records
 * one decision **per finding**, each with their name. There is no bulk scope and no repeat
 * scope: a repeat is a grouping the interface makes, it has no identity to key on, and
 * ticket 09 settled that a bulk write is N page-scoped events. The table gains nothing.
 *
 * **On the pages that were ticked** since ticket 110, and only on those. It was
 * all-or-nothing before: the buttons were always on screen and always meant *all ten*, so
 * an editor who disagreed about one page had to abandon the bulk press and decide ten
 * pages one at a time. This is the same press with a selection in front of it, and it
 * **replaces** the whole-repeat one rather than sitting beside it — two ways to press one
 * thing, differing only in whether you ticked first, is the doubling this project keeps
 * deleting.
 *
 * So it is drawn only when something is ticked, and since round three it **floats** — over
 * the queue rather than in it, in the panel `Floating.jsx` draws and says the reasons for.
 * There is one of it, because there is one place for it to be: `Repeats.jsx` holds the
 * selection for the whole list and renders this beside it.
 *
 * **It is one bar over as many differences as were ticked** (ticket 138). The selection was
 * one difference's until then, so this was rendered by that difference and said its words;
 * now it is a flat set over the result, so it is rendered once by the list and says the
 * difference's words only while the ticks are all in one. There is no second surface that
 * could claim the same ticks — a per-difference bar and a result-wide bar would be two
 * counts of one selection, and the editor would have to work out which press was theirs.
 *
 * **Two presses**, and the second is the way back: `OverrideControl.jsx` has offered
 * *Clear* on one decided finding since ticket 29, and this offered nothing at all
 * there. A press that can put ten pages in a state and cannot take them out of it is a
 * one-way door with a ten-page way back, which is the work ticket 110 exists to remove.
 *
 * There were three until ticket 112. The bulk press was the larger of the two doors to the
 * second judgement, and ADR 0011 shut both: a dismissal is the only judgement now, so the
 * choosing this bar used to explain — which judgement, at what cost, on which pages each
 * was eligible for — has no second thing to choose between and went with the press.
 *
 * It is a **toolbar**: one strip, the selection on the left and what can be done with it
 * on the right. Round one ran the count, the buttons and three paragraphs down the page,
 * and round two found the paragraphs unread. What is left is what changes a press — the
 * counts, the sentence saying why the buttons are absent, and the one line saying why the
 * dismissal is spent where every page is already decided. The corpus statistics that
 * argued for the design went with the rest of the prose.
 *
 * @param {object} props
 * @param {import('../lib/view.mjs').RepeatEntry[]} props.entries  The ticked pages, which
 *   are the pages both presses are aimed at.
 * @param {number} props.pages  Every page under the selection, which is the denominator.
 * @param {import('../lib/view.mjs').Repeat[]} props.holding  The differences the ticks are
 *   in. One of them is what lets this bar say that difference's own words.
 * @param {string | null} props.builtAt  The snapshot the ticks were made over, where that is
 *   worth saying. The caller decides that, because it is the caller that knows how the
 *   selection was made.
 * @param {(ids: string[]) => void} props.onWritten  The findings a press got written, handed
 *   back so their ticks come off (ticket 139). What is left ticked is what is left to write.
 * @param {null | import('../../../overrides/bulk.mjs').PressReport} props.report  The last
 *   press's report. It is the caller's state and not this bar's, because a press that writes
 *   everything unticks the whole selection and would otherwise unmount the bar holding its
 *   own answer — `FlatSelection` says why.
 * @param {(report: null | import('../../../overrides/bulk.mjs').PressReport) => void} props.onReport
 *   Neither is optional. A default would let a caller mount this bar with no way to hold a
 *   report, and the state that draws one would then be silently unreachable.
 */
export default function BulkControl({
  entries,
  pages,
  byFinding,
  bulk,
  onClear,
  onWritten,
  report,
  onReport,
  holding,
  builtAt = null,
}) {
  // The one difference the ticks are in, where there is one. `null` when they span several,
  // which is what turns every sentence on this bar from one about a difference into one
  // about the result.
  const repeat = holding.length === 1 ? holding[0] : null;
  /** @type {['dismiss' | 'clear' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  const [restated, setRestated] = useState('');
  /**
   * How far the press in flight has got, and `null` when none is. It is the press's own
   * reading of itself: `appendEach()` is the only thing that knows, and a run of 329 pages
   * is otherwise a wait with nothing in it.
   */
  const [running, setRunning] = useState(
    /** @type {null | { written: number, total: number }} */ (null),
  );
  /** The way out of the run in flight. A ref, because pressing *Stop* must not wait for a
      render to reach the loop that is already going. */
  const stopper = useRef(/** @type {AbortController | null} */ (null));

  const dismissal = useMemo(
    () => bulkDismissal({ entries, byFinding, note }),
    [entries, byFinding, note],
  );

  /**
   * The second press, and the only one that writes on the first click: a `cleared` event
   * carries no reason, so there is no note to ask for and no form to open. It mirrors the
   * single control, which has taken one decision back with one press since ticket 29.
   */
  const cleared = useMemo(() => bulkClear({ entries, byFinding }), [entries, byFinding]);

  const close = () => {
    setAsking(null);
    setNote('');
    setRestated('');
  };

  /**
   * Both presses report the same way, and the form closes only when **every** row was
   * written. `stoppedOn` is not the test: a press with no name written stores nothing and
   * names no page, and keying on `stoppedOn` alone would clear the form and report
   * nothing — the interface claiming a success that never happened.
   */
  const press = async (events) => {
    if (events.length === 0) return;

    stopper.current = new AbortController();
    setRunning({ written: 0, total: events.length });
    const result = await bulk.appendMany(events, {
      signal: stopper.current.signal,
      onProgress: setRunning,
    });
    stopper.current = null;
    setRunning(null);
    onReport(result);

    // The clearing's gate is spent by the press it gated, whatever became of it. A run that
    // stopped leaves a **smaller** remainder, so the count on screen is no longer the count
    // that was typed — and below a handful there is nothing left to restate at all. Back to
    // the button, which asks again only if the remainder still needs it.
    setAsking((open) => (open === 'clear' ? null : open));
    setRestated('');

    // The ticks of the pages that were written come off, and the remainder stays: what is
    // still ticked after a stopped run is exactly what is left to write, so pressing again
    // carries on rather than starting over. Nothing is rolled back, so nothing goes back on.
    onWritten(result.stored.map((row) => row.findingId));

    if (result.written === result.total && !result.error) close();
  };

  /*
   * A press that wrote everything, still on screen to say so (ticket 139, ADR 0019).
   *
   * Nothing is ticked any more — the press took the ticks of what it wrote — so there is no
   * selection to name and no press to offer, and every sentence below would be about a
   * selection of nothing. What is left is the one thing the editor needs: the report, and the
   * way to put it down.
   */
  if (entries.length === 0)
    return (
      <Floating slot={BAR}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div role="status" aria-live="polite" data-slot="bulk-progress">
            {report && <PressReport {...report} />}
          </div>
          <Dismiss onClear={onClear} />
        </div>
      </Floating>
    );

  return (
    <Floating slot={BAR}>
      {/* One strip: what is selected on the left, what can be done with it on the right.
          Round one ran the count, the presses and three paragraphs of explanation down the
          page, and what an editor could *do* was buried in prose. It is not a
          `role="toolbar"`: that role promises arrow-key navigation between its controls,
          and these are ordinary tab stops in the order the selection was made. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Selection
          repeat={repeat}
          differences={holding.length}
          pages={pages}
          count={entries.length}
        />

        <div className="flex flex-wrap items-center gap-1">
          {/* Two buttons: the judgement and the way back out of it. They are offered
              **independently** — a difference whose every finding is decided has nothing
              left to dismiss, and the undo is exactly what is live there. Gating one on the
              other's eligibility is what took a press off screen precisely where it was the
              only tool left. */}
          {bulk?.canWrite && asking === null && (
            <>
              {dismissal.covers > 0 && (
                <Button variant="outline" size="sm" onClick={() => setAsking('dismiss')}>
                  Dismiss on {dismissal.covers === 1 ? 'this page' : `${dismissal.covers} pages`}…
                </Button>
              )}
              {/* The ellipsis is the honest one: this press writes on the first click the
                  way the single control's *Cleared* does — a `cleared` event carries no
                  reason, so there is no note to type — and past a handful of pages it asks
                  for the count instead (ticket 139). One label, and the three dots appear
                  exactly where there is a second step. It is still the one press whose
                  label carries *Saving…* itself, since it has no form of its own. */}
              {cleared.covers > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulk.busy}
                  onClick={() =>
                    needsRestating(cleared.covers) ? setAsking('clear') : press(cleared.events)
                  }
                  title={clearTitle(cleared)}
                >
                  {bulk.busy
                    ? 'Saving…'
                    : `Clear the decision on ${cleared.covers === 1 ? 'this page' : `${cleared.covers} pages`}`}
                  {needsRestating(cleared.covers) && '…'}
                </Button>
              )}
            </>
          )}

          {!bulk?.canWrite && <NotWriting reason={bulk?.notWritingReason} />}
        </div>

        <Dismiss onClear={onClear} />
      </div>

      {builtAt && <OverTheSnapshot builtAt={builtAt} />}

      {/* One region and never two (ticket 139): the run's progress and the report of how it
          ended are two readings of the same press, and a screen reader given a live region
          apiece would hear the press announce itself twice. The filter strip is not this
          either — it enumerates what narrows the list, and a press narrows nothing. */}
      <div role="status" aria-live="polite" data-slot="bulk-progress">
        {running ? (
          <Running {...running} onStop={() => stopper.current?.abort()} />
        ) : (
          report && <PressReport {...report} />
        )}
      </div>

      {/* The clearing's size and its stores, beneath the press that has no form to say them
          in. It is withheld only while the **dismissal's** form is open: `Covers` is saying
          the same thing about that press there, and two sentences naming two stores would
          read as two decisions crossing. Over the clearing's own gate it is the opposite —
          an editor typing the count back is exactly who has to be told the press leaves the
          store. */}
      {bulk?.canWrite && asking !== 'dismiss' && cleared.covers > 0 && crossesBlock(cleared) && (
        <ClearCrossesBlock cleared={cleared} oneDifference={Boolean(repeat)} />
      )}

      {bulk?.canWrite && asking === null && dismissal.covers === 0 && <NothingToDismiss />}

      {bulk?.canWrite && cleared.covers > 0 && asking === 'clear' && (
        <RestateTheCount
          covers={cleared.covers}
          typed={restated}
          onType={setRestated}
          busy={bulk.busy}
          onConfirm={() => press(cleared.events)}
          onCancel={close}
        />
      )}

      {bulk?.canWrite && dismissal.covers > 0 && asking === 'dismiss' && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(submit) => {
            submit.preventDefault();
            press(dismissal.events);
          }}
        >
          {/* One title, one task, one main action (ADR 0019). The task was stated in a
              placeholder, which is not a title: it disappears the moment the editor types,
              it is no element's accessible name, and it left the panel opening on an
              unlabelled box above a sentence about page counts. As a label it stays on
              screen while the sentence is written, and the input has a name a screen reader
              can announce. */}
          <Label htmlFor="bulk-dismissal-note" className="font-medium text-foreground">
            Why is this not a defect?
          </Label>
          <Covers dismissal={dismissal} oneDifference={Boolean(repeat)} />
          <div className="flex flex-wrap items-center gap-1">
            <Input
              autoFocus
              id="bulk-dismissal-note"
              value={note}
              onChange={(change) => setNote(change.target.value)}
              className="w-64"
            />
            {/* One note, copied to all N rows. The SQL constraint refuses a dismissal
                without one anyway, so the button cannot be pressed without it. */}
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={dismissal.events.length === 0 || bulk.busy}
              title={dismissal.events.length === 0 ? 'A decision needs a reason.' : undefined}
            >
              {bulk.busy
                ? 'Saving…'
                : `Dismiss on ${dismissal.covers} ${dismissal.covers === 1 ? 'page' : 'pages'}`}
            </Button>
            {/* `type="button"` and not the default. A button inside a form submits it, so
                without this the cancel *presses* the decision it is there to abandon:
                `close()` runs, the submit fires behind it, and N rows land in an
                append-only table that has nothing to undo them with. */}
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Floating>
  );
}

/**
 * What is ticked, and **what it is ticked on** (ticket 110, ticket 138).
 *
 * The second half is not decoration, and it matters more now that the bar floats: what the
 * ticks are in can be scrolled off the screen entirely, and *2 selected* pinned to the
 * bottom of a queue of four thousand is a number with no subject.
 *
 * So there are two sentences and the selection picks which. Ticks inside one difference
 * name that difference by its **class**. Ticks spanning several name the result — how many
 * differences, out of how many pages — because there is no one class to print and printing
 * the first one's would say the press is narrower than it is.
 *
 * **It names its object and its scope and never its content** (ADR 0019). The two texts
 * were drawn here, in full, under a bar fixed over the rows that were already drawing
 * them — so an editor read the same pair of strings twice and the count they were about to
 * press on was the smaller half of it. What a bar has to say is which pages and which
 * difference; what the difference *is* is on screen above it and is the reason the ticks
 * are there at all.
 */
const Selection = ({ repeat, differences, pages, count }) => (
  <Selected count={count}>
    {repeat ? (
      <OnOneDifference repeat={repeat} />
    ) : (
      <OverTheResult differences={differences} pages={pages} />
    )}
  </Selected>
);

/** The ticks of one difference, named by its class. */
const OnOneDifference = ({ repeat }) => (
  <span>
    <OfPages pages={repeat.on.length} /> selected on <ClassWord class={repeat.class} />.
  </span>
);

/**
 * The ticks of a selection that spans differences (ticket 138).
 *
 * The count of differences is beside the pages because it is the number the editor chose
 * in — they ticked rows, and the pages followed.
 */
const OverTheResult = ({ differences, pages }) => (
  <span>
    <OfPages pages={pages} /> selected over{' '}
    <strong className="font-medium text-foreground tabular-nums">
      {differences} {differences === 1 ? 'difference' : 'differences'}
    </strong>
    .
  </span>
);

/**
 * Which snapshot the ticks were made over, said once above a wide press (ticket 138).
 *
 * The selection is built over the file the last build wrote. Eligibility — what each press
 * may act on — and the *closed* count beside every row are read from the live log. A finding
 * a colleague fixed since that build is still tickable here; one created since is not on this
 * screen at all.
 *
 * That straddle is not new and it is not a bug: it is what a build-time snapshot and an
 * append-only log are. What is new is the size. At four rows nobody notices; at 472 it is
 * the one place staleness can do damage, so the date is stated before the press rather than
 * left to be worked out from the line above the list.
 *
 * **Whether it is worth saying is the caller's call** and not this bar's: a `builtAt` arrives
 * only where the press is one no editor built by eye. So there is no size test here and no
 * threshold to defend.
 */
const OverTheSnapshot = ({ builtAt }) => (
  <p className="text-xs text-muted-foreground">
    These ticks are over the snapshot of{' '}
    <strong className="font-medium text-foreground">{day(builtAt)}</strong>. What each press may act
    on is read from the log as it is now.
  </p>
);

/**
 * Why the dismissal is not on screen, said where it would have been.
 *
 * This line used to be one half of a sentence about **choosing**: a dismissal dies with the
 * text and the other judgement did not, so an editor picking between them was told which was
 * which. Only one judgement is left (ADR 0011), so there is nothing to choose and nothing to
 * compare — what survives is the half that explains an absence.
 *
 * It matters more now than it did. A difference whose every finding is closed used to keep
 * the second judgement, so the bar was never empty of presses there; the undo can be spent too, and
 * then this sentence is the only thing on the strip below the selection. Ticket 112 names
 * that case: it is correctly empty, and it must not read as a broken screen.
 *
 * The word is **closed** and no longer *decided*. `offersDismissal()` withholds the
 * press on `fixed` as well as on the two judgements, so this sentence is drawn over a
 * difference somebody merely ticked off as corrected — and *decided* would call that a
 * judgement, which is the one distinction this control exists to keep (a claim of fact
 * loses to a re-check; a judgement does not). *Closed* is what the row above already
 * says of the same findings, and it is true of both.
 */
const NothingToDismiss = () => (
  <p className="text-xs text-muted-foreground">
    Every finding here is closed already, so there is nothing to dismiss.
  </p>
);

/**
 * What the press covers, said before it is made, and what it does **not** cover.
 *
 * The size is stated in **pages** and in no second unit. `CONTEXT.md`'s *Repeat* entry is
 * explicit: the page is a term of the finding id, so one page carries one finding of this
 * difference — "how many findings" and "how many pages" are one number, and printing both
 * is the doubled figure the repeat list exists to stop. The row header above says pages;
 * so does this.
 *
 * What it does **not** say is that a dismissal dies the day either text changes. Round two
 * cut that from here because `Choice` said it a line above; ticket 112 then cut `Choice`
 * itself, since it was one half of a **comparison** with the override ADR 0011 withdrew. So
 * the fact is now nowhere on this bar. That is a deliberate consequence of ADR 0011 and not
 * an oversight — expiry is no longer a thing an editor *chooses between*, it is simply what
 * the one judgement does — and if it is ever wanted back it is a sentence of its own here,
 * not a resurrection of the choosing.
 */
function Covers({ dismissal, oneDifference }) {
  // The total is the seam's own two numbers added, and never the repeat's size or a second
  // reading of the selection: the sentence has to count the same pages the events do
  // (ticket 110), and one arithmetic in one place is how it cannot drift.
  const pages = dismissal.covers + dismissal.decided;

  return (
    <p className="text-xs text-muted-foreground">
      <strong className="font-medium text-foreground tabular-nums">
        {dismissal.covers} {dismissal.covers === 1 ? 'page' : 'pages'}
      </strong>
      {dismissal.decided > 0
        ? ` of the ${pages}: the other ${dismissal.decided} ${dismissal.decided === 1 ? 'is' : 'are'} decided already.`
        : '.'}
      {crossesBlock(dismissal) && (
        <InWhichStores stores={dismissal.stores} oneDifference={oneDifference} />
      )}
    </p>
  );
}

/**
 * **In which stores**, said before the press (ticket 03).
 *
 * The sentence itself and not the decision to draw it — `crossesBlock()` is that, and this is
 * written once for the two presses that say it. It used to exist twice in two wordings: this
 * one, and a shorter one inside the clearing's `title`. Two wordings of one fact is two facts
 * as far as an editor reading them is concerned.
 *
 * The clause explaining **why** is drawn only over one difference (ticket 138). *The same
 * words are one decision* is what makes a block-spanning row one row: `nl/afhalen` and
 * `be/afhalen` carry the same string. Over a selection spanning differences the strings are
 * not the same and that sentence would be a false reason for a true fact — the press does
 * reach two stores, and it reaches them because the pages ticked are on both.
 */
const InWhichStores = ({ stores, oneDifference }) => (
  <>
    {' '}
    Written in <strong className="font-medium text-foreground">{stores.join(' and ')}</strong>
    {oneDifference
      ? ': these two stores share a language, so the same words are one decision.'
      : '.'}
  </>
);

/**
 * The clearing's own **in which stores**, on screen (ticket 03).
 *
 * The dismissal has a form to state its size and its stores in; this press writes on the
 * first click and had only its `title`, so the sentence naming a second store was visible on
 * hover and nowhere else — absent on touch, and absent to anyone arriving at the button by
 * keyboard. *States, before the press, in which stores* is not a thing a tooltip can do.
 *
 * It is drawn **only** where the press crosses, which is what keeps it from being a line
 * under every clearing on `de` and `uk`: the interface is quiet by default (ADR 0019), and
 * this sentence earns its place by saying that a decision is about to leave the store.
 */
const ClearCrossesBlock = ({ cleared, oneDifference }) => (
  <p className="text-xs text-muted-foreground">
    Clearing on{' '}
    <strong className="font-medium text-foreground tabular-nums">
      {cleared.covers} {cleared.covers === 1 ? 'page' : 'pages'}
    </strong>
    .
    <InWhichStores stores={cleared.stores} oneDifference={oneDifference} />
  </p>
);

/**
 * How far the press has got, and the way out of it (ticket 139).
 *
 * A dismissal over 329 pages is 329 inserts one after another, and until this line existed
 * the whole of it was a button reading *Saving…*: no way to tell a slow log from a stuck
 * one, and no way to stop. It counts in **pages saved**, which is the unit every other
 * sentence on this bar is in and the unit the report it turns into ends in.
 *
 * *Stop* aborts between events and never inside one, so what it leaves behind is whole
 * events and a remainder still ticked. It is not an undo and does not say it is: the table
 * is append-only, and the rows already written stay written.
 */
const Running = ({ written, total, onStop }) => (
  <p className="flex items-center gap-2 text-xs text-muted-foreground">
    <strong className="font-medium text-foreground tabular-nums">
      {/* The count that moves is **not** announced, and only it. The line is inside the
          bar's live region, so it is read once when the press starts and once when it ends;
          without this a run of 329 pages would queue 329 announcements of a number nobody
          asked to hear again, and the *Stop* beside it would be buried under them. */}
      Saving <span aria-live="off">{written}</span> of {total}…
    </strong>
    <Button type="button" variant="outline" size="sm" onClick={onStop}>
      Stop
    </Button>
  </p>
);

/**
 * The clearing's gate: the count, typed back (ticket 139).
 *
 * The two presses are not symmetrical and this is where that shows. A dismissal already
 * costs a form and a mandatory reason — an editor who types a sentence about why 300 pages
 * are not a defect has restated the press by writing it. A clearing carries no reason, so
 * over a wide selection it went from one click to 300 revoked decisions with nothing in
 * between, and it is the press that throws work away.
 *
 * The gate is the **count** and not a yes/no: an *Are you sure?* is a reflex to click
 * through, and the number is the one thing about a wide press an editor can actually check
 * against the bar above it. Under a handful there is no gate at all, because a press an
 * editor can see the whole of does not need to be spelled back.
 */
const RestateTheCount = ({ covers, typed, onType, busy, onConfirm, onCancel }) => (
  <form
    className="flex flex-wrap items-center gap-1"
    onSubmit={(submit) => {
      submit.preventDefault();
      onConfirm();
    }}
  >
    <label className="text-xs text-muted-foreground" htmlFor="restate-the-count">
      Type <strong className="font-medium text-foreground tabular-nums">{covers}</strong> to clear
      the decision on {covers} pages.
    </label>
    <Input
      autoFocus
      id="restate-the-count"
      value={typed}
      onChange={(change) => onType(change.target.value)}
      inputMode="numeric"
      className="w-20"
    />
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={busy || typed.trim() !== String(covers)}
    >
      {busy ? 'Saving…' : `Clear the decision on ${covers} pages`}
    </Button>
    {/* `type="button"`, for the reason the dismissal's cancel states: the default submits
        the form this one is there to abandon. */}
    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
      Cancel
    </Button>
  </form>
);

/**
 * How many pages a press can cover before it has to be restated. *A handful* is what an
 * editor can see the whole of on the bar above the button; past it the number is the only
 * thing they have, so it is the thing they type.
 */
const HANDFUL = 5;

const needsRestating = (covers) => covers > HANDFUL;

/**
 * Why this press is on fewer pages than are ticked, said where the gap is (ticket 110).
 *
 * The other two presses have a form to state their two numbers in; this one writes on the
 * first click and has only its own label. So the count it leaves alone lives in the
 * `title`, which is where round two put everything that explains a number already on
 * screen rather than changing what an editor presses.
 */
const clearTitle = ({ covers, skipped }) =>
  'Removes the decision and puts the difference back to open.' +
  (skipped > 0
    ? ` ${skipped} of the ${covers + skipped} selected pages stays as it is: nothing is` +
      ' decided there, or it is a claim that the Fixed tick takes back.'
    : '');

/**
 * The class named inside a sentence, in words rather than as a pill. The pill is a
 * label on a row; here the class is what the selection is *on*, and a coloured chip
 * mid-sentence reads as a second control.
 */
const ClassWord = ({ class: cls }) => (
  <span className="font-medium text-foreground">{classInfo(cls).label}</span>
);

/** Why the buttons are absent, which is never nothing at all. */
const NotWriting = ({ reason }) => (
  <p className="text-xs text-muted-foreground">{reason ?? 'A decision cannot be made here now.'}</p>
);
