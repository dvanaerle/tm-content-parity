# 46 — Crawl the other five stores

Type: task
Status: closed — duplicate of 38
Blocked by: —
Parent: ../map.md

> **Closed 2026-08-06, on the day it was written.** Written by `/to-tickets` for
> axis B, at the same hour that a parallel session wrote
> [38 — Six stores, not one](38-six-stores.md) for spec 32. The two ask for the
> same run: the five non-NL stores, both sides, 270 rows and 540 requests.
>
> **Ticket 38 wins.** It is the better ticket. It carries a prefactor this one
> missed — `data/extract-failures.json` is one fixed filename that every run
> overwrites, so a `be` run would erase the nl record that today holds the
> `faq/offerte` redirect loop — and it adds the per-store dashboard route.
>
> Axis B tickets 42 and 45 are blocked by **38**, not by this.
>
> Kept for the two notes below, which ticket 38 does not say.

## What it asked for

`data/extract/` holds one store: nl, 179 files. Every per-page axis B check needs
the other five. Pages per store, from the seed file: be 126, de 45, uk 42,
be_fr 29, fr 28.

Crawl **both sides**. Axis B reads the new site only, so one side would be enough
for this axis. But the map wants a six-store data model, and a second full crawl
later costs more than the extra requests now.

## Notes worth keeping

- **Production goes into maintenance mode without warning.** A `MaintenanceError`
  stops the whole run, which is the guard working. Run it again later; do not
  work around it.
- The crawler skips a null cell already, because a page that is not in a store's
  sitemap has no url to fetch. That is axis B's subject, not a crawl target.
- The run is idempotent. `--force` re-crawls.
- `compare/link-status.mjs` is a separate stage and is not needed for axis B.
  Axis B does not check links: ticket 11 removed that check, because the stores
  translate the url keys and a path that differs is the normal case.
