# 44 — Heading outline shape

Type: task
Status: needs-triage — **2026-08-13**. Was `ready-for-agent`. Its class-split argument is
the mute — *"one shared class would let an editor mute both axes with one click"* — and ADR
0011 withdrew it. Re-argue on taxonomy or drop the split. See ticket 39. Note also that
ticket 86 makes `heading-level` `information` rather than work, which this ticket should
be read against.
Blocked by: 42
Parent: ../map.md

## What to build

The one structural check on this axis. Compare the **sequence of heading levels**
inside `<main>`, and ignore the heading text.

Ticket 11 removed the element count and the section count. German text is longer
than Dutch, and a translator can put two sentences together, so those counts move
for correct reasons. The heading outline does not: a section that is absent shows
as an absent `h2` in the sequence.

The extract gives this directly. Elements carry `kind: 'heading'` and
`level: 1-6`.

## Rules from ticket 11

- **One finding per divergent position** in a sequence alignment against NL. Not
  one finding per page. A per-page finding is not actionable — "something about
  the headings differs" — and worse, its content-addressed id changes when any
  unrelated heading is edited, so every dismissal expires. A per-position finding
  reads "de has no third-level heading after `h2` number 2", which is a task.
- **Cap at 0.5.** If more than half the positions diverge, emit one finding for
  the whole page instead. The page is restructured, not incomplete.
- **A tie goes to `outline-shape`**, which is the more actionable of the two.
- The 0.5 number lives in `compare/contract.mjs`, put there by ticket 39.

## The class for the cap

Ticket 11 said to reuse ticket 02's `restructured`. **Ticket 33 may have retired
that class already** — spec 32 replaces `structure` with a directional pair and
reworks the text classes. Ticket 39 settles what axis B uses for the cap, because
a class record carries one axis ~~and `muteKey()` is `store|page|class`, so one
shared class would let an editor mute both axes with one click~~. **Use whatever
ticket 39 decided.** Do not open it again. — **the mute clause is struck 2026-08-13, ADR
0011**, and it was the whole reason given here. The instruction stands: 39 owns the
question, and 39 now has to answer it on taxonomy.

## Acceptance criteria

- [ ] A de page that lost one section makes one finding at that position.
- [ ] A page where more than half the positions diverge makes one finding, not
      many.
- [ ] A tie at exactly 0.5 makes `outline-shape` findings.
- [ ] Editing an unrelated heading does not change the id of a finding at another
      position.
- [ ] Heading text is never compared. Only the level sequence.
- [ ] `npm test` is green. The alignment and the cap have tests.

## Notes

Measure the divergence rate over the five stores before you call this done. If
most pages are above the cap, the check gives one hidden finding per page and
tells an editor nothing. That is a real result and it belongs in the ticket.
