# 17 — Redirect loop on `faq/offerte` (nl and be)

Type: task
Status: closed — out of scope
Blocked by: —
Parent: ../map.md

## Question

`faq/offerte` on the **nl** and **be** stores answers with a redirect loop on the
new site. `fetch` fails with a TypeError, "redirect count exceeded". Find the
cause and fix it.

This is a live defect on a page that is supposed to exist, so it is not one of
the 34 known legacy-only 404s.

## Evidence

Found while resolving ticket 05, in a sweep of all 451 store-page pairs:

- 415 pages answered 200.
- 34 answered 404 — all known legacy-only pages.
- **2 failed to answer at all**: `faq/offerte` on nl and on be. Both are redirect
  loops.

The other four stores were not affected: `faq/offerte` is not in their page
lists, so the loop may exist there too and simply was not requested.

Reproduce with
`.scratch/sitemap-content-overview/_scripts/probe-link-leakage.mjs`, or directly:

```
curl -sIL https://valanticnl.intern.systems/faq/offerte
```

## What to settle

- Where the loop comes from: a Magento url rewrite, a store-view redirect, or a
  trailing-slash rule.
- Whether de, fr, uk and be_fr have the same page and the same loop.
- Whether the crawler must treat a redirect loop as its own page status, apart
  from a 404. Any run that cannot fetch a page records no findings for it, which
  silently reads as parity.

## Notes

Ticket 05 decided that non-200 page statuses are **not** Links findings — they
are page-level status. So the fix belongs here, and the crawler-side handling of
an unfetchable page is part of this ticket.

## Closed: out of scope for this map

2026-08-06. This is a defect **on the storefront**, not work on the log. It is the
log's output, so a map ticket for it would never close by getting closer to the
destination. Recorded in [../storefront-defects.md](../storefront-defects.md) and
closed here. It needs an owner in the `devdva02` storefront work.
