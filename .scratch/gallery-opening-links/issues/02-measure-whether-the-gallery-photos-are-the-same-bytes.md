# 02 — Measure whether the gallery photos are the same bytes

**What to build:** the fact that decides how the log will answer *are the same images on the
page* — the question an editor most wants answered on a gallery page, and the one nothing
answers today.

Today the images check compares **filenames**. That is why the carport page reports one match
of four in the German store while all four are the same photographs: production serves
`carport_anthrazit_glas-dach_abschlusskeil.jpg` and the new site serves the Dutch-named copy.
An editor looking at the page sees four correct photos; the log tells them three are missing.
Filename matching is also on borrowed time, because the new site is moving to English
filenames for SEO.

The two paths suggest an easy answer, and it is worth an hour to find out:

```
production:  /media/lof/gallery/album/c/a/carport_antraciet_spie_sneeuw.jpg
new site:    /media/wysiwyg/General/special/album/c/a/carport_antraciet_spie_sneeuw.jpg
```

The shard directories and the filename both survived, which is the signature of a **file
copy** rather than a re-export. If the bytes were copied unchanged, a plain digest of the
original answers the question exactly — same photograph, whatever it is called, wherever it
lives, in whichever store — and it survives the English rename for free.

This ticket does not build the check. It measures which check to build.

**Blocked by:** ~~01~~ — cleared 2026-08-19 by `71a6cea`. Production's `<img src>` is a
resized thumbnail; the original appears only in the opening link's target, and 01 now
carries it onto the image record as `fullSrc` — the raw href, as the page sends it, so it
resolves against the page url the same way `src` does. It is `null` on every image no
opening link wraps.

**Status:** resolved — 2026-08-19, branch `ticket-104-search-page-scope`.
The probe is `crawl/probes/probe-gallery-image-bytes.mjs` and the conclusion is `../BYTES.md`.
One criterion shipped wider than written: the general pages and the 404 URLs are separated
*empirically* rather than from issue 03's lists, which found a fifth empty general page —
`uk` `general-photo-gallery`, 76 photos against none.

**Parent:** ../PRD.md

- [x] A probe fetches the full-size original for every photo on the 52 gallery pages, both
      sides — roughly 1,900 production and 900 new-site images — and digests each one. It
      follows the existing probe pattern and writes its measurement into the data directory.
- [x] It reports, per page and in total: how many photos pair by content, against the 17%
      that pair by filename on album pages today.
- [x] It reports how many photos pair by content but **not** by filename. These are the
      carport case — the same photograph under a localised name — and they are the findings
      the log is currently getting wrong in the direction an editor notices.
- [x] It reports how many pair by filename but **not** by content. These are the opposite
      error and there should be very few; a large number means filenames are being reused for
      different photographs and would change what the real check can promise.
- [x] It reports the four general gallery pages and the six 404 URLs separately, so their
      zeros do not sink the album pages' numbers the way they did in the first measurement.
- [x] A short written conclusion says which check to build: a byte digest if pairing rises
      sharply, or a perceptual hash with a measured threshold if the files were re-encoded.
- [x] Gallery pages only. Do not fetch the whole corpus to answer a gallery question.

## Traps

- **Fetch the original, not the `<img src>`.** Production serves `/media/resized/253x168/…`
  thumbnails. Digesting a thumbnail against a full-size original guarantees a mismatch and
  would produce a confident, wrong answer.
- **This is a throwaway probe, not a check.** It writes a measurement, not findings. Nothing
  in the comparison reads it.
- **One open question this measurement informs but cannot settle.** The `tuinkamer` album is
  30 production photos against 26 new ones, pairing zero, and those look like genuinely
  different photographs rather than renamed ones. Whether a re-curated album is a defect to
  repair or a decision to accept is a content judgement, and it decides whether the eventual
  check reports one direction or both. Record it; do not answer it here.
