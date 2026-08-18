# 137 — Hidden for a reason that is not a width

Type: task
Status: needs-triage
Parent: ../map.md

**What to build:** a decision, and then possibly a rule, about content the log compares
that no reader can see — hidden by a closed modal or a collapsed accordion rather than by
a viewport.

**Origin:** ticket 69. Its browser probe,
`crawl/probes/probe-canonical-viewport-visible.mjs`, was written to check that the
canonical-viewport rule never drops a visible block. It measured the converse too, and
that is this ticket.

## What was measured

2026-08-18, production, at 1,280 pixels, 19 page-store pairs — the widest pages in the
corpus plus two controls. The canonical-viewport conventions match 119 elements and
**0 of them are visible**, which is ticket 69's answer.

**617 content units on those same pages are invisible and no convention reaches them.**
Per page that is 40 to 68 on a category page or a product-information page, and 0 on
`/downloads`, a home page and most `showroom-contact` pages. By cause, from the samples:

| hiding ancestor | what it is |
| --- | --- |
| `tm-modal-content` | a closed modal — the measuring tool, with its whole `2000mm`–`2500mm` size table |
| `mgz-panel-body` | a collapsed accordion panel — product dimension lists |
| `pages` | the product-grid paginator (`U leest momenteel pagina 1`, `Pagina 2`) |
| `mgz-element-section clickableElement` | showroom address blocks |

## Why it is not ticket 69's problem

A viewport rule answers *which of two copies a reader gets*. These units are not a
second copy of anything: they are one copy, behind an interaction. Dropping them by the
same mechanism would be wrong on the face of it — a modal's content is real editorial
copy that a reader reaches by clicking, and an accordion panel is the most ordinary way
this site publishes a spec table.

## Why it may not be a problem at all

The current behaviour **over-reports**, which is the safe direction: the units are
compared, so a difference in them is reported. If the new site also ships the same
content behind the same interaction, the two sides pair and nothing is wrong. The
question this ticket has to answer first is therefore not "how do we hide them" but:

- **Do these units pair?** If production's modal content pairs with the new site's modal
  content, there is no work here and this ticket closes with the measurement.
- **If they do not pair, how many findings is it?** The `2000mm`–`2500mm` table alone was
  5 units per page on the pages ticket 69 looked at, and it showed up as `lostEntirely`
  in that ticket's corpus probe on 123 pages.
- The paginator is inside `#amasty-shopby-product-list` and so is already excluded. Do
  not count it twice: re-measure with the region list applied, which the ticket 69 probe
  did not do.

## Acceptance criteria

- [ ] The 617 are re-measured with the excluded-region list applied, so the paginator and
      anything else already out of scope is not counted.
- [ ] For each remaining cause, a statement of whether its units pair across the two
      sides, with the finding count if they do not.
- [ ] A decision, recorded: in scope and compared as now, or a new rule with its own
      reason. If the answer is "compared as now", this ticket closes and ADR 0020's
      consequence is amended to say so with the number.
- [ ] No change to the canonical-viewport conventions. Hiding by interaction is not
      hiding by width, and one list must not grow to mean both.
