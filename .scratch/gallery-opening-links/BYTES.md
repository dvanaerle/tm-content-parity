# Gallery photos — are they the same bytes?

A throwaway probe's conclusion. Not a unit of work.

Parent: ./PRD.md
Ticket: ./issues/02-measure-whether-the-gallery-photos-are-the-same-bytes.md

**Measured 2026-08-19** by `crawl/probes/probe-gallery-image-bytes.mjs`, on the 52 gallery
store pages, both sides, live. 104 page requests and 2,342 distinct image originals, of
which 2,341 answered. The measurement is in `data/probe-gallery-image-bytes.json`, which
`data/` does not commit; re-run the probe to rebuild it.

Each digested file is the one the photo *opens* to — ticket 01's `fullSrc` — and not the
`<img src>`, which on production is a `/media/resized/253x168/…` thumbnail. **Twelve photos
of 1,643 are the exception**: no opening link wraps them, so they have no original and the
probe digested their `<img src>`. Seven of the twelve are the single photo on an upload-form
page, which the new site renders not at all; the other five are one banner each on a general
index page. On the 28 rendered album pages the conclusion below rests on, **one** production
photo of 792 fell back and none on the new side. The probe counts and prints this per page,
so no figure here rests on a thumbnail without saying so.

---

## The conclusion: build the byte digest

A plain SHA-256 of the original answers the question. On the album pages the new site
actually renders, pairing goes from **19.6% by filename to 70.3% by content** — 155 photos
to 557, of the 792 production photos on those 28 pages.

Nothing suggests a re-encode. Every one of the 2,341 originals is `image/jpeg`, and
**not one pair matches by filename and differs by content** — zero, across all 52 pages.
So a perceptual hash has no work to do here, and no threshold has to be chosen, defended or
maintained. The shard directories, the filenames and the bytes all survived: the migration
copied files.

The check to build compares the digest of `fullSrc`. It is exact, it needs no tuning, it is
blind to the localised names, and it survives the planned English rename for free — the ADR's
scheduled consequence stops being scheduled.

## The numbers

Album pages are `<gallery>/<album>`; a general gallery page is the store's album index. Seven
album pages and four general pages render no photo at all on the new site, and six URLs 404,
so each group is given twice: as it stands, and over the pages the new site renders. The
second row is the one the decision rests on.

| group | pages | production photos | new-site photos | pair by filename | pair by content |
| --- | --- | --- | --- | --- | --- |
| album | 35 | 822 | 688 | 155 (18.9%) | 557 (67.8%) |
| **album, rendered** | **28** | **792** | **688** | **155 (19.6%)** | **557 (70.3%)** |
| general | 11 | 821 | 229 | 43 (5.2%) | 158 (19.2%) |
| general, rendered | 7 | 551 | 229 | 43 (7.8%) | 158 (28.7%) |
| not comparable (404) | 6 | 251 | — | — | — |

Percentages are of the production side, which is how the 17% in the ticket was stated. The
album figure the ticket carried was 17%; this run measures 18.9% over the same 35 pages, and
the difference is a live re-crawl rather than a change of method.

**Pair by content but not by filename: 402 on album pages, 116 on general pages.** These are
the carport case — the same photograph under a localised name. 402 of the album pages' 557
content pairs, **72% of them**, are findings the log reports today as an *Image missing* and
an *Image added* that an editor can see are the same photo.

**Pair by filename but not by content: 0.** Everywhere. Filenames are not being reused for
different photographs, so the check can promise that a filename match is also a content
match, and the byte digest strictly contains what filename matching already finds.

Worth naming, because it is the whole shape of the problem in one row:

| page | production | new site | by filename | by content |
| --- | --- | --- | --- | --- |
| `be_fr` `fr/galerie/portes-coulissantes` | 51 | 50 | 1 | 42 |
| `fr` `galerie/portes-coulissantes` | 51 | 50 | 1 | 42 |
| `de` `galerie/glasschiebewande` | 54 | 50 | 5 | 44 |
| `be` `fotogalerij/glazen-schuifwand` | 54 | 50 | 13 | 48 |

The lighting album is the opposite end. Five of its six localisations — `nl` and `be`
`verlichting`, `be_fr` `eclairage`, `de` `beleuchtung`, `uk` `lighting` — already pair 19 of
24 by filename, and content lifts each only to 21. That album was never renamed. The sixth,
`fr` `galerie/eclairaige`, renders nothing and is the regression named below.

## What content pairing does not explain

Over the 28 rendered album pages, 235 production photos and 131 new-site photos pair with
nothing at all. That is the residue after both names and bytes have been tried, and it is
real content difference rather than a naming artefact.

## The open question this cannot settle: the re-curated album

The ticket asks for the `tuinkamer` case to be recorded and not answered. **Recorded, and
the measurement shrinks it rather than settling it.**

| page | production | new site | pair by content | production unpaired | new unpaired |
| --- | --- | --- | --- | --- | --- |
| `be` `fotogalerij/tuinkamer` | 30 | 26 | 18 | 12 | 8 |
| `nl` `fotogalerij/tuinkamer` | 27 | 26 | 23 | 4 | 3 |
| `de` `galerie/wintergarten` | 29 | 26 | 18 | 11 | 8 |
| `uk` `photo-gallery/garden-room` | 31 | 26 | 20 | 11 | 6 |
| `fr` `galerie/piece-de-jardin` | 30 | 25 | 20 | 10 | 5 |
| `be_fr` `fr/galerie/piece-de-jardin` | 34 | 25 | 20 | 14 | 5 |

`be` `tuinkamer` pairs 0 by filename and 18 by content, so it is not a wholly re-curated
album — most of it is the same photographs renamed. What is left is a dozen production photos
gone and eight new ones added. Whether that is a defect to repair or an editorial decision to
accept is still a content judgement, and it still decides whether the check reports one
direction or both. This measurement only says the judgement is about a dozen photos per album
and not about thirty.

## Two corrections to issue 03, found on the way

Issue 03 lists four general gallery pages that render no album. This run finds **five**
affected, of which four render literally nothing:

| store | page | production | new site |
| --- | --- | --- | --- |
| de | `allgemeine-fotogalerie` | 72 | 0 |
| fr | `galerie` | 61 | 0 |
| be_fr | `fr/galerie` | 61 | 0 |
| uk | `general-photo-gallery` | 76 | 0 |
| de | `galerie` | 57 | 1 |

`uk` `general-photo-gallery` is not in issue 03 and behaves exactly like the three empty ones
above it. This correction is carried into issue 03 itself, so it is not rediscovered here.

Seven **album** pages render no photo, and six of them are not defects: `upload-fotos`,
`bilder-hochladen`, `telecharger-des-photos` and `upload-photos` each carry a single
production photo against none on the new site. They are upload forms, not albums. The seventh
is the genuine regression issue 03 already names, `fr` `galerie/eclairaige` at 24 against 0,
whose `be_fr` twin `galerie/eclairage` renders 22.

The six 404 URLs are exactly the six issue 03 names.

## One image that would not fetch

`https://m2stagingde.intern.systems/cdn-cgi/image/…/ganze-jahr-geniessen.jpg` answers 404
with an HTML body. It is one banner on `de` `fotogalerie`, the only failure of 2,342, and it
changes no figure above.

It is **not** an original: it is one of the twelve fallback `<img src>` values, so the check
this document recommends would never fetch it. What it does show is that the new site can
serve a 404 for an image its own page references, which the check will meet eventually and
has to have an answer for.
