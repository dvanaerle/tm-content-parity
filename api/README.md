# api — the re-check service

`server.mjs`. Plain Node, no framework, no Playwright.

    node api/server.mjs [port]        # default 4321
    npm start                         # build the front end, then serve it

- `GET /api/health` — its only job is to exist. The front end probes it once and
  renders the Recheck button only if something answers, so on the webhost the
  button is **absent** rather than broken. Feature detection, not configuration:
  the same static files are the hosted snapshot and the local copy.
- `POST /api/recheck/<store>/<page>` — one page, both sites, one fresh
  observation. A page key may hold a slash, so the store is the first segment and
  the page is everything after it. The report is written to `data/rechecks/`
  **before** the answer goes out.
- `GET /api/recheck/<store>/<page>` — the saved re-check of that page, or `404`
  when there is none. Same path, same split of store and page. It answers with
  the saved report or with nothing, never with the crawl report: the built page
  already carries that one, and a report holds both extracts.
- Everything else is served from `dist/`, so one command gives the whole tool.

It exists because **neither site sends CORS headers**: a browser cannot fetch
either of them, so a local service is mandatory and the hosted snapshot can never
re-check.

A re-check reuses `extractStorePage()` and `comparePage()` — neither is
re-implemented — and checks link status on **that page's** targets only, with a
cold cache. Ticket 05 forbids a site-wide sweep from a button press.

A `MaintenanceError` becomes a plain refusal with its reason, never a result.
Ticket 04: production goes into maintenance mode without warning, and a run that
records the maintenance page records phantom defects.

## The two folders

The crawl writes `data/reports/`. A press of Recheck writes `data/rechecks/`
beside it and never over it. `compare/measure.mjs` reads the crawl reports and
the corpus totals in `map.md` come from them, so one editor's ad-hoc look at one
page must not move a measured baseline (ticket 28). Both folders name a file with
`reportFilename()`, thus one page has at most one file in each.

The newer of the two wins, and the crawl wins a tie: a crawl that runs after a
re-check makes the re-check stale, and the page goes back to the crawl. The stale
file is ignored and **not** deleted, because it is evidence of what the two sites
said at that minute. `chooseReport()` in `web/src/lib/recheck-choice.mjs` is that
rule, and it has its own test.

This is the **page view only**. The store dashboard and the home page are built
from the crawl reports and keep the built snapshot until the next `npm run
build`. That limit is deliberate. `data/` is not in git either, so a missing
folder and a missing file are the normal case on a fresh clone.

The page header comes from the build and not from the island, so the store, the
two links and the element chips stay crawl data on a restored re-check, exactly
as they do after a live press. The footer says which report the findings below it
came from.
