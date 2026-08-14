import { useEffect, useState } from 'react';
import { PriorityPill } from './Chips.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { noteEventFor, priorityEventFor } from '../../../overrides/state.mjs';
import { PRIORITIES } from '../../../shared/priorities.mjs';
import { bulkAnnotation } from '../lib/bulk.mjs';
import { INK } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';

/**
 * The two annotations a page carries, and the controls that set them (ticket 83).
 *
 * **Two and no more.** A priority from a closed list and a free-text note. The proposal
 * asked for user-defined columns — add, rename, reorder, hide, remove, edit the select
 * options — and that is a schema editor, refused: a rename and a reorder are mutations, and
 * the overrides table has insert and select policies only. There is no **owner** field
 * either, because a name typeable by anyone cannot carry the accountability an owner column
 * promises.
 *
 * The temptation this file has to keep refusing is the **third column**. The moment two
 * annotations exist a third looks free, and it is not: a third is the schema editor above,
 * and it needs a new decision rather than a new `<Input>` here.
 *
 * Both controls are drawn only when the log can be written to, and the value is always
 * drawn — an annotation a colleague set is readable by an editor who has not given their
 * name.
 */

/**
 * The priority picker: the three words, and the one press that takes the value back.
 *
 * It is a row of toggles rather than a `<select>` because there are three options and the
 * value is one press away in either direction. A select would put the clearing behind an
 * empty option, which reads as a fourth priority named nothing.
 *
 * @param {object} props
 * @param {string | null} props.value
 * @param {(priority: string | null) => void} props.onPick
 * @param {boolean} [props.busy]
 */
export function PriorityPicker({ value, onPick, busy = false }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {PRIORITIES.map((priority) => (
        <Button
          key={priority}
          type="button"
          variant="outline"
          size="xs"
          disabled={busy}
          aria-pressed={value === priority}
          onClick={() => onPick(value === priority ? null : priority)}
          className={cn('px-1.5', value === priority && 'ring-2 ring-primary')}
          title={
            value === priority
              ? `Take the ${priority} priority off this page.`
              : `Set the priority of this page to ${priority}.`
          }
        >
          <PriorityPill priority={priority} />
        </Button>
      ))}
    </div>
  );
}

/**
 * The page's own annotation strip: the priority, the note, and what they are now.
 *
 * The note is a form and not a live-saving field. Every keystroke would be a row in an
 * append-only table, and the sentence an editor is halfway through typing is not a sentence
 * they have written yet.
 *
 * @param {object} props
 * @param {{ priority: string | null, note: string | null }} props.annotations
 * @param {(event: object) => Promise<boolean>} props.append
 * @param {boolean} props.canWrite
 * @param {boolean} [props.busy]
 */
export function PageAnnotations({ annotations, append, canWrite, busy = false }) {
  const { priority, note } = annotations;
  const [typed, setTyped] = useState(note ?? '');

  // The log answers a beat after the first paint, and a note a colleague wrote has to
  // arrive in the box. It re-syncs on the **stored** note only, so an editor's half-typed
  // sentence is not overwritten by a re-read that returned the same value.
  useEffect(() => setTyped(note ?? ''), [note]);

  if (!canWrite) {
    // Read-only, and never blank: an annotation a colleague set is worth reading by
    // somebody who cannot write one.
    if (!priority && !note) return null;
    return (
      <div className="flex flex-wrap items-baseline gap-2 text-xs">
        <PriorityPill priority={priority} />
        {note && <PageNote note={note} />}
      </div>
    );
  }

  const changed = typed.trim() !== (note ?? '');

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
      <span className="text-muted-foreground">Priority</span>
      <PriorityPicker
        value={priority}
        busy={busy}
        onPick={(next) => append(priorityEventFor(next))}
      />

      <form
        className="flex flex-wrap items-center gap-1"
        onSubmit={(submit) => {
          submit.preventDefault();
          append(noteEventFor(typed));
        }}
      >
        <Input
          value={typed}
          onChange={(change) => setTyped(change.target.value)}
          // Not *why*: a page note explains nothing in particular, and a placeholder
          // asking for a reason would make it read as the note a dismissal carries.
          placeholder="A note about this page"
          className="w-56"
          aria-label="A note about this page"
        />
        {changed && (
          <Button type="submit" variant="outline" size="xs" disabled={busy}>
            {busy ? 'Saving…' : typed.trim() ? 'Save note' : 'Clear note'}
          </Button>
        )}
      </form>
    </div>
  );
}

