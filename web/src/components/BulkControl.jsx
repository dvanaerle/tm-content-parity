import { useMemo, useState } from 'react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { INK } from '../lib/palette.mjs';
import { bulkClear, bulkDismissal, bulkMute } from '../lib/bulk.mjs';
import { sectionName } from '../lib/mute.mjs';
import { cn } from '../lib/utils.js';

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
 * So it is drawn only when something is ticked, and since round three it **floats**: fixed
 * to the bottom of the viewport, over the queue rather than in it. Round two put it in the
 * flow under the difference, which moved the whole list down the moment a tick was made and
 * took the presses off screen as soon as the editor scrolled into a long page list. There
 * is one of it, because there is one place for it to be — `Repeats.jsx` holds the selection
 * for the whole list, and ticking in a second difference takes it.
 *
 * **Three presses since round two**, and the third is the way back: `OverrideControl.jsx`
 * has offered *Ongedaan maken* on one decided finding since ticket 29, and this offered
 * nothing at all there. A press that can put ten pages in a state and cannot take them out
 * of it is a one-way door with a ten-page way back, which is the work this ticket exists
 * to remove.
 *
 * It is a **toolbar**: one strip, the selection on the left and what can be done with it
 * on the right. Round one ran the count, the buttons and three paragraphs down the page,
 * and round two found the paragraphs unread. What is left is what changes a press — the
 * counts, the refusals, the one line on how the two judgements differ, and the sentence
 * saying why the buttons are absent. The corpus statistics that argued for the design went
 * with the rest of the prose.
 */
