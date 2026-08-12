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
 * It lives in the **opened** repeat and never in its header row, for two reasons. The
 * header is entirely a `CollapsibleTrigger`, so a button inside it would be swallowed by
 * the toggle. And the pages this decision covers are listed directly above it — an editor
 * reads the list, then decides about it, which is the order the decision is made in.
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
export default function BulkControl({ repeat, byFinding, bulk }) {
  /** @type {['dismiss' | 'mute' | null, Function]} */
  const [asking, setAsking] = useState(null);
  const [note, setNote] = useState('');
  /** The last press's report. Held so a partial failure stays on screen to be read. */
  const [report, setReport] = useState(/** @type {null | { written: number, total: number, failedOn: string | null }} */ (null));

  const dismissal = useMemo(
    () => bulkDismissal({ repeat, byFinding, note }),
    [repeat, byFinding, note],
  );

  const mute = useMemo(
    () => bulkMute({ repeat, byFinding, findingsByPage: bulk?.findingsByPage ?? new Map(), note }),
    [repeat, byFinding, bulk?.findingsByPage, note],
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
    <div className="border-t border-border px-4 py-2">
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
          <Covers dismissal={dismissal} pages={repeat.on.length} />
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
            <Button variant="outline" size="xs" onClick={close}>Annuleren</Button>
          </div>
        </form>
      )}

      {bulk?.canWrite && asking === 'mute' && (
        <MuteForm
          mute={mute}
          repeat={repeat}
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
function Covers({ dismissal, pages }) {
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

/** Why the buttons are absent, which is never nothing at all. */
const NotWriting = ({ reason }) => (
  <p className="text-xs text-muted-foreground">{reason ?? 'Beslissen kan hier nu niet.'}</p>
);