/**
 * One press, N annotated pages (ticket 83).
 *
 * It reuses ticket 31's shape rather than inventing a second one: the floating bar, the
 * sequential write through `appendEach()`, and the *N of M saved* report of a partial
 * failure. It is a **second bar and not a second selection mechanism** — the selection is
 * held by the list above it, the way `Repeats.jsx` holds the one for a difference.
 *
 * What it does not carry is an eligibility count. The two presses of ticket 31 skip a
 * finding a colleague decided and have to say how many they left alone; a page an editor
 * ticked simply takes the annotation.
 *
 * @param {object} props
 * @param {{ store: string, page: string }[]} props.pages  The list under the selection.
 * @param {Set<string>} props.selected  Ticked pages, as `store/page`.
 * @param {{ canWrite: boolean, busy: boolean, appendMany: Function, notWritingReason: string | null }} props.bulk
 * @param {() => void} props.onClear
 */
export function AnnotateBar({ pages, selected, bulk, onClear }) {
  const [typed, setTyped] = useState('');
  /** The last press's report, held so a partial failure stays on screen to be read. */
  const [report, setReport] = useState(
    /** @type {null | { written: number, total: number, failedOn: string | null, error: string | null }} */
    (null),
  );

  const press = async (event) => {
    const { events } = bulkAnnotation({ pages, selected, event });
    if (events.length === 0) return;
    const result = await bulk.appendMany(events);
    setReport(result);
    if (result.written === result.total && !result.error) setTyped('');
  };

  const count = selected.size;
  const noun = count === 1 ? 'page' : 'pages';

  return (
    <div
      data-slot="annotate-bar"
      className={cn(
        'fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-[min(64rem,calc(100vw-2rem))]',
        'flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2 shadow-lg',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground tabular-nums">
            {count}
          </span>{' '}
          <span>
            <strong className="font-medium text-foreground">{noun}</strong> selected
          </span>
        </p>

        {bulk.canWrite ? (
          <>
            {/* No value is shown as *current*, because N pages can hold N different
                priorities and a picker claiming one of them would be lying about the rest.
                Every press here sets, and the last button clears. */}
            <PriorityPicker
              value={null}
              busy={bulk.busy}
              onPick={(next) => press(priorityEventFor(next))}
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={bulk.busy}
              onClick={() => press(priorityEventFor(null))}
              title={`Take the priority off ${count} ${noun}.`}
            >
              No priority
            </Button>

            <form
              className="flex flex-wrap items-center gap-1"
              onSubmit={(submit) => {
                submit.preventDefault();
                press(noteEventFor(typed));
              }}
            >
              <Input
                value={typed}
                onChange={(change) => setTyped(change.target.value)}
                placeholder={`A note on ${count} ${noun}`}
                className="w-56"
                aria-label={`A note on ${count} ${noun}`}
              />
              <Button type="submit" variant="outline" size="xs" disabled={bulk.busy}>
                {bulk.busy ? 'Saving…' : typed.trim() ? 'Save note' : 'Clear note'}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-muted-foreground">
            {bulk.notWritingReason ?? 'A page cannot be annotated here now.'}
          </p>
        )}

        <span aria-hidden className="ml-auto h-4 w-px bg-border" />
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClear}
          aria-label="Clear the selection"
          title="Clear the selection"
        >
          <span aria-hidden>✕</span>
        </Button>
      </div>

      {report && <Report {...report} />}
    </div>
  );
}

/**
 * The honest report of a press that did not write everything — ticket 31's sentence, over
 * ticket 83's press.
 *
 * N inserts can fail after the third, and the rows that were written are in the log: the
 * table is append-only, so there is nothing to roll back and nothing to pretend.
 *
 * It is drawn on any shortfall and not only on a named page, because a press can write
 * nothing at all and name nothing — with no editor, for one.
 */
function Report({ written, total, failedOn, error }) {
  if (written === total && !error) return null;

  return (
    <p className={cn('mb-2 text-xs', INK.attention)}>
      <strong className="font-medium">
        {written} of {total} saved.
      </strong>{' '}
      {failedOn ? (
        <>
          It stopped on <code>{failedOn}</code>, and the rest is not written.{' '}
        </>
      ) : (
        'Nothing is written. '
      )}
      {written > 0 && 'What was saved is in the log and it is visible above. '}
      {error}
    </p>
  );
}

/**
 * The page note as it is read, and **never** the way a dismissal's note is read.
 *
 * That is the ticket's first trap. A dismissal note is mandatory and explains one judgement
 * about two strings; the interface renders it inside the decision, beside the finding it
 * justifies. A page note explains nothing in particular, so it is drawn as what an editor
 * wrote about the page — quoted, plain, and never labelled as a reason.
 */
export function PageNote({ note, className = '' }) {
  if (!note) return null;
  return (
    <span className={cn('text-muted-foreground italic', className)} title="A note on this page">
      “{note}”
    </span>
  );
}
