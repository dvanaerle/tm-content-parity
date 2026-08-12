# 108 — A page row hands its key to the search

Type: task
Status: ready-for-agent
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
