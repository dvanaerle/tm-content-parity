# 139 — A long press says how far it got, and it can be stopped

Type: task
Status: resolved 2026-08-19 — built on branch `ticket-104-search-page-scope`. See the answer.
Blocked by: nothing.
Parent: ../map.md

A bulk press writes N events one at a time and stops at the first refusal. `overrides/bulk.mjs`
argues that design in its own header and it is right: `Promise.all` fires hundreds of inserts at a
log that may already be refusing, and `allSettled` returns a scatter of holes instead of a number an
editor can read.

What is missing is everything an editor needs **while** the loop runs. A difference on 329 pages is
already one press with no feedback and no way out, and the interface says nothing until it is over.
This is a gap today, independent of ticket 138 — which is why it is its own ticket, and why 138 is
blocked by it rather than containing it.

## What to build

An editor pressing a bulk dismissal or a bulk clearing over many pages can see how far it has got
and can stop it. A run that stops — refused or aborted — says how many were saved, which page it
stopped on, and leaves the unwritten pages ticked, so pressing again carries on from there rather
than starting over.

Nothing is rolled back. The table is append-only, so a half-finished run is a set of decisions that
were made, and the interface says so.

## Criteria

- [x] A run in progress says how far it has got.
- [x] A run in progress can be stopped, and stopping leaves the log consistent — no event half
      written, nothing retried behind the editor's back.
- [x] A refused or aborted run reports *N of M saved* and names the page it stopped on, as it does
      today.
- [x] The **unwritten remainder** stays ticked — the page it stopped on and every page after it —
      and the written ones lose their ticks. Pressing again **resumes**.
- [x] A clearing over more than a handful of pages cannot be pressed without restating the count.
      The dismissal needs no such gate: its mandatory note is one.
- [x] The existing narrow press keeps its behaviour and its words where nothing above changes them.
- [x] `npm test`.

## Traps

- **Do not batch the inserts.** The sequential loop is the design and its reason is written down
  where it lives. A batch trades the one honest sentence for the scatter it was built to avoid.
- **Do not roll anything back.** Append-only is the whole reason *N of M saved* is a truthful
  sentence rather than an apology.
- **Do not announce progress in the amber strip or a second live region.** It is a reading of the
  press, and it belongs to the bar the press was made from.
- **This moves no count, no bar and no denominator.**

## Where it came from

Split out of ticket 138 (a grilling session, 2026-08-18) once it was clear the loop's silence is a
gap the wide selection makes acute rather than one it creates. Higher number than the ticket it
blocks, which this tracker has done before.

## Answer

Built 2026-08-19. The loop is unchanged in shape — one insert at a time, stop at the first
refusal, nothing rolled back — and it gained the two things an editor needs while it runs.

### The seam says how far it got and reads a signal

`appendEach(port, events, { onProgress, signal })`. It reports after **every row the log
accepted** and reads the signal **before every event it has not begun**, which is the whole
of what "no event half written" means: the insert in flight finishes, so a stopped run
leaves whole rows behind it and nothing is retried. That is one `if` and one call in a loop
that was already sequential — the design the file's own header argues for is what made this
cheap, and batching would have had neither a number to report nor a place to stop.

`failedOn` is now **`stoppedOn`**, beside a new `aborted`. One field for *the page it did not
write*, and a flag telling a refusal from a stop; two fields for one page would have been the
doubling. Only a refusal carries an `error`, so `useStoreOverrides` no longer sets the log's
error on a stop — an editor who asked it to stop has not broken the log, and the remainder
must stay pressable.

### The reading belongs to the bar

`BulkControl` holds the run: an `AbortController` in a ref, so *Stop* reaches a loop that is
already going without waiting for a render, and `{ written, total }` in state. Progress and
the report share **one** `role="status"` region, because they are two readings of the same
press — a live region apiece would announce it twice. It is not in the amber strip: that
strip enumerates what narrows the list, and a press narrows nothing.

### The remainder stays ticked, so pressing again resumes

The press hands the written findings back to the selection (`onWritten`) and their ticks come
off. What is left ticked after a stop is exactly what is left to write, so the same press
over the same selection is the rest of the run. Nothing goes back on: the table is
append-only, so unticking a written page is a fact and not an optimistic update. It applies
to a completed press too, which is the one thing the narrow press does differently than
before — a selection whose whole point is spent is not a selection any more.

The dismissal's form stays open on a stop, note and all, so *carry on* is one click.

### The clearing restates its count; the dismissal does not

Past five pages the clearing asks for its count to be typed back. The two presses are not
symmetrical and this is where it shows: a dismissal already costs a form and a mandatory
reason, and an editor writing a sentence about why 300 pages are not a defect has restated
the press by writing it. A clearing carries no reason and throws decisions away, so it went
from one click to 300 revocations with nothing in between.

The gate is the **number** and not an *Are you sure?*: a yes/no is a reflex to click through,
and the count is the one thing about a wide press an editor can check against the bar above
it. Five is *what an editor can see the whole of*, and under it the press is the one click it
has always been — the existing narrow presses are untouched.

### What the review changed

Three things, all of them the seam or the wording rather than the design.

**One `Report`, not two.** `BulkControl` and `AnnotateBar` each carried a copy of *N of M
saved*, and this ticket was editing both — the copies had already begun to drift, since only
one of them grew the stop's sentence. It is `PressReport.jsx` now, drawn by both, and the
result shape it takes is a `@typedef PressReport` beside the loop that returns it rather than
an inline object spelled out in four places.

**The count that moves is not announced.** The progress line sits in the bar's one live
region, so it is read when the press starts and when it ends — but a 329-page run would
otherwise queue 329 announcements of a number nobody asked to hear again, with *Stop* buried
under them. `aria-live="off"` on the digit, and only on the digit.

**The clearing's gate is spent by the press it gated.** A stopped run leaves a smaller
remainder, so the count typed is no longer the count on screen, and below a handful there is
nothing left to restate. The gate closes on any press and the button asks again only if the
remainder still needs it.

The resume sentence stays gated on a **stop**. A refusal also leaves the remainder ticked,
but it leaves a log that has just said it will not take it, and promising a press that would
fail is worse than saying nothing.

### Where it is tested

`overrides/bulk.test.mjs` covers the seam against a fake port: progress, a stop between
events, a stop before the first. `Repeats.browser.test.mjs` walks the bar with a log that
answers **one insert at a time**, so a press can be paused mid-run and watched — the bag
there runs the real `appendEach()` rather than inventing a result, which is the only way the
"still going" questions can be asked at all.
