# 31 — Bulk dismissal across pages

Type: build
Status: ready-for-agent
Blocked by: 30
Parent: ../map.md

## Question

Ticket 09 says bulk is a UI action:

> Dismissal stays page-scoped; **bulk is a UI action that writes N events**, not a
> third key.

Spec 29 carried the user story:

> I want to dismiss the same difference on all thirty pages that carry it, so
> that one footer line is one decision.

It is the one story in spec 29 that shipped as nothing. The code review of the
spec-29 work found it, and found that the seam makes it impossible as built.

## What blocks it

Two places in `web/src/lib/overrides.mjs`:

- `useOverrides()` reads **one page**: `port.readEvents({ store, page })`.
- `append()` fixes the place: `port.appendEvent({ store, page, editor, ...partial })`
  takes the store and the page from the current report, so a caller cannot aim an
  event at a different page.

So a cross-page action has no path today, and adding one is a change to the seam
and not to a component.

## What must stay true

- **No third key.** Ticket 09 is explicit: bulk writes N page-scoped events. The
  table gets N rows. Do not add a site-wide scope.
- **A note is mandatory on `dismissed`.** One note, copied to all N rows, is
  correct — the SQL constraint refuses a row without one anyway.
- **Every row carries the editor.** Attribution is per row, as now.
- **A partial failure must be loud.** N inserts can fail after the third. The log
  never drops a click silently, and "23 of 30 saved" is the honest report.

## What has to be decided

1. **How the editor finds the other pages.** The same difference on thirty pages
   is thirty finding ids, because a finding id is page-scoped by ticket 01. So
   the tool must group them, and the grouping key is not yet named. The candidate
   is `(check, rule, prodNorm, newNorm)` — the finding id with the page removed.
2. **Where the control lives.** The page ledger knows one page. A cross-page
   action needs a view that already holds many, which is the dashboard, or a new
   "this difference, everywhere" view.
3. **Whether a mute is the better answer for most of these.** `muted` is already
   page-plus-class and persists across re-crawls. If the thirty footer lines are
   one class on thirty pages, thirty mutes may be the honest record and bulk
   dismissal may be rarer than the story implies. Measure before building.

## Notes

Point 3 could shrink this ticket to nothing, so resolve it first. The measurement
is available: `data/reports/` holds every finding on 180 pages, and the count of
findings whose `(check, rule, prodNorm, newNorm)` repeats across pages is a
script, not a decision.
