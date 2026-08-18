# 07 — The page header is one quiet line, and the rest is behind a menu

Type: spec
Status: ready-for-agent
Blocked by: 02 (the weights, which decides what a badge is) — not by 133, which rewrites the
dashboard and the ledger and does not touch this header.
Parent: ../PRD.md
Decided in: a grilling session against the `Production UX Blueprint` — see
`.scratch/ux-blueprint/TRIAGE.md`, sections 11, 32 and 33.

**Built as three tickets**, in order: **08** the header decides as a value (a prefactor that moves
nothing), **09** the menu exists and holds *Copy link*, **10** page details move into a dialog and
the header goes quiet. 08 is unblocked. Only 10 waits on ui-polish 02.

## Problem Statement

An editor opens a page to decide the differences on it. Before they reach a single difference the
header asks them to read a progress bar, a review control, the word *Priority*, three priority
toggles, a note input with its own save button, a *Re-check* button and a name field — all rendered
permanently, all at full weight, and none of them the thing the editor came for. The page key, which
is the one fact that says *where am I*, competes with three annotation controls that most editors
touch on a small minority of pages.

The controls are also drawn as though they were always in play. The priority toggles and the note
input sit open on every page whether or not anybody intends to annotate it, so the interface spends
its most prominent row on a form that is usually not being filled in.

PRD story 27 asks for review state, priority and note to collapse onto one quiet line. That story
cannot be built as written, because the priority toggles and the note input have nowhere to go: a
quiet line can *read* a priority, but it cannot *set* one. Collapsing the line without giving the
controls a home would delete them, and this pass's standing rule is that a fact may be relocated and
never removed.

## Solution

The header becomes one quiet line and a small number of controls that earn their place.

The line **reads**: the priority, whether there is a note, and the review state. It is text, not
badges — with the single exception the badge list already allows, the priority. Beside it, two
controls survive at full visibility: **Re-check**, because it is the one action with a real cost and
PRD story 28 keeps it out of any menu, and a **more** control drawn as an icon-only trigger.

The more control is a menu. It holds what the quiet line displaced and what the page has never
offered:

- **Mark page reviewed**, and only when there is no review yet. It is one press and no form, so
  making an editor open a dialog to reach it would be worse than leaving it where it is.
- **Edit page details**, which opens a dialog carrying the priority, the note, and — when a review
  exists — the controls that act on it: *Clear* and, when the review is stale, *Mark again*.
- **Copy link**, which puts this page's address on the clipboard. The deep link has been shipped
  since ticket 109 and nothing in the interface has ever offered it.

A **dialog** and not a popover, and the reason is a lost note: a popover dismisses on an outside
click, and an editor halfway through typing a note about a page is exactly the person who clicks
away to check something. The dialog is `ui/dialog.jsx`, which has been installed and used nowhere
since ticket 74.

What the editor may do is decided as a **value** before anything is drawn, in the shape this repo
already uses for `explainScope()`, `blockReading()`, `bucketOf()` and `collapses()`. The interesting
half of this ticket is not the menu; it is the refusals — read-only, no editor name, no local
service, already reviewed — and those belong somewhere a test can reach without a browser.

## User Stories

**The quiet line**

1. As a content editor, I want the page key to be the most prominent thing in the header, so that I always know which page I am deciding about.
2. As a content editor, I want review state, priority and note on one quiet line, so that three annotations do not compete with the content I came for.
3. As a content editor, I want the priority to read *High* rather than `HIGH`, so that a priority is information and not an alarm.
4. As a content editor, I want the line to say only that a note exists, so that a long note cannot stretch the header.
5. As a content editor, I want the progress bar to keep its absolute counts beside its percentage, so that a growing corpus does not read as a regression.
6. As a content editor, I want a page with no priority, no note and no review to draw a shorter line rather than three empty slots, so that an unannotated page looks unannotated.
7. As a content editor, I want *changed since review* to stay legible on the line, so that I know a review went stale without opening anything.

**Re-check**

8. As a content editor, I want *Re-check* to stay a visible button, so that the one action with a cost is never hidden in a menu.
9. As a content editor, I want *Re-check* to be absent rather than broken when the local service is not running, so that I am not offered an action that cannot happen.

**The menu**

