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
  the page is everything after it.
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
