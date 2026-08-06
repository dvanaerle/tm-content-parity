# 35 — Crawl the other five stores

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately
Parent: ../map.md

## What to build

`data/extract/` holds one store: nl, 179 files. Every per-page axis B check needs
the other five. This ticket is the long pole, and it blocks nothing that comes
before it, so start it early and let it run.

Crawl **both sides**, with `crawl/21-crawl-store.mjs` unchanged. Axis B reads the
new site only, so one side would be enough for this axis. But the map wants a
six-store data model, and a second full crawl later costs more than the extra
requests now. Axis A gains five stores as a side effect.

Pages per store, from the seed file: be 126, de 45, uk 42, be_fr 29, fr 28. That
is 270 store pages and about 540 requests.

## Acceptance criteria

- [ ] `data/extract/` holds six store directories.
- [ ] `data/extract-failures.json` is read, and every failure has a cause.
- [ ] `node compare/30-compare.mjs` gives axis A reports for all six stores.
- [ ] The dashboard lists six stores.
- [ ] The nl numbers do not move: 179 crawled, 124 comparable, 8,573 shown.

## Notes

- **Production goes into maintenance mode without warning.** A `MaintenanceError`
  stops the whole run, which is the guard working. Run it again later; do not
  work around it.
- The crawler skips a null cell already, because a page that is not in a store's
  sitemap has no url to fetch. That is axis B's subject, not a crawl target.
- The run is idempotent. `--force` re-crawls.
- `compare/link-status.mjs` is a separate stage and is not needed for axis B.
  Axis B does not check links: ticket 11 removed that check, because the stores
  translate the url keys and a path that differs is the normal case.
