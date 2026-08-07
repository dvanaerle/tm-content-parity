# 27 — Product listings and filter UI inside `<main>` on a category page

Type: grilling
Status: resolved — 2026-08-07, by the grilling session on the content unit
Blocked by: —
Parent: ../map.md

## Answer

**A category page stays in the log. The grid leaves it, as a region.** The boundary
between the log's business and the catalogue's business runs inside the page, exactly
as this ticket said, and the log now has a word for the two sides of it:
a **non-editorial region** is a region inside the content boundary whose text the
catalogue or an extension makes.

**Ticket 19's shape works for a region, and this ticket's objection decides where.**
The objection was right: the extract carries no DOM path, so a check cannot say "the
third section down". So the region goes **at extraction**, while the DOM still
exists, and a check stays ignorant of regions. A committed list holds the entries,
each with its selector, its reason, the pages it was measured on and the unit count it
removes.

**One selector cuts both hosts.** `#amasty-shopby-product-list` matches once inside
`<main>` on production and once on the new site, with byte-identical class strings
across `/overkapping`, `/carport` and `/veranda`, and it matches nothing on a home
page or a product page. It removes **50 units on production and 21 on the new site**,
and it takes the sorter, the pager and the result count with the tiles.

> **Corrected 2026-08-07 by ticket 63.** This paragraph said 69 and 48. Ticket 63
> re-measured with `crawl/probes/probe-excluded-regions.mjs` on both hosts and on all
> three pages, and got 50 and 21, the same on all three. The grilling numbers do not
> reproduce and the cause is not established. Everything else here held, including
> the "matches nothing on a home page or a product page" claim, which ticket 63
> checked against a live product page and four CMS pages.

The narrower
`.products-grid` also matches both hosts and removes 45 against 32; it was rejected
because it knowingly leaves about 40 machine-generated differences per page alive.

**`pageType` is not the hook.** It names a page kind, and the grid is a region inside
a page that is otherwise in scope. Hanging the rule on a class that Magento controls
would hide the question rather than answer it.

**Found while resolving, and it changes what this ticket was measuring.** The product
titles on production are in a tag the extraction never read, so production never had
them. The new site holds a whole tile in one anchor, so it does. The result is not a
symmetric noise problem: on `/overkapping` there are exactly **nine** invisible titles
on production and exactly **nine** phantom `text-added` rows on the new site. The log
was reporting invented content that was not invented.

**A guard comes with the mechanism.** The generic page-builder wrapper on production
looks like the right selector and is not — it wraps all CMS content, and excluding it
would have removed 358 of 359 units on `/downloads` and 95 of 96 on
`/showroom-contact`. So an exclusion above 20 content units throws. No editable region
on this site is that large.

**Left open on purpose: the USP strip.** It is template furniture that sits inside
`<main>` on this page and outside it on others, and it duplicates because production
ships a desktop and a mobile version of it. On the new site it sits inside the grid
container, so the exclusion above already takes it. On production its position
relative to that container is not measured. The duplication half goes to ticket
[69](69-one-canonical-viewport.md); if the production strip survives the grid
exclusion, it needs its own entry in the list and its own measurement. Do not add one
blind.

Built by ticket [63](63-regions-excluded-at-extraction.md). The decision is recorded
in `docs/adr/0003-regions-are-excluded-at-extraction.md`.

## Question

A category page holds a product grid and a filter UI inside `<main>`. Both are
inside the content boundary, so the log reports them as content. Is that in scope,
and if not, what removes them?

## The evidence

`terrasoverkapping`, 245 shown findings, the fourth worst page in the store. Its
Diff tab reports, as `structure`:

- product titles with sizes and prices — `Heavy Duty terrasoverkapping Tijdloos in
  mat zwart van 6.06 x 3 meter met glazen dak 6,06 meter x 3,00 meter Tijdloos Mat
  zwart (RAL 9005) Helder glas € 2.952 Bekijk product`
- filter option labels — `5.06 x 2.5 meter`, `8.06 x 3.5 meter`, `12.06 x 4 meter`
- filter machinery — `1702 resultaten`, `sort-descending`
- USP strip copy — `Laagste prijs garantie`, `Gratis thuisbezorgd en korte
  levertijd`, `365 dagen per jaar open & bereikbaar`, each ×2

## Why it is a real question

**Product detail pages are already out of scope** — the map rules them out,
because the Magento catalogue owns them. A product *grid* is the same data
rendered on a page that **is** in scope. So the boundary between "the log's
business" and "the catalogue's business" does not run along the page, it runs
inside it.

Three of the four kinds above are not editorial content at all:

- A **filter label** is generated from catalogue attributes. Nobody writes it, and
  a difference in it means the two environments hold different catalogue data —
  the same reason ticket 02 masks numbers for `price`.
- `1702 resultaten` is a **count**. It will differ on every crawl.
- The **USP strip** is template furniture. It survived only because it sits inside
  `<main>` on this page and outside it on others.

A **product title** is more awkward: an editor does not write it either, but a
missing product is a real migration defect — and it is exactly the defect
`missing-page` and the Coverage view were built for, one level up.

## What to settle

- **Does a category page belong in the log at all**, or is it a page kind like
  ticket 19's application page — in the log for its editorial blocks, out of it
  for its grid?
- **If it stays, what is the grid?** Ticket 19 set the precedent that a page kind
  can be excluded by a committed list of exact keys with reasons, never a pattern
  and never a detection rule. Does the same shape work for a *region* of a page,
  or does a region need something the extractor does not have — the extract carries
  no DOM path, so a check cannot say "the third section down".
- **`pageType` already exists** in the contract, read from the `<body class>`, and
  `catalog-category-view` is one of its values. Is that the honest hook, or does
  it hide the question behind a class name that Magento controls?
- **The USP strip.** It is chrome that happens to sit inside `<main>`. Ticket 02
  retired the chrome list inside the boundary on the evidence that it removed
  nothing — evidence that ticket 26 has already shown to be incomplete once.
## Already measured

Shown findings by `pageType`, over the 124 comparable pages:

| pageType | pages | shown | per page | of which `structure` |
| --- | --- | --- | --- | --- |
| `cms-page` | 106 | 5,674 | 54 | 3,330 |
| `category` | 17 | 2,838 | **167** | 1,686 |
| `other` | 1 | 61 | 61 | 33 |

So a category page is **three times as dense** as a CMS page, and 17 pages — 14%
of the store — carry **33%** of everything shown. But they do not explain the
volume: take every category page out and 5,735 findings remain across 107 pages,
and `structure` stays at 59% of the total either way.

**This ticket and ticket 28 are therefore separate questions.** Resolving this one
removes a third of the volume at most.

## Notes

Resolve with `/grilling` and `/domain-modeling` — "content unit" and "page kind"
are both about to gain a qualifier.

The reports are in `data/reports/`. The 17 category pages are the ones whose
`sides.production.pageType` is `category`.
