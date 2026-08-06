# 14 — Content outside `<main>` on the new site

Research note for `../issues/14-main-boundary-asymmetry.md`.
Investigated 2026-08-06 against live HTML of both sites and against the
installed parser source. Recommendation only — nothing implemented.

## Summary

The gap is **not content, and not a chrome-selector gap either**. All 8 leftover
elements sit inside `<header class="page-header">` on the new site. They survive
the `header` chrome selector because **`node-html-parser` deletes the `<header>`
element (and the `<body>` element) while parsing the new site's HTML**. The
markup contains an unterminated `<div>` start tag, which leaves elements open at
EOF; the parser's EOF unwind removes unclosed elements and hoists their children
to the grandparent.

So ticket 02's structural observation — "the new site has no `<header>` element
inside `body`" — is a **parser artefact, not a site difference**. The raw HTML of
`https://valanticnl.intern.systems/heavy-duty-terrasoverkapping` contains exactly
one `<body>` and exactly one `<header>`.

Same failure occurs on **3 production pages**, where it destroys `<main>` itself.

A one-line parser option (`closeAllByClosing: true`) removes the whole
asymmetry: the gap drops from 8 to 0 on 149/149 new pages, and changes nothing
on the 147 healthy prod pages.

## Method

Extraction logic copied verbatim from
`C:\Users\d.aerle\Desktop\gitlab\devdva02\.scratch\sitemap-content-overview\_scripts\prototype-parity-data.mjs`
lines 14, 25–40, 53–69 (leaf tags, normalisation, container skip, length >= 2,
non-punctuation-only), with the two changes ticket 02 mandates:

- chrome list trimmed to `header, footer, nav, form, script, style, noscript, [class*="menu"], [role="dialog"]`
  (prototype line 18–23 holds the untrimmed list);
- chrome removal applied **only** on the `body` fallback path, never inside `<main>`.

Two roots computed per page from the same parse, so node identity is comparable:

- **A** = leaf text elements under `root.querySelector('main') ?? root.querySelector('#maincontent')`, no chrome removal.
- **B** = leaf text elements under `root.querySelector('body') ?? root`, trimmed chrome removed.
- **gap** = B \ A.