10. As a content editor, I want one *more* control rather than four scattered controls, so that the header has one place I look for everything else.
11. As a keyboard user, I want the menu to open, move and close from the keyboard, so that nothing in the header needs a pointer.
12. As a keyboard user, I want focus to return to the trigger when the menu closes, so that I do not lose my place in the page.
13. As a screen-reader user, I want the icon-only trigger to have an accessible name, so that the glyph is not the only thing announced.
14. As a touch user, I want a comfortable hit area on the trigger, so that a small glyph is not a small target.
15. As a content editor, I want *Mark page reviewed* offered only when there is no review, so that the menu never offers me something that has already happened.
16. As a content editor, I want *Copy link* in the menu, so that I can send a colleague to this page without reading the address bar.
17. As a content editor, I want the menu to stay present when the log is read-only, with its writing items refused and saying why, so that I learn the state rather than wondering where the controls went.

**Editing page details**

18. As a content editor, I want *Edit page details* to open one dialog holding the priority and the note, so that annotating a page is one task in one place.
19. As a content editor, I want a half-typed note to survive an accidental click outside the dialog, so that I do not lose what I wrote.
20. As a content editor, I want the note visible while I edit it, so that the page does not hide the note it is asking me about.
21. As a content editor, I want to clear a priority as easily as I set one, so that a wrong priority is not permanent.
22. As a content editor, I want to clear a review from the dialog, so that the withdrawal lives beside the thing it withdraws.
23. As a content editor, I want *Mark again* on a stale review from the same dialog, so that I do not go looking for a second control.
24. As a content editor, I want the dialog to say it cannot save before I type, when the log is read-only or my name is missing, so that I do not write a note into nothing.
25. As a content editor, I want the dialog to close on a successful save and stay open on a failure, so that the outcome is unambiguous.
26. As a screen-reader user, I want a saved annotation announced, so that I know a write happened.

**The decisions behind it**

27. As a maintainer, I want what the header offers decided as a value, so that the refusals can be tested without a browser.
28. As a maintainer, I want each refusal to carry its reason, so that the interface can say why rather than only that it will not.
29. As a maintainer, I want the reasons to come from the existing not-writing vocabulary, so that two surfaces do not explain read-only differently.

## Implementation Decisions

**A pure decision module, and it is the seam.** One new module under the web layer's `lib`, exporting
one function. It takes the page's review, its annotations, whether the override log can be written,
whether an editor name is set, and whether the local re-check service answers. It returns the quiet
line's parts and the menu's items, each item marked present, absent, or present-and-refused with a
reason. Nothing renders inside it and it imports no component. It is the same seam shape as
`explainScope()` in the search and `blockReading()` in the block panel, and it exists for the same
stated reason: a reading with five inputs and four refusals is a value, and JSX is where a value is
drawn and never where it is decided.

**The refusal reasons are borrowed, not written.** `whyNotWriting()` already produces the sentences
for no connection, no answer, no editor name and still-loading. This module calls it rather than
composing a second set, because two surfaces explaining read-only differently is the failure the
glossary exists to stop.

**The menu is `dropdown-menu`, and it is the twenty-second file under `ui/`.** ADR 0007 fixes that a
new primitive is a small decision recorded in that ADR rather than a decision of its own, and this
ticket adds the consequence line. It is taken for behaviour: a keyboard menu, a roving focus, a
dismiss on escape that restores focus, which is precisely what ADR 0007 says the dependency is for.
Install it with the project's shadcn setup rather than hand-rolling a panel — ADR 0007 already
records one hand-rolled panel, the search suggestion list, and states in terms that a second should
be read as evidence the repo wants a primitive rather than as licence for a third. This is not that
case: the suggestion list is hand-rolled *because* it must not take focus, and a menu must.

**The dialog is the installed one.** `ui/dialog.jsx` has been present since ticket 74 with no call
site. It carries the priority picker and the note input unchanged — this ticket relocates those two
controls and does not redesign them.

**Review is read on the line and acted on in the dialog.** The line states the review and its
staleness; *Clear* and *Mark again* move into the dialog beside the annotations they sit with.
*Mark page reviewed* is the one exception and stays in the menu, because it is a single press with
no form and a dialog would be ceremony around one button.

