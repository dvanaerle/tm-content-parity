import { useMemo, useState } from 'react';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { INK } from '../lib/palette.mjs';
import { bulkDismissal, bulkMute } from '../lib/bulk.mjs';
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
 * So it is drawn only when something is ticked, and it is drawn **below** the difference
 * rather than inside its opened panel: the tick on the difference row selects pages an
 * editor has not necessarily seen, and a press that lived in the panel would then be armed
 * and out of sight.
 *
 * Every sentence here exists because the press is easy to misread:
 *
 * - **It says how big it is before it is pressed**, in findings and in pages.
 * - **It says the decision expires with the text**, because each of the N dismissals is
 *   keyed on a finding id. A page that appears in a later crawl is not covered by any of
 *   them, and tickets 54 and 55 take the corpus from 451 to about 800 store-pages.
 * - **It says the real size of a repeat.** Ticket 81 measured the corpus: the largest
 *   repeat in the largest store is on 22 pages, and 79 to 91 per cent of every store's
 *   repeats are on one page. This control is not the thirty-page tool its ticket opened
 *   by describing, and it must not imply that it is.
 */
export default function BulkControl({ repeat, byFinding, bulk, selected, onClear, searched }) {
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
    <div data-slot="bulk-bar" className="border-t border-border px-4 py-2">
      <Selection repeat={repeat} count={selected.size} onClear={onClear} searched={searched} />

      {report && <Report {...report} />}

      {!bulk?.canWrite && <NotWriting reason={bulk?.notWritingReason} />}

      {/* Two buttons and never one. A dismissal expires with the text and a mute does
          not, and an editor choosing between them is choosing between those two
          behaviours — a single *afhandelen* control would make that choice for them.

          They are also offered **independently**. A repeat whose every finding is already
          decided has nothing left to dismiss, and a mute is still a live judgement there:
          it is about the class in the section rather than about these two strings, and it
          is the one that does not expire. Gating both on the dismissal's eligibility took
          the mute off screen exactly where it is the only tool left. */}
      {bulk?.canWrite && asking === null && (
        <>
          <div className="flex flex-wrap items-center gap-1">
            {dismissal.covers > 0 && (
              <Button variant="outline" size="xs" onClick={() => setAsking('dismiss')}>
                Negeren op {dismissal.covers === 1 ? 'deze pagina' : `${dismissal.covers} pagina's`}…
              </Button>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setAsking('mute')}
              title={mute.offered
                ? 'Dempt de soort in deze sectie op elke pagina. Vervalt niet.'
                : 'Kan hier niet in bulk.'}
            >
              Dempen op {mute.pages === 1 ? 'deze pagina' : `${mute.pages} pagina's`}…
            </Button>
          </div>
          {dismissal.covers === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Elke bevinding van dit verschil is al beslist, dus er is niets te negeren.
              Een beslissing terugdraaien gaat per pagina, op de pagina zelf.
            </p>
          )}
          <Choice canDismiss={dismissal.covers > 0} />
        </>
      )}

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
 * The second half is not decoration. A tick on the difference row selects pages an editor
 * has not necessarily seen, several differences can carry ticks at once, and a bar that
 * said only *2 geselecteerd* would be a number with no subject. So it repeats the words of
 * its own difference, in one line, the way the row above it states them.
 */
const Selection = ({ repeat, count, onClear, searched }) => (
  <>
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>
        <strong className="font-medium tabular-nums text-foreground">
          {count} van {repeat.on.length} {repeat.on.length === 1 ? 'pagina' : "pagina's"}
        </strong>{' '}
        geselecteerd op <ClassWord class={repeat.class} />{' '}
        <span className="text-foreground">{repeat.prod ?? '—'} → {repeat.new ?? '—'}</span>
      </span>
      {/* Unticking ten rows one at a time is the work this control exists to remove, so
          putting it down costs one press as well. */}
      <Button type="button" variant="outline" size="xs" onClick={onClear}>Selectie wissen</Button>
    </p>

    {/* Said here and not only under the page list, because the tick on the difference row
        works on a **closed** row: an editor can arm a press on ten matching pages having
        seen no page list at all, and a caption under a table nobody opened is silence. */}
    {searched && (
      <p className="text-xs text-muted-foreground">
        Dit zijn de pagina&rsquo;s waarop de zoekterm is gevonden. Dit verschil kan op meer
        pagina&rsquo;s staan; die staan hier niet en worden niet mee beslist.
      </p>
    )}
  </>
);

/**
 * What the two buttons differ in, said where the editor chooses between them.
 *
 * The choice is not *how much* — it is which judgement is being made. A dismissal says
 * "these two exact strings are acceptable" and dies with the text; a mute says "this
 * class is never a defect in this section" and lives for ever. Offering one where the
 * editor wanted the other is the failure ticket 31 names as its own.
 *
 * The measured size of a repeat is here too, and not only in the form. Ticket 31 opens by
 * describing a difference on thirty pages; ticket 81 measured the corpus and the largest
 * repeat in the largest store is on 22 pages, with 79 to 91 per cent of every store's
 * repeats on a single page. A control that let an editor believe otherwise would be
 * selling a tool that mostly idles.
 */
const Choice = ({ canDismiss }) => (
  <p className="mt-1 text-xs text-muted-foreground">
    {canDismiss && (
      <>
        <strong className="font-medium">Negeren</strong> geldt voor deze twee teksten en
        vervalt zodra een van de twee verandert.{' '}
      </>
    )}
    <strong className="font-medium">Dempen</strong> geldt voor de soort in die sectie en
    vervalt nooit. {canDismiss ? 'Geen van beide dekt een' : 'Het dekt geen'} pagina die
    bij een volgende crawl bijkomt. Ter maat: het grootste verschil in de grootste winkel
    staat op 22 pagina&rsquo;s, en 79 tot 91 procent van de verschillen per winkel staat
    op één pagina.
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
 * The second half is the half that is easy to leave out, and it is why this ticket exists
 * twice: a dismissal is keyed on the finding id, so it dies the day either text changes,
 * and it says nothing about a page the next crawl finds.
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
        ? ` van de ${pages} — de andere ${dismissal.decided} zijn al beslist en blijven zoals ze zijn. `
        : '. '}
      Alleen deze: verandert een van de twee teksten, dan vervalt die beslissing en komt
      het verschil terug. Een pagina die bij een volgende crawl bijkomt valt er niet onder.
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
          ? `, waarvan ${mute.difference} van dit verschil — de rest is ander werk van dezelfde soort in dezelfde sectie. `
          : '. '}
        Dempen vervalt niet en verlaagt de noemer: gedempt werk is uit de balk, niet
        afgehandeld.
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
        {decided} van deze pagina&rsquo;s {decided === 1 ? 'draagt' : 'dragen'} een
        bevinding die al beslist is. Negeren slaat die over; hier telt dempen die mee, want
        het dempt de soort in die sectie en niet deze twee teksten.
      </p>
    )
    : null
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
