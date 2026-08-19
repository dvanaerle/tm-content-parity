# 10 — Page details move into a dialog, and the header goes quiet

**What to build:** the annotations leave the header and the header becomes one line.

Today the priority picker, the note input and the review control are rendered open on every page,
whether or not anybody intends to annotate it — so the header spends its most prominent row on a
form that is usually not being filled in, competing with the page key an editor needs to know where
they are.

After this ticket an editor opens *Edit page details* from the menu, sets a priority, writes a note
and acts on the review in one dialog, and closes it. What is left in the header is a quiet line that
**reads** those three facts, the progress bar, and *Re-check*. Nothing is deleted: every control is
one press away and the line says which of them have something to say.

This is the slice that finishes PRD story 27, which could not be built before because the collapse
had nowhere to put the controls it displaced.

**Blocked by:** 09, and externally by ui-polish 02, which decides what a badge is and carries the
no-uppercase guard this ticket must pass.

**Status:** resolved — 2026-08-19, branch `ticket-104-search-page-scope`.

**Parent:** 07-the-page-header-is-one-quiet-line.md

### The dialog

- [x] The menu gains **Edit page details**, opening `ui/dialog.jsx` — installed since ticket 74 and
      used nowhere until now.
- [x] The dialog carries the priority picker and the note input, relocated and not redesigned.
- [x] When a review exists the dialog also carries **Clear**, and **Mark again** when the review is
      stale. The reading of the review stays on the line; the acting on it lives here.
- [x] The menu gains **Mark page reviewed**, present **only** when there is no review. It is one
      press with no form, so it does not go behind the dialog.
- [x] A half-typed note survives a click outside the dialog. This is the assertion that encodes why
      this is a dialog and not a popover, and it is not optional.
- [x] The note is visible while it is being edited.
- [x] A priority can be cleared as easily as it is set.
- [x] The dialog closes on a successful save and stays open on a failure.
- [x] When the log is read-only or no name has been given, the writing controls are refused **before**
      anything is typed, with the reason ticket 08's value carries.
- [x] A saved annotation reaches the one live region ui-polish 03 owns. This ticket consumes that
      region and does not build one.

### The line

- [x] Review state, priority and note-presence render as **one quiet line**.
- [x] They are text. The priority is the one badge, because ADR 0019 already allows it; the review
      state and the note mark are not.
- [x] The line says only that a note exists. The note itself is in the dialog.
- [x] A page with no priority, no note and no review draws a shorter line, not three empty slots.
- [x] *changed since review* stays legible on the line.
- [x] The progress bar keeps its absolute counts beside its percentage.
- [x] *Re-check* stays a visible button, and stays absent rather than broken when the local service
      does not answer.
- [x] The header passes ui-polish 02's no-uppercase guard and 03's accessible-name guard.

### Gate

- [x] `Annotations.browser.test.mjs` gains the dialog assertions, including the surviving note. No
      new browser test file is created.
- [x] `Progress.browser.test.mjs` gains the quiet line's reading.
- [x] `npm test && npm run lint && npm run build`.

## Traps

- **Relocate, do not delete.** Every fact on the old header is still reachable after this ticket.
  A fact behind a disclosure is not silently absent; a fact removed is.
- **Do not touch the annotate bar.** Its priority and note act on a selection of pages from the
  dashboard. Different surface, different object.
- **Do not redesign the priority picker or the note input.** They move. A redesign inside a
  relocation is how a relocation stops being provable.
- **No amber.** ADR 0019 spends it on three states that are genuinely wrong, and a stale review is
  not one of them. The words carry it.
- **No toast.** The PRD refuses one and the live region is the announcement.
- **This moves no count, no bar and no denominator.**
- **One test, then the implementation it asks for.** The dialog has enough behaviour to tempt a
  written-up-front suite, and a suite written before the dialog exists verifies imagined behaviour.
