# 20 — Pages that exist on only one side: the migration checklist

Type: grilling
Status: needs-triage
Blocked by: 22, 55
Parent: ../map.md

## Question

A store page that answers 404 on one side makes no finding, because ticket 07
gates the compare stage on `status === 200` on both sides. Ticket 09 kept these
pages out of the parity bar and gave them a separate migration checklist with its
own count, on its own tab. What is on that checklist, and what closes a row?

## Handed here by ticket 11

The coverage axis gave two populations back to this checklist, so that Axis B
never reasons about status:

- **The 404 cell is this ticket, not Axis B.** The seed data holds two different
  absences. A **null cell** means that nobody ever asked for the page in that
  store, which is coverage, and ticket 11 makes it a `missing-page` finding. A
  **404 cell** means that the store claims the page in its own sitemap and the new
  site does not serve it, which is a migration defect on a page that exists. New
  site 404s per store: nl 14, be 8, be_fr 4, de 3, fr 3, uk 2 — 34 in all.
- **A store page whose NL reference answers 404.** A DE page can answer 200 while
  its NL counterpart answers 404. Axis B emits nothing there, because a finding on
  the DE page sends the editor to the wrong page. The defect is on the NL page, so
  this checklist owns it.

## What to settle

- **The two populations are not the same problem.** 34 of 451 store-page pairs
  answer 404 on the new site (legacy-only: the page exists on production and is
  not rebuilt). 42 of 181 NL pages answer 404 on production and 200 on the new
  site (new-only: the `*/onderdelen` tree). One is missing work, the other is
  added scope. Do they share a tab, or are they two lists?
- **What closes a row.** A legacy-only page closes when it is rebuilt (re-check
  sees 200) or when somebody rules it retired. The second is a judgement with no
  measurement behind it, so it needs an override kind — is it ticket 09's
  `dismissed` on a page-scoped key, or a fifth kind?
- **Is `*/onderdelen` one decision or 42?** If the whole tree is intended, one
  rule closes 42 rows. If it is per page, the list is 42 judgements.
- **Redirects.** A legacy-only page that production redirects to a surviving new
  page is not missing, it is renamed. Ticket 05 measured redirects and hid the
  `redirect` class. Does the checklist detect this, or does a human?
- **The five other stores.** 34 pairs across six stores may be far fewer distinct
  pages. Does the checklist work per store page, or per page with a store
  breakdown?
- **Who reads it.** Ticket 09 ruled these are scope decisions, not editor work.
  If the reader is a manager and not an editor, the tab needs a different shape
  from the ledger.

## Notes

Graduated from the map's fog by ticket 09, which measured both populations.

Depends on ticket 04 for the store-page seed lists, on ticket 05 for the redirect
measurement, and on ticket 09 for the override model.

**Blocked by ticket 22.** This ticket reasons from page status, and every
`prodStatus` in the seed data is 0, because production was in maintenance mode for
the whole of ticket 04's run. The "42 NL pages answer 404 on production" figure
comes from ticket 07's own measurement, not from the seed file, and the legacy-only
population cannot be counted at all until 22 re-measures.

Resolve with `/grilling` and `/domain-modeling`.

## Also blocked by ticket 55, from the triage of 2026-08-07

**Ticket 22 is folded, not done.** Its re-measurement of `prodStatus` and
`prodRedirect` now happens inside
[53](53-every-content-page-in-the-seed-list.md), on the rebuilt seed list. The
edge on 22 stays, because 22 is where a reader learns why the number is missing,
but the work is in spec [50](50-content-page-discriminator.md) now.

**A second edge is added, on [55](55-five-stores-show-all-their-pages.md).** Both
populations this ticket counts are counted **out of the seed list**, and spec 50
rebuilds it:

| what this ticket says today | why it moves |
|---|---|
| 34 of 451 store-page pairs answer 404 on the new side | 451 pairs become about 800 |
| per store: nl 14, be 8, be_fr 4, de 3, fr 3, uk 2 | every non-NL store grows, `fr` from 28 pages to about 110 |
| 42 of 181 NL pages are new-only, the `*/onderdelen` tree | the NL baseline holds at 181, so this half is stable |

The NL half is the one number that does **not** move: ticket 50 matched all 181
NL rows and none are new. Everything about the five other stores does.

So the questions stay exactly as written — they are about what a checklist is and
what closes a row, and no rebuild answers those. What must wait is the sizing.
"Do they share a tab, or are they two lists?" is a different answer at 34 rows
than at the number 55 produces.

Re-triage after 55.
