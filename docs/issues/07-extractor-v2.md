# 07 — Extractor v2: elements, links, images, meta, Markdown

Type: task
Status: resolved
Resolved: 2026-08-06
Assignee: d.aerle
Blocked by: 02, 05, 06, 14
Parent: ../map.md

## Question

Nothing to decide once 02, 05 and 06 are settled. Build the single extraction
pass that produces everything the log needs, for one URL.

## What it must produce, per page per site

- **Text elements** in document order: tag, kind (heading / text / CTA), heading
  level, raw text, normalised text. This is both the content outline and the diff
  input — one structure, not two.
- **Links**: href, resolved absolute URL, anchor text, and whether internal.
- **Images**: match key, `src`, `alt`, and whatever else ticket 06 settles.
- **Meta**: title, description, canonical, `noindex`, `h1`.
- **Markdown**: the page content as Markdown, for reading, export and hand-off to
  copy work. A rendering, never the diff spine — it flattens element identity.
- **Page type**, from the `<body class>`, as the baseline already does.

## Facts to carry over

- **Plain `fetch` is enough for both sites.** Playwright is not needed to read
  content, which is what makes re-check fast.
- **Production emits almost no `data-content-type`.** It holds this content as
  plain HTML; the new site rebuilt it in PageBuilder. Section structure is not
  comparable, so the extractor must not depend on PageBuilder markup for the
  comparable output. PageBuilder section data stays useful as new-site-only
  context.
- `node-html-parser` **drops the `<body>` tag** — read the body class with a regex
  on the raw HTML.
- `node-html-parser` **concatenates child text with no separator**
  ("samplepakketVraag"). Use `structuredText` through a `textOf()` helper.

## Notes

**Ticket 08 is done.** Build in `Desktop/github/tm-content-parity/crawl/`, and
write what `PageExtract` in `compare/contract.mjs` specifies. The baseline
scripts are copied there already, and the copies in `.scratch` are frozen —
**delete them when this ticket lands**, so only one live copy exists.

The baseline extractor is
`devdva02/.scratch/sitemap-content-overview/_scripts/lib-extract.mjs`, and the
prototype extractor is `prototype-parity-data.mjs` in the same folder. Both move
into the new repo under `crawl/` as part of ticket 08.

Do not patch these scripts with inline `node -e` string replacement — it broke a
string literal once. Use the Edit tool.

## Answer

Built and committed: `tm-content-parity` commit `bb49230`. 53 tests green.

| File | Holds |
| --- | --- |
| `crawl/extract.mjs` | `extractPage(html, context)` → `PageExtract`, plus `pageType`, `linkKey`, `imageKey`, `toMarkdown` |
| `crawl/normalise.mjs` | Tier 1 from ticket 02. The elements, the alt text and the meta all reuse it |
| `crawl/fetch-page.mjs` | One fetch, with ticket 04's maintenance guard |
| `crawl/20-extract.mjs` | One store page, both sides. `extractStorePage()` is what ticket 10 calls |
| `crawl/probes/probe-extract-v2.mjs` | The measurement below |

### Measurement: the whole nl store, 362 requests

- **361 of 362 pages extracted. 0 throws, 0 warnings.** The one failure is
  `faq/offerte`, the redirect loop of ticket 17.
- **The boundary is `main` on every page** — 181 of 181 on production, 180 of 180
  on the new site. Ticket 02 measured 3 production pages with no `<main>`; ticket
  14's parse recovered all 3, so the `body` fallback path fired **zero** times.
  It stays, because it is the only defence when the parse breaks again.
- Production: 10,157 elements, 5,043 links, 1,662 images, 50 with no `alt`
  attribute, 8 with no `src`. New: 7,079 elements, 2,719 links, 1,228 images, 0
  with no `alt`, 148 with no `src`.
- Page status: production 139 × 200 and **42 × 404**; new 166 × 200 and 14 × 404.
  A 404 page still extracts, because the 404 page has a `<main>`. **The compare
  stage must gate on `status === 200`**, per ticket 05: a non-200 page is
  page-level status, never a set of findings.

### Three decisions the ticket did not give

- **Percent encoding in a link query folds.** One page sends the same filter
  target as `?…=6039,6040` and as `?…=6039%2C6040`. Ticket 05 says keep the
  query, and it does; the encoding is rebuilt with `URLSearchParams`, so the two
  forms make one key. The encoding is invisible to a reader, which is exactly
  ticket 02's tier-1 test.
- **Images are deduplicated in the extractor, not in the compare stage.** Ticket
  06 compares images as a set, and `ImageRecord` carries no count, so the set is
  made where the identity is made. When the two copies of one image disagree
  about `alt`, the real alt wins over an absent or empty one: the page does carry
  it.
- **`PageDiagnostics` is added to the contract**, with `imagesWithoutSrc`. Ticket
  06 wants those images counted and never turned into a finding. A number in the
  extract says that without a class.

### Deliberately not built

- **No link status checking.** Ticket 05's HEAD-then-GET sweep needs a URL cache
  across pages, so it belongs to the compare and re-check stages, not to a
  single-page extraction pass.
- **`data-content-type`** is not read. Production emits 9 against the new site's
  246, so section structure is not comparable. The element list is the spine.

### Facts found

- **`veranda-configurator` gives 0 elements inside `<main>` on the new site.**
  The page is client-rendered, so plain `fetch` sees an empty shell. Production
  holds a full page, so a naive diff would report the whole page as lost.
  Graduated to **ticket 19**.
- Production's `nieuwsbrief` page has **no `<title>`**. It is the only page with
  none, on either side.
- Production carries 50 images with **no `alt` attribute at all**; the new site
  carries none. The new site always writes the attribute, empty when it has
  nothing to say — which is why ticket 06 keeps absent and empty apart.

### Left open

`.scratch/sitemap-content-overview/_scripts/` still holds the 13 frozen copies.
All 13 are byte-identical to the committed copies in the repo, so deleting them
is safe, but the delete was **blocked by the tool permission** in this session.
Delete `*.mjs`, `package*.json` and `node_modules` there, and keep `MOVED.md`.
`_data/`, `_prototype/`, `pages/` and `screenshots/` stay.
