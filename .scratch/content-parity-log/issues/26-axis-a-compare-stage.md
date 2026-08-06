# 26 — Build the Axis A compare stage

Type: task
Status: resolved
Resolved: 2026-08-06
Blocked by: 02, 05, 06, 07, 08
Parent: ../map.md

## Question

Nothing to decide. Build the comparison that turns two `PageExtract`s into a
`PageReport`: the text rules from ticket 02, the link rules from ticket 05 and
the image rules from ticket 06.

## Why this ticket exists

**It was missing from the map.** Tickets 02, 05 and 06 wrote the rules. Ticket 07
built the extractor. Ticket 08 built the Astro shell. Ticket 24 builds the
**Axis B** compare stage, and ticket 21 decides the meta check. Nothing built
Axis A.

The effect was invisible because every part looked done: `compare/` held
`contract.mjs` and its test, `data/reports/` did not exist, and
`web/src/pages/index.astro` rendered its own message — *"No reports in
`data/reports/`. Run the crawl and the comparison first."* Thirteen resolved
tickets, and no editor could open a single page.

Tickets 12, 23 and 10 were all waiting on data this stage was never asked to
produce.

## Answer

Built and committed, `tm-content-parity` `52387b1`, on branch
`axis-a-compare-and-log`. 101 tests green, static build green, 180 pages.

### What it is

| File | What it holds |
| --- | --- |
| `compare/match.mjs` | tier 2, the number mask, token overlap, LCS, the 0.6 pairing |
| `compare/text.mjs` | ticket 02: one alignment pass, both the rows and the findings |
| `compare/links.mjs` | ticket 05: comparative and absolute classes, kept apart |
| `compare/images.mjs` | ticket 06: set comparison, alt as parity only |
| `compare/findings.mjs` | ticket 02 grouping, ticket 01 ids, the summary the bars read |
| `compare/link-status.mjs` | the site-wide sweep: HEAD then GET, manual redirects, hop count |
| `compare/30-compare.mjs` | the stage, and the unit ticket 10 calls |
| `crawl/21-crawl-store.mjs` | a whole store, aborting on a maintenance page |

### Measured, nl store

- **179 pages crawled**, 1 excluded (ticket 19), 1 failed — `faq/offerte`, which
  is ticket 17's redirect loop, still failing.
- **124 comparable.** The same 124 ticket 06 counted independently, from the other
  direction. Two measurements agreeing is the first real corroboration this
  pipeline has had.
- **10,076 findings, 8,573 shown by default**, 11,417 raw occurrences.
- **Median 41 shown findings per page.** Worst: `fotogalerij/zonwering` 401,
  `fotogalerij` 395, `serre` 255. Best: `meettool` 6. **No page is clean.**
- 2,623 unique internal link targets checked: 10 broken, 209 redirecting.

By class, shown: `structure` 5,191 · `missing-link` 1,555 · `image-missing` 944 ·
`link-target` 272 · `copy` 270 · `casing` 221 · `alt-changed` 122 · `alt-lost` 89
· `broken-link` 45 · `leakage` 6. Hidden: `extra-link` 708 · `image-added` 617 ·
`image-campaign` 128 · `restructured` 27 · `campaign` 14 · `price` 7 ·
`redirect` 2.

`casing` at 221 answers ticket 02's open worry: letter case is **not** a
site-wide drift, so the log does not fill with it and the class stays as decided.

### Decisions the tickets did not give

1. **`restructured` never fires on unchanged text.** The LCS anchors on `norm`
   and ignores the tag, so text production held in a `<p>` and the new site holds
   in a `<td>`, unchanged, is an exact match and makes **no finding at all**.
   Ticket 02 defines the class as "the same content, built with a different
   element", which reads as though this should fire it. It does not, and that is
   right: the class is hidden and an editor has nothing to do about markup
   carrying the same words. In practice `restructured` means "the text differs
   **and** the element moved". 27 instances.
2. **Anchor identity for `link-target` is anchor text, and only when it is
   unique on both sides.** An element carries no DOM path, so nothing else is
   available. Two `Lees meer` links cannot be told apart, and a wrong pair asserts
   a target change that did not happen — so a repeated text falls through to
   `missing-link` plus `extra-link`, which are both true.
3. **`broken-link` and `redirect` are simply not emitted without a status map.**
   Every other link class needs no network. A guess about a 404 is worse than
   silence, so the stage runs without the sweep and says so.
4. **The class vocabulary moved to `compare/vocabulary.mjs`**, re-exported by
   `contract.mjs`. `findingId()` needs `node:crypto`, and a Vite build of a React
   island that reaches `contract.mjs` fails on that import. Ticket 08 made
   `contract.mjs` the one data contract; it still is for Node, and the browser
   takes the half it can run.
5. **A row is not a finding.** A finding is grouped — one rename repeated six
   times is one finding — and a row is a position, so `PageReport` carries both.
   The rows hold element **indices**, not copies of the text, which roughly halves
   a report on disk. Both come from one alignment pass, so the Diff tab and the
   count cannot drift apart.
6. **A one-sided page is still a report**, carrying `comparable: false` and a
   reason, so the dashboard shows it and says why. Ticket 07's status gate would
   otherwise make the page vanish, and absence is what let a broken parse run for
   a whole crawl.

### Found on the way

- **Production nests a `<style>` and a `<script>` inside an `<a>`.** That anchor
  holds no other text element, so it is a leaf, and `structuredText` handed the
  CSS and the JavaScript over as content: **151 elements on 23 of 179 pages**,
  every one a `structure` finding no editor can act on. Ticket 02 had measured
  that the chrome list removes no *element* inside `<main>` — true, and it misses
  this, because the question was never whether the text **inside** one bleeds
  into an ancestor that is in `TEXT_TAGS`. `script`, `style` and `noscript` now go
  before any text is read. `<template>` deliberately stays: the new site is
  Alpine-driven and renders what is inside it. Corrects ticket 02.
- **Ticket 02's own headline example does not pair.** `Kleuren:` →
  `Verkrijgbaar in de volgende kleuren:` scores **0.33**, so it does not pair at
  0.6 — nor would it have at the prototype's 0.55. It reports as two `structure`
  findings, each grouped to four occurrences. The grouping still does the work the
  ticket wanted; the pairing cannot, and the ticket's "one change counted many
  times" framing was about grouping all along.
- **`Bekijk alle deals` → `Bekijk alle FAQs` scores 0.67** and pairs, so ticket
  02's fix works end to end: it reads as one `copy` row, not as a loss and an
  addition at opposite ends of the page.
- **Category pages carry a product grid and a filter UI inside `<main>`.**
  `terrasoverkapping` reports product titles, prices, `1702 resultaten` and
  `sort-descending` as content. Graduated to ticket 27.
- **`structure` is 61% of everything shown**, and no page is clean. Graduated to
  ticket 28.
