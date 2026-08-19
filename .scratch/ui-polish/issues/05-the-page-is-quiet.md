# 05 — The page is quiet

**What to build:** an editor opens one store page to decide about its differences, and the compared
content is the loudest thing on the screen. The header says where they are and what is left, without
five facts competing for the same emphasis. A finding row leads with the two texts rather than with
three badges about the two texts. And the floating bar that appears when pages are ticked names what
was selected instead of repeating the very text that is already on screen above it — while its
sibling, which today names nothing at all, gains the same subject.

**Blocked by:** 02 — the row, the header and the bars all consume the badge rule and the two-sided
comparison contract. 03 — the row's reserved height must be settled before the row is restyled.
**133** in `content-parity-log`, which is rewriting the ledger.

**Status:** resolved except the header's quiet line, which is 07's — 2026-08-19, branch
`ticket-104-search-page-scope`.

**Two criteria are deliberately not built here, and they are not dropped.** *Review state,
priority and note collapse onto one quiet line* and *Re-check stays visible, anything else
behind a more control* were **re-owned by ticket 07** after this one was written, and 07 says
in as many words why story 27 was unbuildable as this ticket states it: a quiet line can read
a priority and cannot set one, so collapsing the line without giving the displaced controls a
home would delete them. 07 splits the work into **08** (the header decides as a value), **09**
(the menu and *Copy link*) and **10** (page details move into a dialog, and the header goes
quiet), all three `ready-for-agent`. Building them here would have been building 10 badly and
in the wrong ticket. 07 already cross-references the rest of this list as this ticket's — the
block count by name — so the split is the one the two files agree on.

Nine things landed differently from the way this ticket wrote them, and they are here rather
than left for a reader to find:

- **Three criteria were already satisfied and needed nothing.** The breadcrumb is whole
  (ticket 109), `PageBar` has drawn its absolute counts beside its percentage since ticket 09,
  and the state of a finding has read as plain words with *Needs attention* alone left loud
  since ui-polish 02. The content view's two labelled sides arrived with 02's `DiffHeads` as
  well; what this ticket added there is the assertion that the pair is still the first two
  heads after the columns were reordered.
- **A bar that reports a success has to outlive the selection that produced it.** The success
  line was the last thing to be found, because the bulk bar takes its own ticks off what it
  wrote — so a press that wrote everything emptied the selection, and `Repeats.jsx` unmounted
  the bar with the sentence saying it worked still inside it. The report therefore moved up
  into `FlatSelection`, which holds it after the ticks are gone; the bar has a second state
  that draws the report and the way to put it down, and nothing else. It is cleared by the
  editor's next tick and never by the press's own untick.
- **The empty state's *filter* branch was written and then deleted, because it cannot
  happen.** *No rows in this filter* names the one cause this view has no path to: the class
  pills are built from the rows on screen, so every class they offer has at least one row. The
  two reachable causes are a page nothing was extracted from and a page whose every block is a
  diagnostic behind the control — opposite answers, and the second is one press from undone.
  Dead copy for an unreachable branch would have been the same defect in a new place.
- **The block count moved to the content view and is therefore one tab away.** The Text tab is
  where the blocks are, and it is the tab that lands first, so the fact is at the head of the
  list it counts. On Links, Images, Meta or Sibling it is off screen — which is the relocation
  the pass permits and not a removal, and it is said here rather than left for a reader to
  notice.
- **The two metadata cells gained a `data-slot`.** Reordering the columns broke three
  assertions that read *the first cell of the row*, and the honest fix is not a new index but
  a name: the cell says which column it is, in the manner of `data-side` and `data-bucket`, so
  the next reorder cannot silently move what a test is reading.
- **The bulk dialog's *one title* is a label, and that is what made it one.** The task was
  stated in a placeholder, which is not a title: it vanishes the moment an editor types, it is
  no element's accessible name, and the panel opened on an unlabelled box above a sentence
  about page counts. As `Label` + `htmlFor` it stays while the sentence is written and the
  input has a name a screen reader announces. The tooltip naming the pages a *Clear* will skip
  was left exactly where it is, as the trap requires.