**The annotate bar is untouched.** Its priority and note controls act on a selection of pages from
the dashboard and are a different surface with a different object. This ticket changes the single
page's header only.

**No new badge.** ADR 0019 closes the badge list at four and the priority is already one of them.
The review state, the note mark and everything else on the line are text.

**No new tone, and no amber.** ADR 0019 spends amber on states that are genuinely wrong. A page with
a stale review is not one; the words carry it.

**Export Markdown is refused as a menu item.** It exists — two downloads in the content view's
toolbar — and it exports the two sides of the spine. Moving it to the header would separate a
control from the thing it acts on, which is the reason *View diagnostics* was refused from the same
menu. Recorded in the triage rather than silently dropped.

## Testing Decisions

**What makes a good test here.** It asserts what an editor can observe or what the module returns —
a word on the line, an item present or refused, a reason, focus landing back on the trigger — and
never how a component reached it. The decision module makes most of this reachable without a
browser, which is the point of putting it there.

**Seam A — the decision module, and it carries the weight.** A data-level test in the shape of
`search.test.mjs` and `blocks.test.mjs`. What lands here: a page with no annotations and no review
draws the short line; a stale review is distinguished from a fresh one; *Mark page reviewed* is
absent once a review exists; a read-only log leaves every item present and refused with the reason
`whyNotWriting()` gives; a missing editor name refuses the writes and not *Copy link*; an absent
local service removes *Re-check* rather than refusing it. Prior art for the shape is
`recheck-choice.test.mjs`, which already decides a re-check as a value.

**Seam B — `Progress.browser.test.mjs`, extended.** `PageBar` and `ReviewControl` live in that
component, so the file already exists and no new browser seam is opened. What lands: the quiet line
renders the review reading, *Re-check* is a visible button and not a menu item, and the menu trigger
has an accessible name.

**Seam C — `Annotations.browser.test.mjs`, extended.** `PageAnnotations` and `PriorityPicker` live
there. What lands: *Edit page details* opens the dialog; the priority and the note are editable
inside it; **a half-typed note survives an outside click**, which is the assertion that encodes why
this is a dialog and not a popover; focus returns to the trigger when the dialog closes.

**Seam D — the existing guards.** The icon-only trigger must pass ui-polish 03's accessible-name
guard, and the line must pass ui-polish 02's no-uppercase guard. No new guard is added: this ticket
is a consumer of both.

**Knowingly unguarded.** Whether the menu's keyboard behaviour is correct in every browser. It is
the primitive's job and ADR 0007 bought the dependency precisely so this repo would not assert it.

## Out of Scope

- **The finding row's own `⋯`**, holding *View history* and *Copy link* for a single finding. That
  is ticket 05's, and it must be one shared menu instance driven by the active row rather than a
  menu mounted per row — a page can carry 168 of them.
- **`View history` itself.** Nothing renders override history today, and the history note is ticket
  78. This ticket adds no history reading.
- **`First seen`.** Ticket 77, and the triage settles that if it renders it renders behind the
  finding's history and not on a scanning surface.
- **The Markdown export**, which stays in the content view's toolbar.
- **The diagnostics toggle**, which stays beside the tabs with its count.
- **The breadcrumb**, which PRD story 25 keeps whole.
- **The block count**, which moves to where the blocks are and is ticket 05's.
- **Any change to what the log counts.** No bar, denominator, percentage or bucket rule moves.
- **The annotate bar** and every dashboard surface.

## Further Notes

**This ticket is why story 27 was unbuildable.** The PRD asked for the collapse and never said where
the displaced controls go, and the issue that owns story 27 says so in as many words. That gap is
what a grilling session against an outside blueprint found, and the blueprint's contribution was the
shape — a quiet line, a visible *Re-check*, and a `⋯` — rather than any of its copy.

**The blueprint's own menu had four items and two are refused.** *View diagnostics* is a view toggle
carrying a count and an on/off state, neither of which a menu can show. *Export Markdown* already
sits beside the content it exports. What is left is the two that were never offered anywhere and the
one that had no home.

**Two of this ticket's dependencies were already paid for.** `dialog.jsx` and `popover.jsx` have both
been installed since ticket 74 and neither has ever been rendered. This is the first call site for
one of them.