export default function BulkControl({ repeat, byFinding, bulk, selected, onClear }) {
  /** @type {['dismiss' | 'mute' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  /** The last press's report. Held so a partial failure stays on screen to be read. */
  const [report, setReport] = useState(/** @type {null | { written: number, total: number, failedOn: string | null }} */ (null));

  const dismissal = useMemo(
    () => bulkDismissal({ repeat, byFinding, note, selected }),
    [repeat, byFinding, note, selected],
  );

  const mute = useMemo(
    () => bulkMute({
      repeat, byFinding, findingsByPage: bulk?.findingsByPage ?? new Map(), note, selected,
    }),
    [repeat, byFinding, bulk?.findingsByPage, note, selected],
  );

  /**
   * The third press, and the only one that writes on the first click: a `cleared` event
   * carries no reason, so there is no note to ask for and no form to open. It mirrors the
   * single control, which has taken one decision back with one press since ticket 29.
   */
  const cleared = useMemo(
    () => bulkClear({ repeat, byFinding, selected }),
    [repeat, byFinding, selected],
  );

  const close = () => { setAsking(null); setNote(''); };

  /**
   * Both presses report the same way, and the form closes only when **every** row was
   * written. `failedOn` is not the test: a press with no name written stores nothing and
   * names no page, and keying on `failedOn` alone would clear the form and report
   * nothing — the interface claiming a success that never happened.
   */
  const press = async (events) => {
    if (events.length === 0) return;
    const result = await bulk.appendMany(events);
    setReport(result);
    if (result.written === result.total && !result.error) close();
  };

  return (
    /* It **floats**, fixed to the bottom of the viewport and centred (round three).
       Round two made it a strip under the difference, which is where a selection's
       toolbar goes wrong twice: it pushed the rest of the queue down the instant a tick
       was made, and it scrolled away with the difference it belonged to — so an editor
       reading page forty of a repeat had the presses off screen while the pages they act
       on were in front of them. Fixed, it is where the selection is, for as long as the
       selection is.

       `w-fit` with a max: the bar is as wide as its own words, up to the width of the
       page, so a two-page selection does not draw a strip across an empty screen. It
       stops at the viewport edge and wraps rather than being clipped. */
    <div
      data-slot="bulk-bar"
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-[min(64rem,calc(100vw-2rem))]',
        'flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-lg',
      )}
    >
      {/* One strip: what is selected on the left, what can be done with it on the right.
          Round one ran the count, the presses and three paragraphs of explanation down the
          page, and what an editor could *do* was buried in prose. It is not a
          `role="toolbar"`: that role promises arrow-key navigation between its controls,
          and these are ordinary tab stops in the order the selection was made. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Selection repeat={repeat} count={selected.size} />

        <div className="flex flex-wrap items-center gap-1">
          {/* Three buttons and never one. A dismissal expires with the text, a mute does
              not, and an undo takes one of the two back — an editor choosing between them
              is choosing between those behaviours, and a single *afhandelen* control would
              make the choice for them.

              They are offered **independently**. A difference whose every finding is
              decided has nothing left to dismiss, and both of the others are live there.
              Gating them on the dismissal's eligibility took the mute off screen exactly
              where it was the only tool left. */}
          {bulk?.canWrite && asking === null && (
            <>
              {dismissal.covers > 0 && (
                <Button variant="outline" size="xs" onClick={() => setAsking('dismiss')}>
                  Negeren op {dismissal.covers === 1 ? 'deze pagina' : `${dismissal.covers} pagina's`}…
                </Button>
              )}
              <Button
                variant="outline"
                size="xs"
                onClick={() => setAsking('mute')}
                // The denominator rule is `CONTEXT.md`'s own — gedempt werk is uit de
                // balk, niet afgehandeld — and it is background rather than instruction,
                // so it is here rather than in a paragraph above the button.
                title={mute.offered
                  ? 'Dempt de soort in die sectie. Vervalt niet, en haalt het werk uit de noemer.'
                  : 'Kan hier niet in bulk.'}
              >
                Dempen op {mute.pages === 1 ? 'deze pagina' : `${mute.pages} pagina's`}…
              </Button>
              {/* No ellipsis, because there is nothing further to ask: this one writes on
                  the first press, the way the single control's *Ongedaan maken* does. A
                  `cleared` event carries no reason, so there is no note to type — and it
                  is the one press here whose label has to carry *Bezig…* itself, since it
                  has no form to show it in. */}
              {cleared.covers > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={bulk.busy}
                  onClick={() => press(cleared.events)}
                  title={clearTitle(cleared)}
                >
                  {bulk.busy
                    ? 'Bezig…'
                    : `Ongedaan maken op ${cleared.covers === 1 ? 'deze pagina' : `${cleared.covers} pagina's`}`}
                </Button>
              )}
            </>
          )}

          {!bulk?.canWrite && <NotWriting reason={bulk?.notWritingReason} />}

        </div>

        {/* Unticking ten rows one at a time is the work this control exists to remove, so
            putting the selection down costs one press as well. It is offered whether or not
            the log can be written to: it is not a decision.

            It is the cross at the end of the bar, behind a rule, where a floating bar of
            this kind puts it — and never a word among the presses, where *wissen* sits one
            tab stop from *dempen* and reads like a fourth thing to decide. A glyph names
            nothing, so the words it replaced are its label. */}
        <span aria-hidden className="ml-auto h-4 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClear}
          aria-label="Selectie wissen"
          title="Selectie wissen"
        >
          <span aria-hidden>✕</span>
        </Button>
      </div>

      {report && <Report {...report} />}

      {bulk?.canWrite && asking === null && <Choice canDismiss={dismissal.covers > 0} />}

      {bulk?.canWrite && dismissal.covers > 0 && asking === 'dismiss' && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(submit) => { submit.preventDefault(); press(dismissal.events); }}
        >
          <Covers dismissal={dismissal} />
          <div className="flex flex-wrap items-center gap-1">
            <Input
              autoFocus
              value={note}
              onChange={(change) => setNote(change.target.value)}
              placeholder="Waarom is dit geen defect?"
              className="w-64"
            />
            {/* One note, copied to all N rows. The SQL constraint refuses a dismissal
                without one anyway, so the button cannot be pressed without it. */}
            <Button
              type="submit"
              variant="outline"
              size="xs"
              disabled={dismissal.events.length === 0 || bulk.busy}
              title={dismissal.events.length === 0 ? 'Een beslissing heeft een reden nodig.' : undefined}
            >
              {bulk.busy
                ? 'Bezig…'
                : `Negeren op ${dismissal.covers} ${dismissal.covers === 1 ? 'pagina' : "pagina's"}`}
            </Button>
            {/* `type="button"` and not the default. A button inside a form submits it, so
                without this the cancel *presses* the decision it is there to abandon:
                `close()` runs, the submit fires behind it, and N rows land in an
                append-only table that has nothing to undo them with. */}
            <Button type="button" variant="outline" size="xs" onClick={close}>Annuleren</Button>
          </div>
        </form>
      )}

      {bulk?.canWrite && asking === 'mute' && (
        <MuteForm
          mute={mute}
          repeat={repeat}
          decided={dismissal.decided}
          note={note}
          setNote={setNote}
          busy={bulk.busy}
          onCancel={close}
          onPress={() => press(mute.events)}
        />
      )}
    </div>
  );
}

/**
 * What is ticked, and **which difference** it is ticked on (ticket 110).
 *
 * The second half is not decoration, and it matters more now that the bar floats: the
 * difference it belongs to can be scrolled off the screen entirely, and *2 geselecteerd*
 * pinned to the bottom of a queue of four thousand is a number with no subject. So it
 * repeats the words of its own difference, in one line, the way the row states them.
 */
