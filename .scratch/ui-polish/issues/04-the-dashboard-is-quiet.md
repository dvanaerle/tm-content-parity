# 04 — The dashboard is quiet

**What to build:** an editor opens a store dashboard to answer one question — *what do I decide
next* — and the screen answers it instead of reciting a census. Open work and what needs attention
lead. The four counts that describe the corpus rather than the work move to the heads of the lists
they are about, which are already further down the same page. The pages table stops being upside
down: the page key is the most prominent thing in its row, open work is beside it, and the four
per-check counts stop competing with both.

Nothing is deleted. Every fact on this screen today is still on this screen, either where it was
or at the head of its own list.

**Blocked by:** 02 — the header and the table both consume the badge rule, the sentence-case rule
and the two-sided comparison contract. **133** in `content-parity-log`, which is rewriting this
surface.

**Status:** resolved except the priority's colour, which is issue 11's to decide — 2026-08-19,
branch `ticket-104-search-page-scope`. Thirteen of the fourteen criteria are closed and the
open one is ticked nowhere, so a reader counting boxes gets the same answer this line gives.

Nine things landed differently from the way this ticket wrote them, and they are here rather
than left for a reader to find:

- **The diagnostics disclosure did not exist, so it was built.** This ticket names *the*
  diagnostics disclosure as though the dashboard had one; it does not. *Show diagnostics* is a
  control on the page surface, and the dashboard's only diagnostics were the header count and
  a per-page column headed *Hidden*. So a fourth aside was added at the foot of the screen,
  closed, headed `Diagnostics (N)` and listing the pages that carry them. It is also the
  count's **only** home that survives a narrow screen, because the per-page column is one of
  the four that drop out by container width — and a fact must never be silently absent.
- **The green came off Closed, and that is what *no prominent success styling* cost.**
  `app.css` already said the rule twice — *`lost` and `added` are the only red and the only
  green in the interface, and no status uses them* — and `BUCKET_TONE.closed` wore `added`
  anyway, because ticket 131 declined to move a pixel and left the one-word change ready.
  This is where it is spent. It reaches the **ledger** too, since `BucketCount` is shared, and
  the repeat row's own closed count went with it. Neither is optional: the repeats view *is*
  this dashboard, and a shared component cannot go blue on one screen and stay green on the
  other — a grouping that reads two ways on two screens is the failure the dashboard's own
  test docblock exists to prevent. The repeat row now reads `BUCKET_TONE.closed` instead of
  spelling the tone out, so the two are one decision rather than two repaints that agreed.
- **The prose that left with two of the chips was put back.** The one-sided and not-checked
  chips carried explanatory tooltips, and a tooltip is a fact too. *Only one site has these
  pages* was already the one-sided aside's note; the not-checked aside's note was thinner than
  the chip's, so it now carries *Found and visible, but there is nothing to compare*. Only the
  chip's last clause is gone, and only because it pointed the reader at the bottom of the page,
  which is where they are standing when they read it.
- **Two of the three relocations were already done.** The one-sided and not-checked counts are
  in their aside headings and have been all along. What left the header was the duplicate, not
  the fact — which is the whole of what this part of the ticket was asking for.
- **`pages compared` moved nowhere.** The sentence beside the store name already states the
  entire arithmetic — found, crawled, comparable — so the chip was the second half of a
  sentence that did not need one. Its comment in `index.astro` said *the chips below start at
  `Pages compared`* and now says why they do not.
- **The buckets column moved whole and kept its three-word head.** *Open work is the second
  column* is satisfied by moving the existing column rather than by pulling Open out of the
  three: a bucket partitions the denominator exactly once, and splitting the head would have
  been a number moving, which the traps forbid.
- **The header became a named region.** It needed a stable handle for its own test, and of the
  handles available a landmark name is the one that is also worth having.
