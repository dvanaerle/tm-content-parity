# 06 — Image facts (measurement, no decisions)

Gathered 2026-08-06 for ticket `../issues/06-image-matching-rules.md`.
Facts only. Every decision listed in ticket 06 is still open.

## Method

- Probe: `.scratch/sitemap-content-overview/_scripts/probe-images.mjs` (throwaway).
- Raw data: `.scratch/sitemap-content-overview/_data/probe-images.json`
  (per-image records for both sides of all 181 NL rows).
- **nl store only**, both sites, plain `fetch`, concurrency 8, redirects followed.
- Parsed with `node-html-parser` and `{ closeAllByClosing: true }` (ticket 14).
  With that option **0 pages on either side lost `<body>`, and 0 pages lost
  `<main>`** — the boundary is clean on all 181 NL pages, both sides.
- Boundary is `<main>`, per ticket 02. The chrome selector list is applied only
  on the `body` fallback path, which fired on 0 pages.
- **Production was NOT in maintenance mode.** 0 pages matched the 503 / 500 /
  bootstrap-exception detector. `_data/10-store-seeds.json` (generated the same
  day) records `prodStatus: 503, prodMaintenance: true` on 177 of 181 NL rows —
  that snapshot is stale; production answered 200 during this run.

### Population

| | count |
| --- | --- |
| NL rows fetched | 181 (362 requests) |
| **usable pairs** (200 on both sides) | **124** |
| skipped | 57 |