const Selection = ({ repeat, count }) => (
  <p className="flex items-center gap-2 text-xs text-muted-foreground">
    {/* The count as a mark rather than as the first word of a sentence: the bar floats
        over the page now, and what it is *about* has to be readable before the sentence
        is. The sentence still carries the denominator — one page ticked of forty is a
        different press from forty of forty. */}
    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium tabular-nums text-primary-foreground">
      {count}
    </span>
    {/* An explicit space, so the count and the sentence are one string when read aloud —
        *2van 3 pagina's* is what adjacent boxes concatenate to. A whitespace-only run is
        not rendered as a flex item, so it costs nothing beside the gap. */}
    {' '}
    <span>
      <strong className="font-medium tabular-nums text-foreground">
        van {repeat.on.length} {repeat.on.length === 1 ? 'pagina' : "pagina's"}
      </strong>{' '}
      geselecteerd op <ClassWord class={repeat.class} />{' '}
      <span className="text-foreground">{repeat.prod ?? '—'} → {repeat.new ?? '—'}</span>
    </span>
  </p>
);

/**
 * What the presses differ in, in one line, where the editor chooses between them.
 *
 * The choice is not *how much* — it is which judgement is being made. A dismissal says
 * "these two exact strings are acceptable" and dies with the text; a mute says "this class
 * is never a defect in this section" and lives for ever. Offering one where the editor
 * wanted the other is the failure ticket 31 names as its own, so the difference is said —
 * and it is said in a sentence, because round two found an essay here and nobody reads an
 * essay above a button. What is left out is background rather than instruction: the
 * corpus statistics argued for the design and told an editor nothing.
 */
