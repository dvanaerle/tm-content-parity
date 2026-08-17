# 108 — A page row hands its key to the search

Type: task
Status: resolved 2026-08-17 — merged into 104 as part E. Not built; the work is unchanged and it moved.
Blocked by: 103
Parent: ../map.md

**What to build:** an editor looking at *Pagina's* finds the page they care about, and
gets from there into a scoped search without typing an opaque key by hand.

This is the page-first path. The original ask was to make *Pagina's* the default view,
and that was settled against: the page table draws every row at once, so landing there
trades a budgeted wall for an unbudgeted one, and it demotes the queue 81 established.
What the ask was actually reaching for is this — a way to go from *this page* to *what is
on this page* — and it is a click, not a default.

It also stops the two views being two disconnected worlds. Today the page list and the
search have nothing to say to each other.

- [ ] A row in *Pagina's* offers a way to search within that page, distinct from the link
      that opens the page itself.
- [ ] Taking it puts that page's scope in the search box and shows the scoped result.
- [ ] The existing page link is unchanged and still opens the whole content view, never a
      fragment — `docs/adr/0006-the-content-view-is-the-spine.md`.
- [ ] A key holding a slash or parentheses is inserted correctly and matches only its own
      page.
- [ ] Any class filter already on stays on, and the scoped result respects it.
- [ ] The default view does not change. *Verschillen* stays where an editor lands.

## Traps

- **Do not make the row itself scope the search.** The row's job is opening the page, and
  ADR 0006 is the reason. This is a second, clearly separate affordance.
- Scoping from a one-sided page is reachable from the *Eenzijdige pagina's* aside too,
  and lands on 104's explanation rather than on silence.
- This ticket adds no new page data. Everything it needs is on the row already.

## Answer

**Merged into [104](104-a-scoped-search-says-which-kind-of-nothing.md) as part E, 2026-08-17.**
Nothing here is withdrawn and nothing is built. This ticket and four others were five
tickets over one search box — one scope value, one load-time page list, one component
tree — and not one of them moves a count, a bar or a denominator. The runbook's rule is
*batch freely inside a gate*, and there was no gate between them to batch across. 104 now
carries the page row as part E, with every criterion and every trap from this file
copied across, and lands as its own commit on 104's branch.

Read 104. This file is kept as the record of where the work was written.
