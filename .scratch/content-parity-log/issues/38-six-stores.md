# 38 — Six stores, not one

**What to build:** an editor responsible for the German store opens the German
store. A switcher in the shell moves between `nl`, `be`, `be_fr`, `de`, `fr` and
`uk`; the store is in the URL, so a link to the French dashboard can be sent to a
colleague; and each store carries its own progress numbers.

Today the tool is nl only — not because the code is nl-specific, but because
nobody has run it. The crawl, extract, compare, link-key and report-naming paths
are all already store-generic, and the seed data holds a production URL and a
new-site URL for all 451 store pages. The gap is data and one missing route.

**Blocked by:** None — can start immediately. It needs nothing from tickets
33–37 and can run alongside them.

**Status:** resolved 2026-08-07

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 7.

- [x] **Fix the failure-log overwrite first.** The extract failure file is one
      fixed filename that every run overwrites, so a `be` run erases the nl
      record — which today holds the `faq/offerte` redirect loop. Make it per
      store. This is a prefactor: do it before any other store is crawled.
- [x] **Verify production is not in maintenance before each run.** The crawler
      aborts loudly on a 500 or 503, which is correct behaviour; all ten hosts
      answered 200 on 2026-08-06, and the `prodMaintenance` flags in the seed
      data are stale and must not be trusted.
- [x] The five non-NL stores are crawled and compared: **270 rows, 540
      requests** — be 126, de 45, uk 42, be_fr 29, fr 28.
- [x] A dashboard route per store, with a switcher in the shell that navigates to
      it. The page-level route already carries the store; the dashboard is the
      only place that does not.
- [x] Each store's page carries only that store's summaries, so a visitor does
      not download six stores to read one.
- [x] Each store carries its own progress numbers.
- [x] **Axis A only** — production against the new site *within* one store. Axis
      B, NL against the other stores, stays unbuilt and is not touched here.
- [x] The interface stays **Dutch** on every store. The log's question is whether
      two strings match, which needs no comprehension of either.
- [x] **Measure the be/be_fr shared-host blind spot and write the number into
      `map.md`.** `cross-store-link` compares hosts and those two stores share
      one, so a French page linking into a Dutch Belgian page is not flagged.
      Count how many be_fr anchors actually point at a non-`/fr` path on the
      shared host. **Open a follow-up ticket only if the number is not zero** —
      do not write a rule against a hypothetical.
- [x] Per-store results recorded in `map.md`: crawled, comparable, and shown
      findings for each of the five.

## What was built

**The prefactor first, and it proved itself in the run.** The failure log is
`data/extract-failures-<store>.json`. The `be` crawl then failed on `faq/offerte`
in exactly the way `nl` does — the redirect loop of ticket 17 — and the nl record
survived it. `21-crawl-store.mjs` gained a `main` guard and a `crawlStore()`
export so the filename rule is testable, which is the idiom `20-extract.mjs`
already used.

**Production was verified live, not from the seed file.** All ten hosts answered
200 immediately before the crawl. No `MaintenanceError` was raised in 538
requests, so no run aborted and the stale `prodMaintenance` flags were never
consulted.

**The results.** 269 of 270 rows crawled — `be/faq/offerte` is the one loss, and
it is a production defect that already has a record.

| store | crawled | comparable | findings | shown | median shown |
|---|---|---|---|---|---|
| nl | 179 | 124 | 10,796 | 7,456 | 37 |
| be | 125 | 117 | 9,690 | 6,562 | 34 |
| de | 45 | 42 | 4,166 | 2,830 | 38.5 |
| uk | 42 | 40 | 5,137 | 3,642 | 40 |
| be_fr | 29 | 25 | 2,582 | 1,762 | 28 |
| fr | 28 | 25 | 2,539 | 1,709 | 27 |
| **all six** | **448** | **373** | **34,910** | **23,961** | |

**Every nl number held exactly** — 179 / 124 / 10,796 / 7,456 / median 37, ticket
34's baseline to the finding. Adding five stores adds no rule, so movement would
have been a defect.

## Decisions the ticket did not give

**`link-status.mjs` must be given no store.** It writes one file keyed on the
absolute URL and it **overwrites** that file, so `node compare/link-status.mjs be`
erases nl's statuses and the next nl compare reports no `broken-link` and no
`redirect`. Run it over every crawled store at once: 9,119 unique targets, 56
broken, 530 redirected. This is a second overwrite of the same shape as the
prefactor, and it is fixed by usage rather than by code, because the file has no
store dimension to give it — a target's status is a fact about the target.

**There is no all-stores dashboard.** A store is the unit an editor is
responsible for, and `/` is a doorway that lists the stores and sends the reader
to the first one. It is a page with a meta refresh and not `Astro.redirect`: the
static redirect Astro generates is English and waits two seconds, and the
interface is Dutch on every store.

**The switcher goes to the dashboard of the store, never to the same page in
another store.** The stores translate the category url keys (ticket 04), so "this
page over there" often does not exist.

**The store id is the label, and the Dutch country name is the title.** The id is
the word the whole tool uses — `CONTEXT.md` gives it, the report filenames carry
it and an override is keyed on it. `web/src/lib/stores.mjs` holds the names.

**The dashboard states the crawled total, not only the comparable one.** The
chips start at *pagina's vergeleken*, which counts comparable pages. On nl the
gap is 179 to 124 and nobody reads 124 as the store; on `fr` it is 28 to 25, and
the first reader to arrive through the switcher read 25 as the whole store. So
the store line now says how many pages were crawled, how many can be compared,
and why the rest cannot. The chips and the bar are untouched — ticket 09 keeps
one-sided pages out of the denominator and that has not changed.

**A store's excluded pages are its own.** `veranda-configurator` is nl only, so a
German dashboard that reported one page *niet gecontroleerd* was counting another
store's page. `excludedFor(store)` reads the seed file: nl 1, every other store 0.

## Measured: the payload per store

The build reads one store's report files for one store's dashboard, so a visitor
downloads the store they opened.

| | nl | be | uk | de | be_fr | fr |
|---|---|---|---|---|---|---|
| dashboard HTML | 1,087 KB | 925 KB | 470 KB | 394 KB | 254 KB | 246 KB |

455 pages built: 448 store pages, 6 dashboards and the doorway.

## The be/be_fr blind spot

Measured over all 29 be_fr pages by
`crawl/probes/probe-be-fr-shared-host.mjs`. On the new side — the only side
`cross-store-link` reads — **14 anchors on 5 pages** point outside `/fr` on the
shared host, and **13 of those are shared `/media/` files**, not pages. The one
page link is `/blog`, which is out of scope for the log.

So the number is not zero and [49](49-be-fr-shared-host-blind-spot.md) is open,
`needs-triage`, with a recommendation of wontfix. No rule was written.

Found beside it: **production** links out of the French store on all 29 be_fr
pages, 29 of them to the same Dutch category page. That is a storefront defect
and the log's output, so it belongs in `devdva02`, not on this map. Recorded in
49.
