# 25 — `fotogalerij`: the worst-case page

Type: grilling
Status: open
Blocked by: —
Parent: ../map.md

## Question

Production's `fotogalerij` holds **178 text elements** and **81 images**. The new
site's holds **9 text elements**, **38 images** and **45 links**. Both sides
answer 200. Is this the largest genuine parity defect in the nl store, or a
deliberate redesign of the gallery into a pure image grid — and either way, what
does the log do with a page that can emit about 170 findings on its own?

## Why this is a sharp question

Ticket 19 measured the near-empty band while designing its guard and found this
page sitting in it. It is the extreme case of the parity axis on live data:

| | production | new |
|---|---|---|
| text elements | 178 | 9 |
| images | 81 | 38 |
| links | 178 | 45 |
| markdown bytes | 13,939 | 156 |

Under ticket 02's rules almost every production element pairs with nothing, so
almost every one becomes a `structure` finding. `algemene-fotogalerij` shows the
same 178 elements against a new-site **404**, so ticket 20 owns that twin; this
one is pure parity and ticket 20 cannot take it.

Ticket 19 ruled out a ratio guard **because** this page occupies the band: 9
against 178 is a real page, so no threshold can separate "unrendered" from
"redesigned". That leaves the question to a human, which is this ticket.

## What to settle

- **Defect or redesign?** A gallery of 81 captioned photos rebuilt as a grid of
  38 uncaptioned ones is a content decision somebody made. If it was deliberate,
  ~170 findings are all noise on the busiest page in the store. If it was not,
  it is the biggest single thing the log has found.
- **One judgement or 170?** If it is deliberate, does an editor dismiss 170
  findings one at a time? Ticket 09 made bulk dismissal a UI action that writes N
  events, not a third key — is that enough here, or does this page want a
  page-level `muted`?
- **Does the bar survive it?** Ticket 09's bar counts shown classes on the
  snapshot. One page with 170 open findings dominates the store roll-up and makes
  every other page's progress invisible.
- **Does the tab survive it?** Ticket 12 chose Variant A's tabbed ledger with the
  two sides next to each other. A 178-against-9 diff is the stress test of that
  layout, and it was never prototyped at this size.
- **Are the other gallery pages the same shape?** `fotogalerij/zonwering` is 178
  against 9, `fotogalerij/glazen-schuifwand` 97 against 9,
  `fotogalerij/serre` and `fotogalerij/tuinkamer` 69 against 9,
  `fotogalerij/verlichting` 66 against 9. Six pages, one decision or six?

## Notes

Graduated from ticket 19.

Measurements in `data/probe-extract-v2.json` in `tm-content-parity`, re-made with
`node crawl/probes/probe-extract-v2.mjs`.

Resolve with `/grilling`. The defect-or-redesign half needs a human who knows
what the gallery was meant to become.

## Measured 2026-08-06 by ticket 26

The gallery pages are now the two worst pages in the store, by the log's own
count: `fotogalerij/zonwering` **401** shown findings and `fotogalerij` **395**,
against a median of 41 and a best of 6. `fotogalerij/glazen-schuifwand` is fifth
at 225.

So this ticket is no longer hypothetical: whatever it decides changes the top of
the dashboard. Note that these are `cms-page` on both sides, not category pages,
so ticket 27 does not cover them.
