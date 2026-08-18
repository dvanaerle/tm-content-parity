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

**Status:** ready-for-agent

**Parent:** ../PRD.md

- [ ] The header leads with **open work** and **Needs attention**. Nothing else in it competes with
  those two.
- [ ] The **one-sided** count moves to the head of the one-sided aside; the **not checked** count to
  the head of the not-checked list; the **diagnostics** count onto the diagnostics disclosure. Each
  number now sits with the list it describes.
- [ ] The **pages compared** figure is stated once, in the sentence that already states it, and not
  also as a chip.
- [ ] No count is deleted, and no list loses a row. A reader can still reach every figure the
  header carries today.
- [ ] Healthy system state does not wear prominent success styling. Normal operation recedes.
- [ ] In the pages table, the **page key** is the most prominent thing in its row.
- [ ] **Open work** is the second column, so worst-first is legible without reading four count
  columns.
- [ ] The **block count** leaves the page cell and becomes its own column. The page cell keeps the
  key, the priority and the note, and stops carrying five things.
- [ ] The four **per-check counts** (text, links, images, diagnostics) remain on wide widths and drop
  out on narrow ones, by container width. On a wide screen an editor loses nothing they have today.
- [ ] A **page note** in the table is a quiet mark, and its full text is reachable. One long note can
  no longer stretch a row across the screen.
- [ ] The **priority** reads *High*, quietly, and only earns strong colour where urgency requires it.
- [ ] The **repeat** list adopts the two-sided comparison from 02: no arrow, both sides labelled.
- [ ] The class groups stay in the vocabulary's order and never in the counts' order.
- [ ] `npm test` passes, including the existing dashboard browser tests.

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
