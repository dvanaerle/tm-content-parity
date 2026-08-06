# 27 — Product listings and filter UI inside `<main>` on a category page

Type: grilling
Status: open
Blocked by: —
Parent: ../map.md

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
