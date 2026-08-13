# 06 — Image matching and alt text rules

Type: grilling
Status: resolved
Blocked by: —
Parent: ../map.md

## Question

How are images matched between the two sites, and what counts as a defect?

## Evidence from the probe

One page, `heavy-duty-terrasoverkapping`: prod 17 images, new 14, **9 shared by
filename**. Filename matching was checked by hand and is sound — the unmatched
ones are genuinely different images, and they corroborate the text findings:

- Prod only: 10 × `star-solid.svg` and the review block that the text diff also
  reports as missing; 3 feature icons (`heavy-duty-hd-icon.svg`,
  `unobstructed-view-icon.svg`,
  `strong-construction-heavy-snowfall-icon.svg`); a campaign SVG
  (`2026-07-23-KortingActie-NL-16Aug.svg`); and 3 photos.
- New only: `Sierlijst_*` images and Poly / Glass Line photos, matching the new
  content blocks the text diff reports as added.

On the 9 shared images: **alt text differs on 4**, and **2 lost their alt
entirely** on the new site. That is a real SEO and accessibility regression.

## What to settle

- **The match key.** Filename works on this page. Does it survive Magento
  resizing, cache paths, and any renaming during migration? Magento rewrites
  cache paths per environment, so the full path is definitely not comparable.
- **`srcset` and lazy loading.** The probe reads `src` then `data-src`. Decide
  which attribute is authoritative, and whether `srcset` candidates count as
  separate images.
- **Repeats.** `star-solid.svg` appears 10 times. Group as one finding, like the
  text rule does?
- **Decorative images.** An empty `alt` is correct for a decorative icon and wrong
  for a content image. Can the two be told apart, or does every empty alt need a
  human judgement?
- **Alt text and translation.** On non-NL stores, an alt still in Dutch is an Axis
  B finding. Does this tab own that, or does ticket 11?
- **Beyond identity.** Compare dimensions, byte size, or a perceptual hash to
  catch the same filename holding a different picture? Cheap wins versus real
  cost.
- **Which images count.** The probe strips the same chrome as the text extractor.
  Confirm the boundary — logos and payment icons are not page content.

## Notes

First cut in `prototype-links-probe.mjs` and in `extractImages` /
`compareImages` in `prototype-parity-data.mjs`.

Resolve with `/grilling`.

## Answer

Measured on the **nl** store, both sites, 124 usable page pairs. Raw data in
`.scratch/sitemap-content-overview/_data/probe-images.json`, probe in
`_scripts/probe-images.mjs`, facts note in `../research/06-image-facts.md`.

### The match key

**Full-path matching is dead: 2.8%.** Production serves content images through
Cloudflare Image Resizing — 662 of 1,793 srcs are
`/cdn-cgi/image/quality=75,format=auto/media/wysiwyg/…` — and the new site sends
none. The two environments also carry different Magento catalog cache hashes, and
production's deep `/media/wysiwyg/tm/nl-nl/afbeeldingen/…` paths are frequently
flat `/media/wysiwyg/<File>.jpg` on the new site (301 instances).

The key is the **basename, lowercased, extension kept**, with only a true trailing
size suffix removed (`-1292x729`, `_800x600`). This matches 357 pairs and is
effectively unambiguous — 0 collisions on production, 1 on the new site, across all
124 pages.

**A bare `_N` suffix is never stripped.** Stripping it adds 63 matches, but `_N`
appears on 372 production and 419 new basenames against only 60 / 79 true size
suffixes, and on the gallery pages the `_N` is the **only** thing separating two
different photos (`terrasoverkapping_antraciet_2.jpg` against `_3.jpg`). A wrong
pair is worse than a missed one: it makes a confident finding about an image that
does not exist.

### Attributes

`src` is authoritative, `data-src` is the fallback (8 images on production, 0 on
the new site). **`srcset` has zero instances on either site**, so no `srcset`
handling is built — the open question in this ticket had no data behind it.

The new site has **76 images with neither `src` nor `data-src`** — Alpine-bound
24px icons. These are **not images** for parity: they carry no identity, so they
cannot be matched, missed or fixed. They are counted as a diagnostic number, never
as a finding, which keeps ticket 02's rule that the tool never makes a finding it
then hides.

### The boundary

`<main>`, inherited unchanged from ticket 14. No image-specific chrome list.
Logos, payment icons and the header search sit outside `<main>` and drop out for
free — 63.4% of production's images and 71.4% of the new site's are chrome by this
measure. One boundary means the Images tab and the Diff tab can never disagree
about whether an element is on the page.

### Classes

`class` is the only axis ~~and the mute key~~, per tickets 01 and 02. Five classes:
— **the key clause is struck 2026-08-13, [ADR
0011](../../../docs/adr/0011-the-mute-is-withdrawn.md).** The five classes stand; they were
argued from the shown-or-hidden default as much as from the key.

