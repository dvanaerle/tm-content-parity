# 10 — Re-check service

Type: task
Status: resolved
Blocked by: 07, 08, 09, 19, 26
Parent: ../map.md

## Question

Nothing to decide once 07, 08 and 09 are settled. Build the local Node service
that re-crawls one page on both sites and returns fresh findings.

## What it must do

- `POST /api/recheck/<store>/<slug>` — fetch both URLs, run the extractor and the
  comparison, return the new finding set. Plain `fetch` is enough for both sites,
  so this is fast; the probe did 37 URL status checks in 1.1 seconds.
- Merge the fresh findings with the Supabase override log, applying the precedence
  ticket 09 settles.
- Report per finding what changed: closed by re-check, still open, or newly
  appeared.
- Serve the built static app too, so one command gives the whole tool locally.

## The two-mode split

The webhosting runs no server code, so the uploaded snapshot is read-only. The app
must **feature-detect the API and hide the Recheck button when it is absent**,
without breaking anything else. Overrides still work in the hosted copy, because
they go straight to Supabase from the browser.

## Traps

- Neither site sends CORS headers, and both send `X-Frame-Options: SAMEORIGIN`, so
  the browser can never do this itself. That is why the service exists.
- The new site has **no `/sitemap.xml`** — 404, and its 404 page is 335 KB of HTML.
  Trust status codes, not body size.
- Playwright's `screenshot({ path })` needs a **string**, not a `URL` object. It
  fails silently with a `URL`. Only relevant if screenshots come back.

## Updated 2026-08-06 by ticket 26

The unit to call now exists and is not to be re-implemented:

- `extractStorePage()` in `crawl/20-extract.mjs` gives both `PageExtract`s.
- `comparePage({ sides, newSitePaths, statuses })` in `compare/30-compare.mjs`
  gives the `PageReport`. It needs `newSitePathsFor(seeds, store)` for `leakage`,
  which reads the seed file and touches no network.
- `checkAll(urls)` in `compare/link-status.mjs` status-checks a list with a cold
  cache. Ticket 05 says re-check sweeps **only that page's** targets, deduplicated
  within the page — not the site.

So the service is a thin HTTP wrapper plus the Supabase merge, and the front end
needs the feature detection that hides the button in the hosted copy. The built
page footer currently states in plain text that the button is not in this build.

## Covered by the spec in ticket 29

2026-08-06. [29 — Spec: make the log actionable](29-actionable-log.md) is the build
instruction. It carries the user stories, the seam, the schema and the testing
decisions for the re-check service. Read 29 before starting; this ticket keeps the reasoning.

## Answer

**Built by ticket 29. Closed as resolved in the triage of 2026-08-07.** Nothing
in this ticket is open. The code is:

- `api/server.mjs` — `POST /api/recheck/<store>/<page>` re-crawls one page on
  both sites and returns the fresh report. `/api/health` is the probe. The same
  server serves `dist/`, so one command gives the whole tool.
- `npm start` in `package.json` runs it.
- `web/src/lib/recheck.mjs:16` — `probeHealth()` is the feature detection. The
  hosted copy has no API, so the probe fails and the Recheck button is absent.
  This is the two-mode split this ticket asked for.

The Supabase merge and the precedence rules are in `overrides/state.mjs`, which
ticket 29 built as a pure derivation. Read ticket 29 for the numbers and the five
decisions it took beyond the spec.
