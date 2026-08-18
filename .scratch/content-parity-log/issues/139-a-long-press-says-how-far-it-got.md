# 139 — A long press says how far it got, and it can be stopped

Type: task
Status: ready-for-agent
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

- [ ] A run in progress says how far it has got.
- [ ] A run in progress can be stopped, and stopping leaves the log consistent — no event half
      written, nothing retried behind the editor's back.
- [ ] A refused or aborted run reports *N of M saved* and names the page it stopped on, as it does
      today.
- [ ] The **unwritten remainder** stays ticked — the page it stopped on and every page after it —
      and the written ones lose their ticks. Pressing again **resumes**.
- [ ] A clearing over more than a handful of pages cannot be pressed without restating the count.
      The dismissal needs no such gate: its mandatory note is one.
- [ ] The existing narrow press keeps its behaviour and its words where nothing above changes them.
- [ ] `npm test`.

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
