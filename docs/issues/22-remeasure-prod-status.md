# 22 — Re-measure production status with production live

Type: task
Status: open
Blocked by: —
Parent: ../map.md

## Question

Nothing to decide. Production was in maintenance mode for the whole of ticket
04's seed run, so the status half of `data/10-store-seeds.json` is not a
measurement. Measure it again.

## What is wrong now

- All 451 `prodStatus` values are 0.
- `prodMaintenance: true` is recorded on 177 of 181 NL rows, and on nearly every
  row of the other five stores. Ticket 06 later made 362 requests with **0**
  maintenance responses, which proves the flag is stale.
- Maintenance is a transient state of the moment a crawl ran. It is never a
  property of a page, so the flag must not persist in the seed data.

## What to do

- Re-measure `prodStatus` and `prodRedirect` over all 451 store-page pairs in
  `tm-content-parity`.
- Arm ticket 04's fail-loudly guard: `maintenanceReason()` and
  `MaintenanceError` in `crawl/fetch-page.mjs` already exist. A second
  maintenance window must abort the run, not record phantom results.
- Clear the stale `prodMaintenance` flags.

## What not to do

**Do not re-run the whole seed derivation.** The page list is sound and does not
depend on maintenance mode: the sitemap parse and the hreflang clustering
resolved every non-NL page onto an NL key with zero uses of the store-scoped
fallback. Re-measure status only.

## Notes

This blocks **ticket 20**, which reasons about one-sided pages from status, and it
blocks the compare stage on the parity axis.

It blocks **nothing on Axis B**: ticket 11 settled that the coverage axis reads
the new site only.
