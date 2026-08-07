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
      requests** — be 126, de 45, uk 42, be_fr 29, fr 28. **Landed as 269 rows and
      be 125.** `be/faq/offerte` is the one loss, to the production redirect loop
      of ticket [17](17-faq-offerte-redirect-loop.md). The number in this line is
      the estimate; the table below is the measurement.
- [x] **`/` is a doorway and not a dashboard.** Added by the review of this ticket,
      2026-08-07: the work removed the all-stores dashboard, and no criterion said
      it could. It follows from the criterion below — the old `/` loaded all six
      stores into one screen — but the removal is a decision and `CONTEXT.md` now
      carries it, so it is written here where a reader can find the reason.
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
survived it. `21-crawl-store.mjs` gained a `main` guard and a `failuresFilename()`
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
prefactor. It is fixed by usage and not by code here, because the file has no
store dimension to give it — a target's status is a fact about the target. The
review of this ticket asked for more than a warning in prose, so ticket
[59](59-link-status-overwrite.md) is open on it.

**There is no all-stores dashboard.** A store is the unit an editor is responsible
for. So `/` lists the stores and waits. It moves nobody on.

The first version sent the reader to the first store with a meta refresh. The
review found the refresh set to zero seconds, which made the list unreadable and
turned `/` into a back-button trap: back from a dashboard landed on `/` and was
pushed forward again. The delay is gone, and with it the reason to compare the page
with `Astro.redirect`.

**The switcher goes to the dashboard of the store, never to the same page in
another store.** The stores translate the category url keys (ticket 04), so "this
page over there" often does not exist.

**The store id is the label, and the Dutch country name is the title.** The id is
the word the whole tool uses — `CONTEXT.md` gives it, the report filenames carry
it and an override is keyed on it. `web/src/lib/stores.mjs` holds the names.

**The dashboard states the crawled total, not only the comparable one.** The
chips start at *pagina's vergeleken*, which counts comparable pages. On nl the gap
is 179 to 124. Nobody reads 124 as the size of the store. On `fr` the gap is 28 to
25, and the first reader to arrive through the switcher did read 25 as the whole
store. So the store line now says how many pages were crawled, how many can be
compared, and why the rest cannot. The chips and the bar are untouched. Ticket 09
keeps one-sided pages out of the denominator and that has not changed.

**A store's excluded pages are its own.** `veranda-configurator` is nl only, so a
German dashboard that reported one page *niet gecontroleerd* was counting another
store's page. `excludedFor(store)` reads the seed file: nl 1, every other store 0.
The condition it reads a cell with is the crawler's own, in
`crawl/seed-rows.mjs` — see the review follow-up.

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

So the number is not zero and [49](.out-of-scope/49-be-fr-shared-host-blind-spot.md)
was opened with a recommendation of wontfix. No rule was written. **Triage took
that recommendation on 2026-08-07**: 49 is `wontfix`, and it carries a trigger to
run the probe again after ticket 55, which takes be_fr from 29 pages to about 110.

Found beside it: **production** links out of the French store on all 29 be_fr
pages, 29 of them to the same Dutch category page. That is a storefront defect
and the log's output, so it belongs in `devdva02`, not on this map. Recorded in
49.

## Review follow-up, 2026-08-07

The two-axis review of `5dff1d4..HEAD` found twelve things. Seven were fixed in the
same session, two are new tickets, and three are recorded here.

**One condition for "the store has this page", and it is the crawler's.** The
crawler wanted both urls in a cell. `excludedFor()` in the web build wanted the
production url alone. One rule asked two ways, so the two could name different
pages: a page with production and no counterpart was excluded by the dashboard and
never excluded by the crawler. `crawl/seed-rows.mjs` now holds
`cellWithBothSides()`, both call sites read it, and it has a test.

The divergence was **latent**, not live. `veranda-configurator` is the only
excluded page, and it carries both urls on nl and empty strings on the other five,
so every store's count was right before the fix and is the same after it: nl 1,
the rest 0. The defect was in the rule, not yet in the numbers.

**The rules with judgement in them have tests now.** `storesFromFilenames()` — which
stores get a route and a switcher entry — and `excludedInStore()` are pure and
tested, and the file reads around them are the thin part. `AGENTS.md` asks for this:
a rule with no test is not a rule. 270 tests pass.

**`web/src/lib/stores.mjs` no longer keeps a second list of stores.** It named the
six ids as its own keys, so a seventh store on `STORES` would have reached the
switcher with a `title` of `undefined`. `STORE_NAME` is now built from `STORES`, and
a store with no Dutch name stops the build.

**The switcher reads the report folder once for the whole build, not once per
page.** `storesInLog()` was a `readdir` in the shell, and the shell is on all 455
pages. The list is build-constant, so it is held. A store crawled while the dev
server runs needs a restart to appear.

**Dropped: the `crawlStore()` export and its options object.** Only the `main` guard
in the same file calls it, and the options object carried one flag. The export was
`failuresFilename()`'s doing, and that one is still exported and still tested.

**Not this ticket's work.** The `ClassPill` and `BANNER` rename in `Dashboard.jsx`
belongs to the review of ticket 36 and is recorded there.

### Opened by this review

- [59](59-link-status-overwrite.md) — `link-status.mjs` erases the other stores.
- [60](60-report-filename-in-the-contract.md) — the `<store>__<page>.json` shape is
  crawl-to-web data with no home in `compare/contract.mjs`.
