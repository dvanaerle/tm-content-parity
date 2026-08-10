# 22 — Re-measure production status with production live

Type: task
Status: resolved
Blocked by: —
Folded into: 51, 53
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

## Folded, 2026-08-07. Not closed, and not work of its own

**This ticket has no work left in it. Both of its criteria live in spec 50 now.**
It stays open as a `folded` pointer, because ticket 20 is blocked by this number
and a reader who follows that edge must land somewhere that says where the number
comes from.

| what | where it went |
|---|---|
| Measure `prodStatus` and `prodRedirect` again | [53](53-every-content-page-in-the-seed-list.md) |
| Clear the stale `prodMaintenance` flags | [53](53-every-content-page-in-the-seed-list.md) |
| Arm ticket 04's fail-loudly guard | [51](51-runnable-tracked-seed-pipeline.md) |

**Why it folded rather than ran.** This ticket measures the 451 store-page pairs
of ticket 04's seed list. Spec [50](50-content-page-discriminator.md) replaces
that list: 451 pairs become about 800, and 28 French pages become about 110. A
run now measures a list that ticket 53 then throws away, and every number it
produced would have to be produced again.

**"Do not re-run the whole seed derivation" is overtaken.** That instruction was
right while the page list was sound. Ticket 50 found that it is not sound — the
`changefreq=daily` filter drops the store-local content of `de`, `fr` and
`be_fr`, so a French editor sees one page in four. The list is being derived
again for that reason, and the status measurement rides along with it.

The guard half went to 51 instead of 53 because it is a move and not a
measurement: `crawl/10-store-seeds.mjs:164-183` holds a private second copy of
the maintenance rule that records the flag and carries on, where
`crawl/fetch-page.mjs` throws. That private copy is how 451 phantom `prodStatus`
values reached the file. 51 is the prefactor that makes the generator runnable,
so it is where a duplicated rule is deleted.

**Ticket 20 still waits on this number**, and it now waits on 53 and 55 through
this ticket.

## Answered on 2026-08-10, in ticket 53

`crawl/11-page-status.mjs` measured both sides of all **820** store-page pairs of
the rebuilt list — 1,640 urls. **Not one request failed and not one maintenance
page answered.** So the old column of 451 zeroes was the maintenance window and
nothing else.

Production answers 200 on 771 of the 820. Every one of the 49 production 404s is
a carried row that no sitemap declares, and 39 of them are Dutch pages that exist
on the new site only. The per-store table is in
[53](53-every-content-page-in-the-seed-list.md) and the measurement is tracked as
`data/11-page-status.json`.

The `prodMaintenance` flag is gone. The seed list is a page list and holds no
status at all: the status pass is a second step and writes its own file. The
guard is armed in both, and it aborts.
