import { useEffect, useId, useState } from 'react';
import { PriorityPill } from './Chips.jsx';
import { Dismiss, Floating } from './Floating.jsx';
import PressReport from './PressReport.jsx';
import { OfPages, Selected } from './Selected.jsx';
import { Hint, TextHint } from './Hint.jsx';
import { Button } from './ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.jsx';
import { Input } from './ui/input.jsx';
import { noteEventFor, priorityEventFor } from '../../../overrides/state.mjs';
import { PRIORITIES } from '../../../shared/priorities.mjs';
import { bulkAnnotation } from '../lib/bulk.mjs';
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
        // The pill is the whole of what the press says, so the hint is the press explained
        // and it is announced. `busy` is a moment and not a state, so the hint stays on the
        // button through it (`Hint.jsx` says which controls take a wrapper instead).
        <Hint
          key={priority}
          text={
            value === priority
              ? `Take the ${priority} priority off this page.`
              : `Set the priority of this page to ${priority}.`
          }
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            aria-pressed={value === priority}
            onClick={() => onPick(value === priority ? null : priority)}
            className={cn('px-1.5', value === priority && 'ring-2 ring-primary')}
          >
            <PriorityPill priority={priority} />
          </Button>
        </Hint>
      ))}
    </div>
  );
}

/**
 * Everything about this page an editor can change, in one dialog behind one menu item.
 *
 * The priority picker and the note input were drawn open in the page header on every page,
 * whether or not anybody intended to annotate it — so the interface spent its most prominent
 * row on a form that was usually not being filled in, competing with the page key. They are
 * **relocated and not redesigned**: the same three toggles and the same one field.
 *
 * **A dialog and not a popover, and the reason is a lost note.** A popover dismisses on an
 * outside click, and an editor halfway through typing a note about a page is exactly the
 * person who clicks away to check something. `disablePointerDismissal` is what makes that
 * true and a browser assertion holds it.
 *
 * The review is **read** on the header's quiet line and **acted on** here, beside the
 * annotations it sits with — *Clear the review* wherever there is one, *Mark again* only
 * where it has gone stale. *Mark page reviewed* is the exception and stays in the menu: it
 * is one press with no form, and a dialog around one button is ceremony.
 *
 * Nothing here announces its own outcome. Every write goes through `append()`, which is the
 * one seam every decision passes through and the one place the live region is spoken to.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ priority: string | null, note: string | null }} props.annotations
 * @param {string} props.findingSetHash
 * @param {(event: object) => Promise<boolean>} props.append
 * @param {import('../lib/page-header.mjs').HeaderActions} props.actions
 *   `headerReading().actions`.
 * @param {import('react').RefObject<HTMLElement | null>} [props.finalFocus]
 *   The control an editor opened this from. Focus is **aimed** and not restored, because the
 *   menu item they pressed has unmounted by the time this closes and the default would leave
 *   them on the body, at the top of a page they were partway down.
 * @param {boolean} [props.busy]
 */
