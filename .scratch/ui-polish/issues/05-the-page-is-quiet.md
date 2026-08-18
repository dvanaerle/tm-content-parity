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

**Status:** ready-for-agent

**Parent:** ../PRD.md

- [ ] The **breadcrumb stays whole**. It answers *where am I* as well as offering the way out, and a
  back-link answers only the second.
- [ ] The progress bar keeps its **absolute counts beside its percentage**, quietly. A bare
  percentage reads as a regression when the corpus merely grew.
- [ ] Review state, priority and note collapse onto **one quiet line**.
- [ ] **Re-check** stays a visible button, because it is the one action with a cost. Anything else
  moves behind a *more* control.
- [ ] The **block count** leaves the header and appears where the blocks are.
- [ ] A finding row leads with the **compared content**. The class label, the state and the metadata
  are secondary.
- [ ] The state of a finding reads as **plain words**; **Needs attention** stays loud.
- [ ] Secondary actions on a row remain available and become visually quieter. None of them moves
  behind hover.
- [ ] The content view adopts the **two labelled sides** from 02 — no arrow, both sides named, wrapping
  in full.
- [ ] The context markers keep their own words: *N agreeing blocks* against *N blocks with no open
  work*, and a finished page still says *nothing left to do* rather than claiming its blocks agree.
- [ ] The **bulk bar names its object and its scope, never its content** — the count of pages and the
  class. It stops repeating the two texts already visible above it.
- [ ] The **annotate bar** gains the same shape, so *2 pages selected* says which pages.
- [ ] The count bubble currently duplicated verbatim in both bars becomes one component.
- [ ] A bulk write that **fully succeeds** renders one quiet line saying so, in the place that already
  renders its failures. A partial failure still says *N of M saved*.
- [ ] The bulk dialog is one title, one task and one main action.
- [ ] Empty states say the actual reason they are empty, and the five kinds of nothing a page scope can
  return keep saying which one they are.
- [ ] `npm test` passes, including the existing ledger, content-view and progress browser tests.

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
