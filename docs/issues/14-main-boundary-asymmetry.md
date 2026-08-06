# 14 — Content outside `<main>` on the new site

Type: research
Status: resolved
Resolved: 2026-08-06
Blocked by: —
Parent: ../map.md

## Question

The new site holds approximately 8 text elements outside `<main>` that the
chrome rules do not remove. Production shows no such difference: there, the
`main` root and the stripped `body` root agree exactly.

Measured on `heavy-duty-terrasoverkapping`:

| | `main` root | stripped `body` root |
| --- | --- | --- |
| production | 145 | 145 |
| new | 159 | 167 |

Ticket 02 makes `<main>` the content boundary. Thus these 8 elements are not
compared. If they hold true content, the tool reports them as
`missing-on-new`, and each one is a false finding.

Find out:

- **What are those 8 elements?** List them for this page. Are they content, or
  chrome that the trimmed selector list does not catch?
- **Is the difference the same on other pages?** Measure across the 149 new-site
  pages that have a `<main>`. Is the count stable, or different per page?
- **Is the cause structural?** Ticket 02 found that the new site has no
  `<header>` element inside `body`, but production has one. The elements
  outside `<main>` may be that header.

## Decision that waits on this

If they are chrome, add a selector to the trimmed list in ticket 02 and close
this. If they are content, `<main>` alone is not the boundary, and the extractor
in ticket 07 needs a per-site root rule.

Ticket 02 proposed a **boundary-suspect** flag: mark the page instead of making
the false findings. Judge that proposal against the data. Do not build it before
the data says it is needed.

## Notes

Do not read `.scratch/sitemap-content-overview/` whole. It is about 56 MB.
The first cut is `_scripts/prototype-parity-data.mjs`.
Crawl data: `_data/03-merged.json` holds the page list. In
`_data/02-crawl-*.json` the `pages` field is an object keyed by url, not an
array, and it records nothing about `<main>`.

Ticket 07 waits on this.

## Context pointer

Findings go to `../research/14-main-boundary-asymmetry.md`, written by a
`/research` background agent, started 2026-08-06. The note keeps the raw numbers
and cites the url or the file line for each claim.

No `research/<name>` git branch was made. `.scratch/` is not tracked, and the
working tree holds unrelated changes on
`152137_Valantic-PageBuilder-Group`.

## Answer

**Neither branch in the question is correct.** The elements are not content, and
no chrome selector is missing. The cause is a **parser defect**.

Full note with citations and raw numbers:
`../research/14-main-boundary-asymmetry.md`

### What the 8 elements are

All 8 are inside `<header class="page-header">` on the new site. All are chrome.
None is content.

- 1 `button` — "NL", the store switcher
- 6 `p` — the header USP bar: "Alles modulair", "Hoge service",
  "30.000+ bestellingen per jaar", "Alles op voorraad", "Snelle levering",
  "11 showrooms in Europa"
- 1 `p` — "Geen resultaten gevonden", in the Mirasvit live-search template

Under the all-anchor rule from ticket 02, the gap becomes 15, not 8. The 7 extra
are a skip link, header top links, an account link and 3 USP links. The count
changes; the conclusion does not. All 15 are inside `header.page-header`.

### Why the `header` selector does not remove them

`node-html-parser` 9.0.1 **deletes the `<header>` and the `<body>` elements**
while it parses. The selector cannot match an element that the parse removed.

The new site sends **malformed HTML**. A `<div>` start tag in the Mirasvit
search `<template>` in the header is not terminated: the next `>` is the one
that closes an HTML comment. The parser drops close tags that do not match
(`dist/index.mjs` lines 4828-4870). At the end of the file it removes each
element that is still open and moves its children to the grandparent (lines
4882-4901). `<body>` and `<header>` are lost. `<html>` stays only because its
grandparent is null.

**The raw bytes hold exactly one `<body>` and one `<header>`, the same as
production.**

### Correction to ticket 02

Ticket 02 recorded that the new site has no `<header>` element inside `body`.
**That is wrong.** It is an artefact of the parser, not a difference between the
themes. The map records this correction.

### Stability

150 pages, 300 live requests, 0 errors.

- **New site**: only 2 gap values across the 149 pages with a `<main>`. Gap 8 on
  148 pages. Gap 0 on 1 page, `veranda-configurator` — the only page where the
  parser finds a `<body>`. That page proves the mechanism.
- **Production is not gap 0**, as this ticket assumed. Under the trimmed list
  from ticket 02, **104 of 147 pages leak one breadcrumb `<li>`**, because
  `[class*="breadcrumb"]` was removed from the list.
- **Outliers**: `blog` on the new site has no `<main>` that the parser can find,
  and leaks 11 true content elements. The 3 production pages with no `<main>`
  fall through to `?? root`, which is the full document, including `<head>`.

### The fix

Parse with `closeAllByClosing: true`.

- Gap falls to **0 on 149 of 149** new-site pages.
- `<main>` is recovered on 3 production pages and 1 new page.
- The `<main>` leaf count changes on **0** of the 147 healthy production pages.

Keep `<main>` as the content boundary. **Restore `[class*="breadcrumb"]`** to the
trimmed chrome list. It is the only difference that lives through the fix.

**Do not build the boundary-suspect flag** that this ticket proposed. After the
fix it would never fire. Instead, assert loudly when `<body>` or `<main>` is
absent. A silent fallback to `?? root` hid this defect for a whole crawl.

### Side finding

The malformed markup is a true front-end defect in a Hyvä compatibility
template. It is on 149 of 150 new-site pages. Browsers repair it, so QA cannot
see it. Graduated to ticket 15.