export function PageDetailsDialog({
  open,
  onOpenChange,
  annotations,
  findingSetHash,
  append,
  actions,
  finalFocus,
  busy = false,
}) {
  const { priority, note } = annotations;
  const [typed, setTyped] = useState(note ?? '');
  const noteId = useId();

  // The log answers a beat after the first paint, and a note a colleague wrote has to
  // arrive in the box. It re-syncs on the **stored** note only, so an editor's half-typed
  // sentence is not overwritten by a re-read that returned the same value.
  useEffect(() => setTyped(note ?? ''), [note]);

  const { annotate } = actions;
  const refused = annotate.state === 'refused';
  const changed = typed.trim() !== (note ?? '');

  /**
   * A write that closes on success and **stays open on failure**, so the outcome of a
   * submission is never ambiguous — a dialog that closed either way would report a dropped
   * write as a saved one.
   */
  const writeAndClose = async (event) => {
    if (await append(event)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>Page details</DialogTitle>
          {/* Said before anything is typed, and not after a press that went nowhere. An
              editor who cannot save must not write a note into nothing first. */}
          <DialogDescription>
            {refused ? annotate.reason : 'A priority and a note, for this page.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground">Priority</span>
            {/* Pressing the set one takes it off, so a wrong priority is cleared as easily
                as it was set. That is the picker's own rule and it did not change.

                It **appends and does not close**, unlike the note below. A priority is a
                toggle and not a submission: an editor setting one and then writing a note
                would be thrown out of the dialog between the two, and clearing a wrong
                priority would mean reopening to press the same button again. */}
            <PriorityPicker
              value={priority}
              busy={busy || refused}
              onPick={(next) => append(priorityEventFor(next))}
            />
          </div>

          <form
            className="flex flex-col gap-1.5"
            onSubmit={(submit) => {
              submit.preventDefault();
              writeAndClose(noteEventFor(typed));
            }}
          >
            {/* A visible label and **no `aria-label` beside it**: an `aria-label` overrides
                the label element, so the word on screen would be the one word never read
                out. The id is the hook's, because a page may draw this twice. */}
            <label className="text-muted-foreground" htmlFor={noteId}>
              Note
            </label>
            <Input
              id={noteId}
              value={typed}
              onChange={(change) => setTyped(change.target.value)}
              disabled={refused}
              // Not *why*: a page note explains nothing in particular, and a placeholder
              // asking for a reason would make it read as the note a dismissal carries.
              placeholder="A note about this page"
            />
            {changed && !refused && (
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={busy}
              >
                {busy ? 'Saving…' : typed.trim() ? 'Save note' : 'Clear note'}
              </Button>
            )}
            {/* The **stored** note, in full, beside the box that changes it. A note has no
                length limit — `PageNoteMark` says why the dashboard draws a mark instead —
                and this is the surface that draws it whole, as the old header did. It is
                the stored value and not `typed`, which is already on screen above and
                would say the sentence twice while telling a reader nothing about the log. */}
            <PageNote note={note} />
          </form>
        </div>

        {/* Present whenever there is a review to act on, and **refused rather than absent**
            where the log will not take the write: the two are different answers, and a
            control that vanished on a read-only log would read as a feature this page does
            not have. The reason is already above, in the description. */}
        {actions.clearReview.state !== 'absent' && (
          <DialogFooter className="justify-start">
            <Button
              variant="outline"
              size="sm"
              disabled={refused}
              onClick={() => writeAndClose({ scope: 'page', action: 'cleared' })}
            >
              Clear the review
            </Button>
            {actions.markAgain.state !== 'absent' && (
              <Button
                variant="outline"
                size="sm"
                disabled={refused}
                onClick={() => writeAndClose({ scope: 'page', action: 'reviewed', findingSetHash })}
              >
                Mark again
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One press, N annotated pages (ticket 83).
 *
 * It reuses ticket 31's shape rather than inventing a second one: the floating bar, the
 * sequential write through `appendEach()`, and the *N of M saved* report of a partial
 * failure. Since ticket 128 the reuse is literal: `Floating.jsx` draws the panel and the
 * dismissal for both bars, and says why. It is a **second bar and not a second selection mechanism** — the selection is
 * held by the list above it, the way `Repeats.jsx` holds the one over its own list.
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
    /** @type {null | import('../../../overrides/bulk.mjs').PressReport} */ (null),
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
    <Floating slot="annotate-bar">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {/* The same shape ticket 31's bar states its selection in, and off the same
            component (ADR 0019). It read *2 pages selected*, which names an object and no
            scope: the bar floats over a page list that can be four thousand rows long and
            can be filtered down to eleven, and two of eleven is a different press from two
            of four thousand. The denominator is the list the ticks were made in, which is
            what `pages` is. */}
        <Selected count={count}>
          <span>
            <OfPages pages={pages.length} /> selected in this list.
          </span>
        </Selected>

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
            <Hint text={`Take the priority off ${count} ${noun}.`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulk.busy}
                onClick={() => press(priorityEventFor(null))}
              >
                No priority
              </Button>
            </Hint>

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
              <Button type="submit" variant="outline" size="sm" disabled={bulk.busy}>
                {bulk.busy ? 'Saving…' : typed.trim() ? 'Save note' : 'Clear note'}
              </Button>
            </form>
          </>
        ) : (
          <p className="text-muted-foreground">
            {bulk.notWritingReason ?? 'A page cannot be annotated here now.'}
          </p>
        )}

        <Dismiss onClear={onClear} />
      </div>

      {report && <PressReport {...report} />}
    </Floating>
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
    <TextHint text="A note on this page">
      <span className={cn('text-muted-foreground italic', className)}>“{note}”</span>
    </TextHint>
  );
}

/**
 * The same note in a **list**: a mark saying there is one, and never the note itself.
 *
 * A page note has no length limit, and a table cell has no width to spare. One 400-character
 * note stretched a row past the width of the screen and carried every count in that row off
 * the side with it — the defect ticket 04 found, in a cell that does not wrap.
 *
 * So the list draws the mark and the **page draws the note**, in full, where an editor also
 * changes it — which since ui-polish 10 is the page's details dialog rather than its header,
 * and is still one press from the page this links to. That is why the mark is a link and not a
 * glyph: *reachable* has to mean somewhere a reader can go, and the note's own page is the
 * place it already lives.
 *
 * **The note is in the accessible name and not only in the hint.** ADR 0019 refuses hover that
 * reveals something a reader needs, so the text cannot be a tooltip's alone: a keyboard or
 * touch reader would be left with a row of identical marks reading *Note*. The name carries
 * the page as well, because a list of these is a list of links and *Note* twelve times over
 * tells a screen reader nothing about which page it is on. The hint is then the same note made
 * visible without leaving the list, and it is not announced a second time (ticket 129).
 *
 * @param {object} props
 * @param {string | null | undefined} props.note
 * @param {string} props.page  The page key, for the name a reader hears.
 * @param {string} props.href  The page the note is about.
 * @param {string} [props.className]
 */
export function PageNoteMark({ note, page, href, className = '' }) {
  if (!note) return null;
  return (
    <Hint text={note} announce={false}>
      <a
        href={href}
        aria-label={`A note on ${page}: ${note}`}
        className={cn('text-xs text-muted-foreground italic hover:underline', className)}
      >
        Note
      </a>
    </Hint>
  );
}
