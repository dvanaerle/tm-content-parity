import { pressMessage } from '../lib/announce.mjs';

/**
 * The honest report of a press — one sentence, one place, whichever way it went.
 *
 * N inserts can fail after the third, and the rows that were written are in the log: the
 * table is append-only, so there is nothing to roll back and nothing to pretend.
 * *12 of 30 saved* is the sentence, and it is the same sentence for every bulk press —
 * ticket 31's two, ticket 83's annotation, and whatever the next bar presses. It lived in
 * both bars in two copies until ticket 139, and the copies had already begun to drift.
 *
 * It is drawn on any shortfall and not only on a named page, because a press can also
 * write nothing at all and name nothing — with no editor, for one. Keying on the page
 * would have left that press silent, and a silent press is the failure the whole log is
 * built to prevent.
 *
 * It is deliberately **outside** the `canWrite` gate its callers draw their forms under. A
 * failed write sets the log's `error`, which turns `canWrite` false, so the forms unmount
 * the moment this appears — that is correct, since the remaining rows cannot be written to
 * a log that just refused, and this line is then the only thing left saying what happened.
 * The banner at the top of the dashboard says the log is read-only; this says how far the
 * press got.
 *
 * **A press that fully succeeded says so** (ADR 0019), and it says it here rather than in a
 * toast — the pass refuses a toast primitive, and this is already the place a press reports
 * itself. It is one quiet line and not the amber the shortfall wears: nothing is wrong, and
 * the shortfall has to stay the louder of the two.
 *
 * The success is worth a sentence only because a bulk press covers pages an editor cannot
 * all see. For a single row the state flipping is the feedback, which is why no per-row
 * control draws this. Silence after deciding forty pages is the case where it is genuinely
 * ambiguous.
 *
 * @param {import('../../../overrides/bulk.mjs').PressReport} report
 */
export default function PressReport({ written, total, stoppedOn, aborted = false, error }) {
  // Nothing pressed is not a success. A bar mounts with no report at all and its caller
  // draws none, so a zero here is a press that covered nothing — and claiming *0 pages
  // saved* would be the interface reporting an event that did not happen.
  if (written === total && !error)
    return total === 0 ? null : <Saved said={pressMessage({ written, total })} />;

  return (
    <p data-wears="ink" data-tone="caution" className="mb-2 text-xs">
      <strong className="font-medium">
        {written} of {total} saved.
      </strong>{' '}
      {stoppedOn ? (
        <>
          It stopped on <code>{stoppedOn}</code>, and the rest is not written.{' '}
        </>
      ) : (
        'Nothing is written. '
      )}
      {written > 0 && 'What was saved is in the log and it is visible above. '}
      {/* Said only where there is a run to carry on with. A stop leaves a log that will
          still take the remainder; a refusal leaves one that has just said it will not, and
          promising a press that would fail is worse than saying nothing. */}
      {aborted && 'The rest is still selected, so pressing again carries on from there. '}
      {error}
    </p>
  );
}

/**
 * The whole press, saved — **in the words the live region already speaks**.
 *
 * `pressMessage()` has said *Saved on 12 pages* to a screen reader since ticket 03, back when
 * the screen said nothing at all; drawing the sentence here from anywhere else would be two
 * copies of one outcome, free to disagree about the unit or the plural. So it is one string,
 * heard and seen, and `announce.mjs` owns the wording the way it owns the rest of a press's.
 *
 * That costs the bold count the shortfall line wears, and it is the right way round: the
 * shortfall has to stay the louder of the two, and a success is one quiet line.
 */
const Saved = ({ said }) => <p className="mb-2 text-xs text-muted-foreground">{said}</p>;