const Choice = ({ canDismiss }) => (
  <p className="text-xs text-muted-foreground">
    {canDismiss
      ? 'Negeren vervalt zodra een van de twee teksten verandert; dempen vervalt niet.'
      : 'Elke bevinding hier is al beslist, dus er is niets te negeren. Dempen vervalt niet.'}
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
 * What it does **not** say any more is what `Choice` above already said: that a dismissal
 * dies the day either text changes. Round two cut the repetition, not the fact.
 */
function Covers({ dismissal }) {
  // The total is the seam's own two numbers added, and never the repeat's size or a second
  // reading of the selection: the sentence has to count the same pages the events do
  // (ticket 110), and one arithmetic in one place is how it cannot drift.
  const pages = dismissal.covers + dismissal.decided;

  return (
    <p className="text-xs text-muted-foreground">
      <strong className="font-medium tabular-nums text-foreground">
        {dismissal.covers} {dismissal.covers === 1 ? 'pagina' : "pagina's"}
      </strong>
      {dismissal.decided > 0
        ? ` van de ${pages}: de andere ${dismissal.decided} ${dismissal.decided === 1 ? 'is' : 'zijn'} al beslist.`
        : '.'}
    </p>
  );
}

/**
 * The honest report of a press that did not write everything.
 *
 * N inserts can fail after the third, and the rows that were written are in the log: the
 * table is append-only, so there is nothing to roll back and nothing to pretend.
 * *12 van 30 opgeslagen* is the sentence.
 *
 * It is drawn on any shortfall and not only on a named page, because a press can also
 * write nothing at all and name nothing — with no editor, for one. Keying on the page
 * would have left that press silent, and a silent press is the failure the whole log is
 * built to prevent.
 *
 * It is deliberately **outside** the `canWrite` gate above. A failed write sets the log's
 * `error`, which turns `canWrite` false, so the forms unmount the moment this appears —
 * that is correct, since the remaining rows cannot be written to a log that just refused,
 * and this line is then the only thing left saying what happened. The banner at the top of
 * the dashboard says the log is read-only; this says how far the press got.
 */
function Report({ written, total, failedOn, error }) {
  if (written === total && !error) return null;

  return (
    <p className={cn('mb-2 text-xs', INK.attention)}>
      <strong className="font-medium">{written} van {total} opgeslagen.</strong>{' '}
      {failedOn
        ? <>Het stopte op <code>{failedOn}</code>, en de rest is niet geschreven. </>
        : 'Er is niets geschreven. '}
      {written > 0 && 'Wat wel is opgeslagen staat in het log en is hierboven te zien. '}
      {error}
    </p>
  );
}

/**
 * The bulk mute, which is a different judgement from the dismissal and not a bigger one.
 *
 * Three things make it its own form:
 *
 * - **It states two numbers, and it must.** `Covers` above states one, because for a
 *   dismissal the page is a term of the finding id and the two counts are one number.
 *   A mute is keyed on the class and the section, so it hides every finding of that class
 *   there — `covers` is genuinely larger than `difference`, and the gap is the thing an
 *   editor has to see before pressing (ADR 0008). Suppressing the second number here
 *   would hide the only fact that distinguishes this press from the other one.
 * - **It names the sections.** `sectionName()` is `mute.mjs`'s phrase, imported rather
 *   than restated, so the single mute on a page and this press describe one concept in
 *   one wording.
 * - **It is not a `<form>`.** A mute never expires, and Enter in a note field is how a
 *   permanent decision gets made by accident. The press is a press.
 *
 * When the mute is refused it draws the refusal and nothing else: `bulkMute()` decides
 * that, and its two sentences name the two different obstacles.
 */
function MuteForm({ mute, repeat, decided, note, setNote, busy, onCancel, onPress }) {
  if (!mute.offered) {
    return (
      <div className="flex flex-col gap-2">
        <p className={cn('text-xs', INK.attention)}>{mute.refusal}</p>
        <div>
          <Button type="button" variant="outline" size="xs" onClick={onCancel}>Terug</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Dempt <ClassWord class={repeat.class} /> {mute.sections.map(sectionName).join(', ')} op{' '}
        <strong className="font-medium tabular-nums text-foreground">
          {mute.pages} {mute.pages === 1 ? 'pagina' : "pagina's"}
        </strong>
        . Dat verbergt daar{' '}
        <strong className="font-medium tabular-nums text-foreground">
          {mute.covers} {mute.covers === 1 ? 'bevinding' : 'bevindingen'}
        </strong>
        {mute.covers > mute.difference
          ? `, waarvan ${mute.difference} van dit verschil. De rest is ander werk van dezelfde soort in dezelfde sectie.`
          : '.'}
      </p>

      <TwoEligibilities decided={decided} />

      <div className="flex flex-wrap items-center gap-1">
        <Input
          autoFocus
          value={note}
          onChange={(change) => setNote(change.target.value)}
          placeholder="Waarom hoort deze soort hier niet?"
          className="w-64"
        />
        {/* Ticket 88: the one decision that never expires is the one that has to be
            auditable, so the note is as mandatory here as on a dismissal. */}
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={mute.events.length === 0 || busy}
          onClick={onPress}
          title={mute.events.length === 0 ? 'Een beslissing heeft een reden nodig.' : undefined}
        >
          {busy ? 'Bezig…' : `Dempen op ${mute.pages} ${mute.pages === 1 ? 'pagina' : "pagina's"}`}
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={onCancel}>Annuleren</Button>
      </div>
    </div>
  );
}

/**
 * One selection, two presses, two eligibilities — said out loud where the two disagree
 * (ticket 110).
 *
 * A dismissal may not touch a finding a colleague decided, and it skips it. A mute's
 * coverage deliberately **includes** it, because `muteCoverage()` counts what a key covers
 * and not what it changes (ADR 0008). So the same ticked row is left alone by one press
 * and counted by the other, and the honest thing is to name the gap rather than close it:
 * the two are not measuring the same thing, and making them agree would make one of them
 * wrong.
 */
const TwoEligibilities = ({ decided }) => (
  decided > 0
    ? (
      <p className="text-xs text-muted-foreground">
        {decided} van deze pagina&rsquo;s is al beslist: negeren slaat die over, dempen
        telt die mee.
      </p>
    )
    : null
);

/**
 * Why this press is on fewer pages than are ticked, said where the gap is (ticket 110).
 *
 * The other two presses have a form to state their two numbers in; this one writes on the
 * first click and has only its own label. So the count it leaves alone lives in the
 * `title`, which is where round two put everything that explains a number already on
 * screen rather than changing what an editor presses.
 */
const clearTitle = ({ covers, skipped }) => (
  'Haalt de beslissing weg en zet het verschil terug op open.'
  + (skipped > 0
    ? ` ${skipped} van de ${covers + skipped} gekozen pagina's blijft zoals het is: daar is`
      + ' niets beslist, of het is een claim die met het vinkje Opgelost teruggaat.'
    : '')
);

/**
 * The class named inside a sentence, in words rather than as a pill. The pill is a
 * label on a row; here the class is the grammatical object of "dempt", and a coloured
 * chip mid-sentence reads as a second control.
 */
const ClassWord = ({ class: cls }) => <span className="font-medium text-foreground">{cls}</span>;

/** Why the buttons are absent, which is never nothing at all. */
const NotWriting = ({ reason }) => (
  <p className="text-xs text-muted-foreground">{reason ?? 'Beslissen kan hier nu niet.'}</p>
);