Every page ran twice: anchors = CTA-only (prototype lines 61–65) and anchors =
all (ticket 02's rule).

Page list: `.scratch\sitemap-content-overview\_data\03-merged.json`, `rows[]`
filtered to `on_new_site === true` with both `full_url` and `new_url` → **150
pages**, 300 live fetches, 0 errors. Parser: `node-html-parser` **9.0.1**
(`_scripts/node_modules/node-html-parser/package.json`).

Throwaway scripts were deleted after the run; every number below is reproducible
by re-applying the logic above.

## Q1 — What exactly are the 8 elements?

Page: `https://valanticnl.intern.systems/heavy-duty-terrasoverkapping` (fetched
live 2026-08-06).

Reproduced counts, CTA-only anchors: **main root 159, stripped body root 167,
gap 8** — matches the ticket's table exactly.

Prod control on the same page: **main root 145, stripped body root 146, gap 1**.
(The ticket says 145/145. The extra 1 is the breadcrumb `<li>`, which the
*untrimmed* prototype list removed via `[class*="breadcrumb"]`; ticket 02 dropped
that selector. See Q2.)

All ancestor chains below are from a **repaired parse** (`closeAllByClosing: true`),
because in the default parse the chains are corrupted — they read
`html > div.header-content > …` with no `body` and no `header` at all, which is
the artefact itself.

| # | tag | class | text | true ancestor chain (repaired parse) | judgement |
|---|-----|-------|------|--------------------------------------|-----------|
| 1 | `button` | `inline-flex justify-center w-full text-tmx-neutral-white text-left items-center gap-1 text-3.5 font-semibold md:gap-2` | `NL` | `body#html-body > div.page-wrapper > header.page-header > div#header.bg-white > div.sticky-container > div.header-content > div.bg-header > div.container > div.ml-auto > div.relative.w-auto.inline-flex` | **chrome** — language/store switcher in the header bar |
| 2 | `p` | *(none)* | `Alles modulair` | `… header.page-header > div#header > div.sticky-container > div.header-content > div.header-usp > div.container > div > div > div.pagebuilder-usps > ul.list-usps > li.pagebuilder-usps-item > span` | **chrome** — header USP bar |
| 3 | `p` | *(none)* | `Hoge service` | same as #2 | **chrome** — header USP bar |
| 4 | `p` | *(none)* | `30.000+ bestellingen per jaar` | same as #2 | **chrome** — header USP bar |
| 5 | `p` | *(none)* | `Alles op voorraad` | same as #2 | **chrome** — header USP bar |
| 6 | `p` | *(none)* | `Snelle levering` | same as #2 | **chrome** — header USP bar |
| 7 | `p` | *(none)* | `11 showrooms in Europa` | same as #2 | **chrome** — header USP bar |
| 8 | `p` | *(none)* | `Geen resultaten gevonden` | `… header.page-header > div#header > div.sticky-container > div.mobile-search-wrapper > div > div.search-content-wrapper > div.mx-auto > div.relative > div#mirasvitSearchResults > template > div.flex.flex-col > div.custom-scrollbar > div.mstInPage__itemList.magento_catalog_product > div.px-4 > div.grid… > template` | **chrome** — empty-state string inside the Mirasvit live-search Alpine `<template>`; never rendered on page load |

**Every one of the 8 is chrome.** None is page content. Zero would be a real
`missing-on-new` finding.

### The anchor rule does not change the answer

With ticket 02's "all anchors count" rule the same new-site page gives gap **15**
instead of 8 (prod on the same rule: main root 174, stripped body root 176,
gap 2). The 7 extra new-site elements are:

| tag | class / href | text | location | judgement |
|---|---|---|---|---|
| `a` | `action skip sr-only focus:not-sr-only …` → `#contentarea` | `Ga naar de inhoud` | direct child of `header.page-header` | **chrome** — skip link |
| `a` | href `/showrooms` | `Showrooms` | `header.page-header > … > div.header-top-links > … > p` | **chrome** — header top links |
| `a` | href `/klantenservice` | `Contact` | `header.page-header > … > div.header-top-links > … > p` | **chrome** — header top links |
| `a` | `flex items-center gap-x-1 relative` → `/customer/account/login/` | `Inloggen` | `header.page-header > … > div.header-separator` | **chrome** — account link |
| `a` | href `/laagste-prijs-garantie` | `Laagste prijs garantie` | `header.page-header > … > div.header-usp > … > li.pagebuilder-usps-item > span > p` | **chrome** — header USP bar |
| `a` | href `/garantie` | `10 jaar garantie` | same USP bar | **chrome** — header USP bar |
| `a` | href `https://www.klantenvertellen.nl/reviews/1038051/tuinmaximaal?…` | `Bekijk beoordelen` | same USP bar, inside `strong` | **chrome** — header USP bar |

All 15 are inside `header.page-header`. **The anchor rule changes the count
(8 → 15) but not the conclusion**: nothing in the gap is content, under either
rule.

Prod control on the same page, all-anchor rule: gap 2 — `a: Home` and
`li: Heavy Duty terrasoverkapping`, both breadcrumb.

## Q2 — Is the difference stable across pages?

150 pages fetched from both sites. Distribution of the gap count over pages that
have a `<main>`:

### New site (`https://valanticnl.intern.systems/<urlkey>`)

| anchor rule | pages with `<main>` | gap 0 | gap 8 | gap 15 |
|---|---|---|---|---|
| CTA-only | 149 | 1 | 148 | — |
| all anchors | 149 | 1 | — | 148 |

Only **2 distinct gap signatures** exist across all 149 pages: the 8-element list
from Q1 (148 pages), and the empty list (1 page). The difference is
**perfectly stable** — it is the same header, page after page.

Outliers:

- `veranda-configurator` (`https://valanticnl.intern.systems/veranda-configurator`) —
  gap **0**. This is the **only** new-site page where the parser finds a `<body>`
  element, and the only one with no `<header>` at all even after repair. It is
  the control case that proves the mechanism.
- `blog` (`https://valanticnl.intern.systems/blog`) — **no `<main>` found at all**
  under the default parse, so it is excluded from the 149. Its `body`-fallback
  root yields 19 leaves, of which 8 are the header list and **11 are real page
  content** (`h1: Tuininspiratie en trends | Tuinmaximaal tuinblog voor tips`,
  plus 10 blog teaser paragraphs). With the parser repaired, `<main>` reappears.

### Production control (`https://www.tuinmaximaal.nl/<urlkey>`)

| anchor rule | pages with `<main>` | gap 0 | gap 1 | gap 2 | gap 3 |
|---|---|---|---|---|---|
| CTA-only | 147 | 43 | 104 | — | — |
| all anchors | 147 | 43 | — | 103 | 1 |

Prod is **not** gap-0 everywhere under ticket 02's trimmed chrome list: 104 of
147 pages leak exactly one breadcrumb `<li>` (the current page's own name, e.g.
`li: Heavy Duty terrasoverkapping`), and with all anchors also the `a: Home`
breadcrumb link. 104 distinct signatures, because the leaked text is the page
title — that is why it looks like content per page but is one pattern.

The 43 gap-0 prod pages are the ones with no breadcrumb block.

Prod outliers: 3 pages where the parser finds **neither `<body>` nor `<main>`** —
`https://www.tuinmaximaal.nl/faq/productinformatie`,
`https://www.tuinmaximaal.nl/faq/wijzigingen-retour`,
`https://www.tuinmaximaal.nl/tuinhuis-met-overkapping`. Same failure as the new
site. Under the current prototype these three fall through to
`?? root` — the **entire document including `<head>`** — which is a far bigger
source of false findings than the 8 elements this ticket is about.

## Q3 — What is structurally causing it?

### The `<header>` claim is false as stated

Raw-source counts on `heavy-duty-terrasoverkapping` (regex over the fetched
bytes, both sites):

| | raw `<body` | raw `<header` | raw `<main` | parsed `body` | parsed `header` | parsed `main` |
|---|---|---|---|---|---|---|
| prod | 1 | 1 | 1 | 1 | 1 | 1 |
| new | 1 | 1 | 1 | **0** | **0** | 1 |

The new site **does** have a `<header class="page-header">` and a
`<body id="html-body" class="cms-heavy-duty-terrasoverkapping page-layout-1column cms-page-view page-layout-cms-full-width">`.
`node-html-parser` deletes both.

Across all 150 pages, default parse:

| | `body` found | `header` found | `footer` found | `main` found |
|---|---|---|---|---|
| prod | 147 | 150 | 150 | 147 |
| new | **1** | **0** | 149 | 149 |

`<footer>` survives on the new site because it closes cleanly and sits after the
damage; `<header>` and `<body>` do not.

### The mechanism

1. **Malformed markup on the new site.** Inside
   `div#mirasvitSearchResults > template[x-if="hasSearchResults"]` — i.e. inside
   `header.page-header` — a `<div>` start tag is never terminated:

   ```
   <div class="custom-scrollbar space-y-6 overflow-y-auto overflow-x-hidden gap-1 max-h-full md:max-h-[65vh] lg:max-h-[80vh] sm:grid-cols-8"


           <!--    Products    -->
           <div class="mstInPage__itemList magento_catalog_product"
   ```

   The first `>` after that class attribute is the one closing the
   `<!--    Products    -->` comment. This is a real HTML defect in the Mirasvit
   in-page-search Hyvä template (byte offset ~83 810 on the fetched page;
   the enclosing `<template x-if="hasSearchResults">` starts at ~83 637). The new
   site ships 22 `<template>` elements per page; prod ships 0.

2. **The parser's EOF unwind deletes unclosed elements.** In
   `_scripts\node_modules\node-html-parser\dist\index.mjs`:

   - lines 4828–4870 (`base_parse`): a closing tag that does not match the
     current open element is **silently dropped** unless `closeAllByClosing` is
     set (line 4857). So the real `</header>` and `</body>` never pop the stack.
   - lines 4882–4901 (`parse$1`): whatever is still on the stack at EOF is
     `removeChild`-ed and its `childNodes` are appended to the grandparent
     (`oneBefore.parentNode.appendChild(child)` / `oneBefore.appendChild(child)`).

   Result: `<body>` and `<header>` are removed from the tree and their children
   are hoisted to `<html>`. `<html>` survives only because
   `last.parentNode.parentNode` is null for it (line 4885).

   Confirmed by parsing the same bytes three ways:

   | parse options | body | header | main | `<main>` ancestors |
   |---|---|---|---|---|
   | default | 0 | 0 | 1 | `html` |
   | `{ closeAllByClosing: true }` | 1 | 1 | 1 | `html > body > div` |
   | `{ parseNoneClosedTags: true }` | 1 | 1 | 1 | `html > body > div > header > div×8 > template` |

   The third row shows the damage directly: without repair, `<main>` is parsed
   as a **descendant of the broken `<template>` inside `<header>`**. Prod parses
   identically under all three options.

3. **Downstream effect in the prototype.** `prototype-parity-data.mjs` line 46–48
   falls back `root.querySelector('main') ?? root.querySelector('#maincontent')
   ?? root.querySelector('body') ?? root`. On the new site the `body` step is
   already unreachable, so the "stripped `body` root" in the ticket's table is in
   fact the **whole document root**, and the `header` chrome selector matches
   nothing. That is the entire 167-vs-159 delta.

### The repair

`parse(html, { closeAllByClosing: true })` applied to every page:

| | pages | `body` found | `header` found | gap 0 | gap != 0 |
|---|---|---|---|---|---|
| new | 150 | 150 | 149 | **149** | 1 (`blog`, gap 8) |

`blog` is the one page where repair restores `<main>` (0 → 3 leaves) but the
header content still leaks; its own markup needs a separate look, and it is
already the page with genuine content outside `<main>`.

Safety check on production: `closeAllByClosing: true` changed the `<main>` leaf
count on **3 of 150** prod pages — and only the 3 broken ones, from `-1`
(no `<main>` at all) to 37, 29 and 60 leaves respectively. **Zero change on the
147 healthy pages.** The option is non-destructive and strictly recovers pages.

## What this means for the boundary rule

The ticket names two branches. The data supports **neither cleanly** — it
supports a third, which subsumes the first.

### Branch A — "chrome → add a selector to the trimmed list in ticket 02"

**Evidence for:** all 8 (and all 15 under the all-anchor rule) leftover elements
are chrome, 100%, on 148 of 149 pages, with only 2 distinct signatures. Nothing
in the gap is page content. On the face of it, ticket 02's trimmed list plus one
more selector would close the numeric gap.

**Evidence against:** there is **no honest selector to add**. The correct
selector is already in the list — `header`. It fails not because the list is
wrong but because the element it names does not exist in the parsed tree.
Patching around it (`[class*="header"]`, `[class*="usp"]`, `#mirasvitSearchResults`)
would paper over a parser fault with site-specific class strings, and would not
help `blog` or the 3 broken prod pages, where the same fault destroys `<main>`
and leaks *real* content. It would also silently re-introduce exactly the class
of false finding this ticket exists to prevent.

### Branch B — "content → `<main>` alone is not the boundary; ticket 07 needs a per-site root rule"

**Evidence against:** the gap holds zero content elements on 148 of 149 pages.
`<main>` **is** the right boundary, and it is intact: the `<main>` leaf count is
identical with and without the parser repair on 149 of 150 new pages and 147 of
150 prod pages. A per-site root rule is not warranted by this data.

**Evidence for (narrow):** `blog` on the new site genuinely holds an `<h1>` and
10 teaser paragraphs outside a parseable `<main>` — but that too is caused by the
parse damage, not by the site's information architecture.

### Branch C — the one the data supports: fix the parse, not the boundary

The asymmetry is a **parser configuration defect in the prototype**, not a
content-boundary question at all.

Recommended for ticket 07's extractor:

1. **Parse with `{ closeAllByClosing: true }`.** Removes the gap on 149/149 new
   pages, recovers `<main>` on 3 prod pages and 1 new page, and changes nothing
   on the 147 healthy prod pages. This is the whole fix.
2. **Keep `<main>` as the boundary, unchanged.** Ticket 02's decision stands, and
   ticket 02's `<header>` observation should be corrected in the record: it was a
   parser artefact.
3. **Add `[class*="breadcrumb"]` back to the trimmed chrome list**, or drop the
   `body` fallback path entirely. Under the trimmed list, 104 of 147 prod pages
   leak a breadcrumb `<li>` — a real (if small) asymmetry that survives the parse
   fix, and the only remaining source of gap on prod.
4. **Do not build the boundary-suspect flag.** The proposal in ticket 02 is
   sound engineering for a real per-site divergence, but the data says there is
   no per-site divergence to flag: after the parse fix the gap is 0 on 149/149
   new pages and the 2 signatures collapse to 1. A flag here would fire on every
   page and carry no information. What *is* worth an assertion is the parse
   itself: **fail loudly if `<body>` or `<main>` is missing from a parsed page**,
   since that condition — 3 prod pages and 149 new pages today — is what produced
   this entire ticket. That is 4 pages after the fix, a signal worth reading, not
   noise.

### Side finding worth its own ticket

The new site serves **malformed HTML**: an unterminated `<div>` start tag inside
the Mirasvit in-page search `<template>` in `header.page-header`, on 149 of 150
pages. Browsers recover, so it is invisible in QA, but it is a genuine markup
defect in a Hyvä compatibility template and it broke this tool. Production has
the same class of defect on 3 pages
(`/faq/productinformatie`, `/faq/wijzigingen-retour`, `/tuinhuis-met-overkapping`).
Not a content-parity issue — a front-end defect.
