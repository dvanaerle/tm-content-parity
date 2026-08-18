# 69 — One canonical viewport, and the duplicate versions go

**What to build:** production sends the desktop and the mobile version of a block in
the same HTML. The log reads a page at one width and stops comparing the other
version.

The extraction has no computed style, so it cannot see that a block is hidden. It
reads both. Measured inside `<main>` on production: `/downloads` holds 40 duplicated
strings, 28 of them under a class that hides one copy; each category page holds four,
three of them in the banner. So the duplication is mostly the banner, and ticket 64
removes that part. What is left is small and real — a layered-navigation label
duplicates on every category page — and it is the part this ticket is for.

`CONTEXT.md` now states the canonical viewport. This ticket makes the statement true
in the code.

Blocked by: 64.

Status: resolved 2026-08-18 on `ticket-104-search-page-scope` — all five criteria met, and
the close-out option in criterion 4 was measured and declined. Criterion 3 shipped wider
than written: a class convention alone is not enough, and the rule names a width and each
convention's framework. See `## Answer`.

**Origin:** the grilling of 2026-08-07 on the content unit, question 20.

- [x] The canonical viewport is desktop, and one place in the code says so.
- [x] A unit that is hidden at the canonical viewport is not extracted.
- [x] The rule is by class convention, and the conventions it covers are listed with
      the pages they were measured on.
- [x] Measure the residual duplication **after** ticket 64. If the banner removal
      leaves almost nothing, say so and close this ticket rather than build a rule for
      one label.
- [x] The consequence is stated where a reader will meet it: the log does not check
      the mobile version of a page.

---

## Answer

**Built, 2026-08-18.** `CONTEXT.md`'s claim is now true in the code, and the ticket's own
escape hatch — *if the banner removal leaves almost nothing, close this rather than build
a rule for one label* — was measured rather than assumed. It was declined, on the numbers
below.

`shared/canonical-viewport.mjs` is the one place that says which width. `crawl/extract.mjs`
cuts the copy, `compare/contract.mjs` carries the count, the store dashboard states the
consequence, and `docs/adr/0020-the-log-reads-one-viewport.md` records the decision.

### What the residual duplication actually was

Criterion 4's measurement, taken **after** ticket 64, and it does not say what the ticket
expected:

- **Duplication as such is large and mostly legitimate.** Over the committed 816-page
  corpus: **3,612 duplicate copies, 10.4% of 34,766 units, on 495 pages.** Almost none of
  it is responsive. It is product tiles that each say `Stel nu samen`, a RAL colour table,
  `09:00 - 16:30 uur` beside each showroom, and one `Download de montagehandleiding` per
  product. A text-level dedupe would have deleted real content, which is why the rule is
  by markup and not by text.
- **Responsive duplication is real and it is not one label.** `/downloads` sends a table
  for a desktop and a card list for a phone, in all six stores. The rule removes **1,318
  content units on 264 of 816 pages**.
- **The ticket's own example is already gone.** The layered-navigation label it named as
  the residual now leaves with `.filter-content`, the region entry added after this ticket
  was written. Measured in the pipeline, the theme's own `.hidden-lg` control removes
  **0** units for exactly that reason, which is why it earns no entry in the list.

So the close-out was declined: 1,318 units and 1,091 findings is not one label.

### Measured, whole corpus, both hosts

`crawl/probes/probe-canonical-viewport-corpus.mjs`, 816 of 819 comparable pairs (three
errors: `uk/(uk)measuring-tool` has no content inside the boundary, and `faq/offerte` on
`nl` and `be` answered a transport error, as it did for ticket 64).

| | before | after | change |
| --- | ---: | ---: | ---: |
| findings | 41,182 | 40,091 | **−1,091 (−2.65%)** |
| work | 22,112 | 21,038 | −1,074 |
| units removed, production | — | 1,318 | on 264 pages |
| units removed, new site | — | **0** | on every page |

Findings gone, by class: `text-missing` 842, `image-missing` 175, `missing-link` 89,
`extra-link` 32, `alt-lost` 22, `copy` 11, `alt-changed` 10, `tag-changed` 8,
`restructured` 6, `heading-level` 4, `link-target` 1, `casing` 1.

**110 findings appeared**, and they are the pairing correcting itself, as ticket 64's 23
were: `link-target` 37, `alt-lost` 22, `text-added` 21, `copy` 13, `restructured` 5,
`extra-link` 4, `alt-changed` 4, `heading-level` 2, `missing-link` 1, `image-added` 1. The
`link-target` rows are the useful ones — a production mobile copy was absorbing the new
site's PDF link, so a genuine difference in the target was invisible. A row that appeared
is a row the second copy was hiding.

### The premise, checked in a browser

The extraction has no computed style, so it cannot test the thing the whole rule rests on.
`crawl/probes/probe-canonical-viewport-visible.mjs` renders at 1,280 pixels and reads
computed style: over the 19 widest pairs the conventions match **119 elements and 0 of them
are visible**. That is the acceptance test, and no earlier number in this ticket could
substitute for it.

### Two things this ticket got wrong, and one thing I did

1. **"The duplication is mostly the banner, and ticket 64 removes that part. What is left
   is small and real."** Half right. The banner was removed and what is left is *not*
   small: 1,318 units. The ticket's own measurement of "four duplicated strings per
   category page, three of them in the banner" was of `<main>` before two region entries
   existed, and it does not survive them.
2. **The ticket asked for a rule "by class convention" and stopped there.** A class name is
   not enough, and following it is what broke the first version of this work. A breakpoint
   utility hides a block inside a **band**: Magezon's `mgz-hidden-lg` covers 992–1200px
   only, so a block marked with it *is* visible to a desktop reader. The theme is
   Bootstrap 3, where `.hidden-lg` means `min-width: 1200px` — **the same token, the
   opposite answer, on the same page.** The rule therefore names a width, and the list
   names each convention's framework and quotes the band from production's stylesheet.
   `validateConventions()` refuses an entry with no framework.
3. **I published a wrong number on the way.** Mid-work I recorded that the first selector
   dropped "504 texts of real desktop copy". It did not: correcting the selector moved 18
   texts, and the 504 were overwhelmingly content that is invisible at 1,280 pixels
   anyway — behind a closed modal or a collapsed accordion. `lostEntirely` measures "this
   exact string left the extract", which is not the same as harm, and only the browser
   probe could tell the two apart. The ADR carries the corrected account rather than the
   tidy one.

### What this opened

`probe-canonical-viewport-visible.mjs` measured the converse and found a larger blind spot
than this ticket closes: **617 content units on those 19 pages are invisible at 1,280
pixels and no convention reaches them** — behind `tm-modal-content`, inside
`mgz-panel-body`, or in the product-grid paginator. They are compared today, which
over-reports and is safe. Hiding by interaction is not hiding by width and must not join
this list: [137](137-hidden-for-a-reason-that-is-not-a-width.md).

### Not done

- **No coverage verdict for a convention that stops matching.** ADR 0003's regions get one
  from `compare/region-coverage.mjs`; a convention does not. A Magezon upgrade that renames
  the utility would silently return every second copy as `text-missing` — the
  over-reporting direction, so safe, but unreported at the crawl and a run late on the
  dashboard. Recorded in ADR 0020 as a gap rather than fixed here, which matches the
  asymmetry ADR 0003 already records for `capBreachMessage`.
- **`data/extract/` was not re-crawled.** The stored corpus predates this rule, so its
  extracts have no `hiddenAtViewport` and still hold both copies. A re-crawl detaches
  overrides (ticket 67's subject), so the numbers above come from probes that write nothing
  under `data/` except their own result.