The 57 skipped split as: **42 prod-404 / new-200** (the new-only `*/onderdelen`
part-category tree, `vloeren`, `veranda-configurator`, `showrooms`), **14
prod-200 / new-404** (legacy-only pages, matching ticket 05's finding), and
**1 `faq/offerte`** which fails with a fetch `TypeError` — the redirect loop
already graduated to ticket 17.

All counts below are over the 124 usable pairs.

---

## 1. Image inventory

| | production | new |
| --- | --- | --- |
| `<img>` inside `<main>` | **1,793** | **1,591** |
| `<img>` in the whole `<body>` | 4,893 | 5,566 |
| `<img>` outside `<main>` (chrome) | **3,100 (63.4%)** | **3,975 (71.4%)** |
| `<source>` elements inside `<main>` | 12 | 0 |
| pages with no `<main>` | 0 | 0 |

Roughly **two thirds of every page's images are chrome**. The `<main>` boundary
is doing most of the work already.

30 of the 124 pairs have **zero** images inside `<main>` on the new side while
production has 2–4 (`disclaimer`, `copyright`, `afmelden`, `enable-cookies`, the
whole `faq/*` set). See section 6 for what those production images are.

## 2. URL shape

**Production does not use bare Magento paths for content images. It uses
Cloudflare Image Resizing.**

| shape | prod | new |
| --- | --- | --- |
| `/cdn-cgi/image/quality=75,format=auto/media/…` | **662** | 0 |
| `/media/wysiwyg/tm/…` | 567 | **1,022** |
| `/media/wysiwyg/…` (not under `tm/`) | 62 | **301** |
| `/media/…` other (mostly `/media/magefan_blog/`) | 309 | 40 |
| `/media/catalog/…/cache/<hash>/…` | 135 | 110 |
| `/media/catalog/…` no cache segment | 0 | 14 |
| `/static/…` | 48 | 28 |
| no src at all | 8 | 76 |
| other | 2 | 0 |

- **WYSIWYG paths dominate on both sides**: prod 629 of 1,793 (35%), new 1,323 of
  1,591 (83%). Adding prod's `cdn-cgi` images — which all wrap a
  `/media/wysiwyg/` path — production is 1,291 of 1,793 (72%) WYSIWYG.
- **Catalog cache paths exist but are a minority** (prod 135, new 110) and the
  cache hash is exactly one per environment and they differ:
  `c31b4814fd7e3b827240fe5037e94e1d` (prod) vs
  `21384153e476e18c4a26b563a7c0ee90` (new). Full-path comparison is impossible
  for these by construction.
- **Hosts**: prod 1,772 `www.tuinmaximaal.nl` + **13 `www.tuinmaximaal.de`**
  (cross-store media leakage on the NL store); new 1,515, all
  `valanticnl.intern.systems`. Zero protocol-relative, zero third-party image
  hosts.
- **`data:` URIs: 0 on both sides.**
- Path *structure* differs systematically: production stores under
  `/media/wysiwyg/tm/nl-nl/afbeeldingen/…`, the new site frequently uses a flat
  `/media/wysiwyg/<File>.jpg` (301 instances). So even ignoring `cdn-cgi`, the
  directory part is not comparable.

## 3. Match key viability

Multiset intersection per page, summed site-wide.

| strategy | matched | % of prod (1,793) | % of new (1,591) |
| --- | --- | --- | --- |
| (a) full path | **51** | 2.8% | 3.2% |
| full path with the `cdn-cgi` prefix stripped + lowercased | 271 | 15.1% | 17.0% |
| (b) basename | **357** | 19.9% | 22.4% |
| basename lowercased | 360 | 20.1% | 22.6% |
| (c) basename, extension stripped | 361 | 20.1% | 22.7% |
| (d) basename lowercased + `_1`/`-1`/`_WxH` stripped | **420** | 23.4% | 26.4% |

Restricted to editorial images only (excluding `/media/catalog/` and
`/media/magefan_blog/`, and excluding the empty-src and campaign-banner
instances from section 6): prod 1,370, new 1,351, basename **347 (25.3% / 25.7%)**,
loose **408 (29.8% / 30.2%)**.

**Ambiguity is a non-problem.** A basename appearing more than once on a page
with different full paths occurs **0 times on production** and **1 time on the
new site** across all 124 pages (`shading-panel`, `Jimmy-cheung-uk.jpg` under two
directories).

Per-page shape of the basename match, against `min(prod, new)`:

| ratio | pages |
| --- | --- |
| no images on one side | 30 |
| 0.0 | 44 |
| 0.2 | 15 |
| 0.4 | 23 |
| 0.6 | 8 |
| 0.8 | 1 |
| 1.0 | 3 |

**52 of 124 pages match zero images by basename.** Inspection of `carport`
(prod 31, new 30, 1 basename match) shows this is largely genuine: the two sides
carry different photo sets and different product-listing images
(`gumax-carport-5.06m-x-3.5m-klassiek-antraciet…jpg` vs `CAR-2413479-71-1.jpg`).
The low match rate is real content divergence, not a key defect.

**Strategy (d) buys 63 extra matches but is unsafe.** Sampled loose-only matches
split into two kinds:

- Genuine Magento/upload artefacts: `Delivery_12.jpg` ↔ `Delivery_12-1292x729.jpg`,
  `bewerkt-0919.jpg` ↔ `bewerkt-0919_1_-1292x729.jpg`,
  `ACC-30000-0001_07.jpg` ↔ `ACC-30000-0001_07_1.jpg`.
- **Wrong pairs**: `fotogalerij-4.jpg` ↔ `Fotogalerij-2.jpg`,
  `terrasoverkapping_antraciet_2.jpg` ↔ `terrasoverkapping_antraciet_3.jpg`,
  `glazenschuifwanden_detailfoto_deurgreep_3.jpg` ↔ `…deurgreep_2.jpg`. In the
  gallery pages the trailing `_N` is the *only* thing distinguishing two
  different photos.

Size suffixes (`-1292x729`) exist on 60 prod and 79 new basenames. Trailing
`_N` / `-N` exists on 372 prod and 419 new basenames — i.e. the ambiguous
pattern is ~10× more common than the size pattern.

## 4. Attributes

| | prod | new |
| --- | --- | --- |
| `src` present | 1,785 | 1,515 |
| only `data-src` (no `src`) | **8** | **0** |
| neither | 0 | **76** |
| `srcset` | **0** | **0** |
| `loading="lazy"` | 135 | 540 |
| `loading="eager"` | 0 | 140 |
| inside `<picture>` | 4 | 0 |
| SVG | 444 | 183 |
| raster | 1,349 | 1,408 |
| inline `data:` URI | 0 | 0 |

- **`srcset` does not exist anywhere on either site.** The ticket's question about
  srcset candidates has no data behind it.
- **`data-src` is nearly dead**: 8 instances, all on `lighting-system/productinformatie`
  on production.
- The new site's **76 images have no `src` and no `data-src`** — Alpine-bound
  icons (`width="24px" height="24px"`, `loading="lazy"`, no `alt`). They carry no
  identity at all and would each become a phantom finding.
- `<picture>`/`<source>` is negligible: 12 `<source>` on prod, 0 on new.

## 5. Alt text

| | prod | new |
| --- | --- | --- |
| `alt` attribute missing entirely | 113 | 59 |
| `alt=""` (explicit empty) | **77** | **627** |
| `alt` non-empty | **1,603** | **905** |

**Production writes alt text on 89% of in-`main` images; the new site on 57%.**
Note 100 of the new site's 627 empty alts are on one page (`downloads`), but 75
of 124 pages have at least one.

Among the **357 basename-matched pairs**:

| | count |
| --- | --- |
| identical non-empty alt | **71** |
| both `alt=""` | 38 |
| both missing | 0 |
| **differing alt (both non-empty)** | **136** |
| **prod has alt, new lost it** | **112** |
| new has alt, prod did not | **0** |

So of 357 matched images, only 109 (30%) carry the same alt state.
**Zero images gained alt text.** Sampled differences are of two kinds:

- Deliberate rewrite, long descriptive → short label:
  prod `"Gumax® aluminium zijwand in grijsbeige met glazen schuifdeuren en
  shading panels, geïntegreerd in een moderne overkapping."` → new
  `"Gumax® aluminium zijwand"`.
- Casing-only: `"ideal"` → `"iDeal"`, `"paypal"` → `"PayPal"`,
  `"visa electron"` → `"Visa Electron"` (whole `betaalmethoden` page).

## 6. Repeats

Occurrences of one src on one page:

| repeats | prod (distinct src) | new (distinct src) |
| --- | --- | --- |
| 1× | 1,170 | 528 |
| 2× | 180 | **411** |
| 3× | 13 | 5 |
| 4× | 4 | 3 |
| 5× | 2 | 1 |
| 6× | 8 | 4 |
| 7× | 0 | 7 |
| 8× | 4 | 0 |
| 9× | 7 | 0 |
| 10×+ | 5 | 4 |

Worst offenders:

```
 59x  new   downloads                                   /media/wysiwyg/tm/nl-nl/afbeeldingen/overig/pdf.svg
 37x  new   downloads                                   /media/wysiwyg/tm/nl-nl/afbeeldingen/overig/youtube.svg
 20x  new   glazen-schuifwand/hor-schuifdeur            …/overig/star-solid.svg
 20x  new   terrasoverkapping/gevelisolatie-…           …/overig/star-solid.svg
 13x  prod  terrasoverkapping/zijwand                   …/recruitment/Bullet-vinkje.png
 12x  prod  superior-coating                            …/logo/tuinmaximaal/checkmark-groen.png
 10x  prod  heavy-duty-terrasoverkapping                …/overig/star-solid.svg
 10x  prod  verlichting                                 …/overig/Vinkje_SVG.svg
  9x  prod  blog                                        …/Magefan_Blog/images/Facebook_30x30px_Groen.png
```

Two separate repeat phenomena:

- **Icon runs** (stars, checkmarks, PDF/YouTube icons) — the `star-solid.svg`
  case the ticket names, up to 59× on one page.
- **The new site's flat 2× ridge**: 411 distinct srcs appear exactly twice on a
  page, against 180 on production. Each new-site content image is emitted twice
  (mobile/desktop variants), so a naive count comparison reports "1 image became
  2" everywhere.

**A page-level chrome-in-`main` leak on production**: the campaign banner
`2026-07-23-KortingActie-NL-16Aug.svg` sits *inside* `<main>` on **123 of the 124
pages**, twice each — **252 instances, 14% of all production in-`main` images**,
with no counterpart on the new site. It is the sole reason the 30 zero-image
pages (`disclaimer`, `copyright`, the `faq/*` set) show a prod-vs-new gap. No
new-site basename appears on more than 50% of pages.

## 7. Dimensions

| | prod | new |
| --- | --- | --- |
| `width` attribute | 865 (48%) | **1,418 (89%)** |
| `height` attribute | 808 (45%) | **1,418 (89%)** |
| both | 805 (45%) | 1,418 (89%) |

A dimension comparison from the HTML alone is possible on at most the
intersection — and production omits both attributes on 55% of its images. Note
also that the new site writes `width="24px"` (with a unit) on the Alpine icons,
so the attribute is not always a bare number.