| Class | Meaning | Default |
| --- | --- | --- |
| `image-missing` | production has it, the new site does not | shown |
| `alt-lost` | production had a non-empty alt, the new site has empty or absent | shown |
| `alt-changed` | both non-empty, the text differs | shown |
| `image-added` | new site only, no production counterpart | hidden |
| `image-campaign` | campaign pattern on **either** side | hidden |

`image-added` is hidden for the same reason `extra-link` is in ticket 05: the new
site legitimately gained content blocks, and the text diff already reports those as
additions. Unhidden, it double-counts every new block.

### `image-campaign` amends ticket 02

Ticket 02 made `campaign` require the pattern on **both** sides. For images that
rule is **relaxed to either side**.

Production's banner `2026-07-23-KortingActie-NL-16Aug.svg` sits inside `<main>` on
**123 of 124 pages, twice each — 252 instances, 14% of production's in-main
images** — with no new-site counterpart. It alone explains all 30 pages where the
new site has zero in-main images. Under the both-sides rule it would fire as
`image-missing` on 123 pages, which is the largest single source of findings in the
whole dataset and all of it noise.

The both-sides requirement in ticket 02 exists because text is ambiguous — `Bekijk
alle deals` could be a real copy loss. An image identity is a filename carrying an
ISO date and a campaign word. The false-positive risk that justified both-sides
does not exist here.

### Set, not multiset

The new site emits **411 distinct srcs exactly twice per page** — mobile and
desktop variants — against production's 180. Raw image counts therefore differ on
almost every page for a reason that is not a defect.

Images are compared as a **set**: dedupe by identity within a page before
comparing. An occurrence-count difference is never a finding on its own. This
carries ticket 03's grouping decision to its conclusion — if the count is display
metadata excluded from the id, it cannot also be evidence.

Repeats group by identity plus class, with the count as display metadata only,
excluded from the id per ticket 01. One missing review block must not manufacture
10 findings.

### Empty alt: parity only, no decorative judgement

The tab reports **regressions**, never absolute accessibility state. An image with
an empty alt on **both** sides is not a finding, because production is the source
of truth. This dissolves the decorative-versus-content question entirely: no
classification is needed and no human judgement is required.

Measured over the 357 matched pairs: identical non-empty **71**, both empty **38**,
differing **136**, production-has / new-lost **112**, new-gained **0**. Site-wide
the new site carries **627** explicit `alt=""` against production's 77 — but only
the 112 that lost a real alt are findings.

An absolute accessibility audit, if wanted, is a separate axis and not this tab.

### Alt normalisation reuses ticket 02

Tier 1 (spaces, quotation marks, dashes, entities) folds silently. A case-only or
trailing-punctuation-only alt difference fires the **existing `casing` class**, not
`alt-changed`. One normalisation implementation, one class vocabulary — because
`class` is the mute key, a separate `alt-casing` class would mean an editor who
mutes casing on a page still receives casing findings from the Images tab, so the
mute would not mean what it says.

### Not built

- **No perceptual hash, no byte fetch.** Images are the corroborating signal, not
  the spine — every unmatched image on the probe page lined up with a block the
  text diff already reported. An image fetch per image, to find a case there is no
  evidence of, is the wrong first spend.
- **No dimension comparison.** The new site carries `width`/`height` on 89% of
  images and production on 48%, so the usable overlap is thin — and production's
  Cloudflare resizing means the attribute describes the rendered box, not the
  asset. Closed out, not deferred.

### Handed to other tickets

- **Alt text in the wrong language** belongs to **ticket 11**, Axis B. The Images
  tab stays Axis A — production against new, inside one store. Noted on ticket 11,
  which must now read `alt` attributes and not text nodes alone.
- **13 production images on the NL store are served from `www.tuinmaximaal.de`.**
  Ticket 05 disclaimed cross-store media as this tab's problem, but this is
  production being wrong, and the new site is not diverging from it. Not a class and
  not a parity finding — graduated to **ticket 18**.

## Facts found on the way

- **Production was not in maintenance mode** — 0 of 362 requests hit a 503, 500 or
  bootstrap page. `_data/10-store-seeds.json` still records `prodMaintenance: true`
  on 177 of 181 NL rows. That snapshot is stale, and ticket 04's warning stands:
  any crawler must detect maintenance and fail loudly.
- Parsed with `closeAllByClosing: true` per ticket 14: **0 pages lost `<body>` or
  `<main>`** on either side. The fix holds.
- Of 181 NL rows only **124 pair usably**. 42 answer 404 on production and 200 on
  the new site — the new-only `*/onderdelen` tree, which is material for ticket 16.
  14 are legacy-only, and `faq/offerte` still fails with ticket 17's redirect loop.
- Production emits 444 SVG against the new site's 183, and 1,349 raster against
  1,408. Neither site uses inline `data:` URIs, and `<picture>` is production-only
  and rare — 4 elements.