- **The empty state's three causes are ordered, and the review is what found the order.** The
  first pass deleted the filter branch as unreachable — the class pills are built from the rows
  on screen, so every class they offer has one. That is true at a fixed diagnostics control and
  the control is not fixed: the pills are counted under it while the pick is held in the
  component, so choosing a diagnostic class and then switching diagnostics off empties the list
  with the filter still set. The deleted branch was the correct sentence for that case, and the
  one left would have said *every block on this page is a diagnostic* about a page holding five
  that are not. The filter is now asked first, and a browser test walks that exact sequence and
  goes red without it.
- **The success sentence is the one the live region already spoke.** `pressMessage()` has said
  *Saved on 12 pages* to a screen reader since ui-polish 03, back when the screen said nothing
  at all — so the visible line draws that string rather than composing a second copy of one
  outcome. It costs the bold count the shortfall line wears, which is the right way round: the
  shortfall stays the louder of the two.
- **`Comparison` has one caller left and keeps its container query.** The bulk bar was the
  narrow half of the pair that justified a container size query over a viewport breakpoint.
  The repeat row is the survivor and it still narrows with the list it is in, so the query is
  not now theoretical — but `Diff.jsx` says so out loud rather than leaving a reader to wonder
  why a stacking rule exists for one call site.

**Parent:** ../PRD.md

- [x] The **breadcrumb stays whole**. It answers *where am I* as well as offering the way out, and a
  back-link answers only the second.
- [x] The progress bar keeps its **absolute counts beside its percentage**, quietly. A bare
  percentage reads as a regression when the corpus merely grew.
- [ ] Review state, priority and note collapse onto **one quiet line** — **ticket 10's**, and see
  the note above.
- [ ] **Re-check** stays a visible button, because it is the one action with a cost. Anything else
  moves behind a *more* control — **ticket 10's**, and see the note above.
- [x] The **block count** leaves the header and appears where the blocks are.
- [x] A finding row leads with the **compared content**. The class label, the state and the metadata
  are secondary.
- [x] The state of a finding reads as **plain words**; **Needs attention** stays loud.
- [x] Secondary actions on a row remain available and become visually quieter. None of them moves
  behind hover.
- [x] The content view adopts the **two labelled sides** from 02 — no arrow, both sides named, wrapping
  in full.
- [x] The context markers keep their own words: *N agreeing blocks* against *N blocks with no open
  work*, and a finished page still says *nothing left to do* rather than claiming its blocks agree.
- [x] The **bulk bar names its object and its scope, never its content** — the count of pages and the
  class. It stops repeating the two texts already visible above it.
- [x] The **annotate bar** gains the same shape, so *2 pages selected* says which pages.
- [x] The count bubble currently duplicated verbatim in both bars becomes one component.
- [x] A bulk write that **fully succeeds** renders one quiet line saying so, in the place that already
  renders its failures. A partial failure still says *N of M saved*.
- [x] The bulk dialog is one title, one task and one main action.
- [x] Empty states say the actual reason they are empty, and the five kinds of nothing a page scope can
  return keep saying which one they are.
- [x] `npm test` passes, including the existing ledger, content-view and progress browser tests.

## Traps

- **Do not remove the tooltip that says which selected pages a *Clear* will skip.** The two bulk
  presses have different eligibilities on one selection, and that sentence is the only place an editor
  learns it. It is a consequence, not a justification.
- **Do not lose the difference between the two bulk presses.** A bulk dismissal expires with the text
  and skips a finding a colleague decided; a bulk clearing revokes a dismissal and touches nothing
  else. A difference whose every finding is already decided offers only the clearing.
- **A bulk decision writes N ordinary events and gains no column.** The bar is presentation; the table
  is append-only and unchanged.
- **The collapse set is taken when the page opens and held.** A tick must not collapse its own row out
  from under the editor who made it.
- **A landing removes nothing.** Arriving at one difference opens its row and marks it; the rows around
  it stay in document order.
- **The tab and the diagnostics toggle are borrowed by a landing and released independently.** Switching
  tabs must not switch off the toggle that was drawing the landed row.
- **Do not add a toast.** For a single row the state flipping is the feedback; the report line covers the
  one case where silence is genuinely ambiguous.