- **The page note's mark is a link and not a tooltip.** ADR 0019 refuses hover that reveals
  information a reader needs, and the note's full text already lives on the page it is about —
  which is also where it is edited. So the mark goes there. The note is in the mark's
  **accessible name** and not only in its `title`, because a row of marks all reading *Note* is
  what a keyboard or touch reader would otherwise be left with; the name carries the page key
  too, so a list of them is a list of distinguishable links. The `title` is then a convenience
  for a pointer and the only hover-only thing about it, which is what the ADR permits.
- **The container threshold is verified against the built stylesheet and not unit-tested.**
  `@4xl` emits `@container (width>=56rem)`, a size query ADR 0015 permits. It is not asserted
  as a computed layout for ticket 02's own recorded reason: nothing mounts Tailwind's
  stylesheet in the browser project, so a measured width would be identical in a narrow box
  and a wide one. What is tested is the markup contract — the table declares the container and
  all eight cells wear one drop-out class.

Two things are **knowingly left standing**, so they are decisions and not oversights:

- **The table still scrolls sideways below about 700 pixels**, once the four counts have gone.
  What is left — the key, the three buckets and the block count — is wider than a phone, and
  `ui/table.jsx` answers that with its own `overflow-x-auto`. The PRD puts *the responsive
  widths themselves* in ticket 87, and narrowing a column to chase this would be spending 87's
  decision here. What this ticket owed was the drop-out, and that works.
- **The page key is the most prominent *content* in its row, not the loudest thing in it.**
  *Needs attention* and the priority are badges, and ADR 0019 requires both to stay
  recognisable at a glance while scanning. A key that outshouted them would be this pass
  arguing with its own ADR.

The one criterion this ticket **could not close** is the second half of the priority line.
*High* reads in sentence case, quietly, since ticket 02 — but the `caution` amber it wears is
issue 11, which is `needs-info` and asks a reader which of four costs to pay. Guessing it here
would have taken that decision away from them.

**Parent:** ../PRD.md

- [x] The header leads with **open work** and **Needs attention**. Nothing else in it competes with
  those two.
- [x] The **one-sided** count moves to the head of the one-sided aside; the **not checked** count to
  the head of the not-checked list; the **diagnostics** count onto the diagnostics disclosure. Each
  number now sits with the list it describes.
- [x] The **pages compared** figure is stated once, in the sentence that already states it, and not
  also as a chip.
- [x] No count is deleted, and no list loses a row. A reader can still reach every figure the
  header carries today.
- [x] Healthy system state does not wear prominent success styling. Normal operation recedes.
- [x] In the pages table, the **page key** is the most prominent thing in its row.
- [x] **Open work** is the second column, so worst-first is legible without reading four count
  columns.
- [x] The **block count** leaves the page cell and becomes its own column. The page cell keeps the
  key, the priority and the note, and stops carrying five things.
- [x] The four **per-check counts** (text, links, images, diagnostics) remain on wide widths and drop
  out on narrow ones, by container width. On a wide screen an editor loses nothing they have today.
- [x] A **page note** in the table is a quiet mark, and its full text is reachable. One long note can
  no longer stretch a row across the screen.
- [ ] The **priority** reads *High*, quietly, and only earns strong colour where urgency requires it.
- [x] The **repeat** list adopts the two-sided comparison from 02: no arrow, both sides labelled.
- [x] The class groups stay in the vocabulary's order and never in the counts' order.
- [x] `npm test` passes, including the existing dashboard browser tests.

## Traps

- **Relocating is permitted; deleting is not.** The standing rule is that a fact is never silently
  absent. A count behind a disclosure or at the head of its own list is fine; a count removed is a
  different decision and this ticket does not have it.
- **Do not turn a bucket into a filter.** The three buckets count and never filter. Closed is a
  disclosure that names how many it holds, because a filter would make a row vanish the moment an
  editor ticked it fixed.
- **Do not put the class filter's state in two places that can disagree.** The pills, the scope chip
  and the strip are all readings of one state.
- **Opening a class group is not a filter.** It is session state, it never enters the strip, and
  *Clear filter* does not touch it.
- **The search box stays the source of truth for the page scope.** The chip is a reading of it.
- **One-sided pages are shown and never decided.** There is no checklist here and none is planned.
