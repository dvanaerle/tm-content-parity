# 01 — Opening links stop becoming link records

**What to build:** a gallery page stops reporting the gallery module's own plumbing as editor
work. Production writes two anchors for every photo — one to the image file, one to a page
that displays it — and the new site writes one, at a different address. None of the three is
something an editor wrote or can change, and today all three produce findings. After this
ticket they produce nothing: they never become link records, so they never reach a class.

What an editor keeps is the fact that matters. Which photos are on the page belongs to the
images check, which compares photos by basename and is already blind to the path, so a
gallery that genuinely loses a photo is still reported. What they lose is being told that a
module changed its addressing.

About **4,089 findings go** — roughly a tenth of everything the log reports. Corpus-wide
*Link missing* falls from 4,750 to about 1,577 and *Link added* from 2,897 to about 1,981.
Exactly one override in the log is stranded by this, and it is a `broken-link`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-human

**Parent:** ../PRD.md

- [x] `CONTEXT.md` gains **opening link**: *an `<a>` whose target is a photo the same page
      shows. The gallery module writes two per photo, one to the image file and one to a page
      that displays it. Nobody edits either. The editorial fact is which photo is on the page,
      and the images check owns it.* It is the element-level sibling of **non-editorial
      region**, and it is not named *anchor*-anything — that word is already the `<a>` element.
- [x] The extractor's link-record builder returns nothing for an opening link, by two
      predicates. **Rule A, the image anchor:** empty anchor text, and the target is an image
      file whose basename matches an image the same page shows. **Rule B, the photo-detail
      route:** the target's path by segment index and count —
      `segments[0] === 'gallery' && segments.length === 3`, or
      `segments[0] === 'fr' && segments[1] === 'gallery' && segments.length === 4`.
- [x] When rule A fires, the anchor's target is carried onto the image record as the
      full-size source. Production's `<img src>` is a resized variant and the opening link is
      the only place the original appears. **Ticket 02 cannot start without this.**
- [x] Nothing is removed from the DOM and no excluded region is added. Every image still
      reaches the images check.
- [x] At the extraction seam: a production photo card yields no link records and one image
      record; the new site's lightbox wrapper yields no link record; an album-page link in
      each localised form still yields one; a PDF link still yields one; a captioned link to
      a page whose basename matches an image on that page still yields one; a `be_fr` detail
      route is caught while an `fr` album link of the same segment count is not.
- [x] At the comparison seam, one assertion: a photo on production and absent from the new
      site still produces an `image-missing` finding. This is the promise the ticket makes,
      and it is the one claim extraction cannot make about itself.
- [x] The assertions are written before the implementation. No new test file is created.
- [x] An ADR records the trade-off — link checking on image-wrapper anchors is given up so a
      module's addressing stops reading as editor work — and one scheduled consequence: gallery
      photo pairing rests on filenames, the new site is moving to English filenames for SEO,
      and when that lands pairing falls toward zero and roughly 1,700 wrong image findings
      appear. Ticket 02 is the answer; the ADR makes the arrival expected.
- [x] `npm test && npm run lint && npm run build`.

## Traps

- **Do not match on anchor text.** Two text-based predicates were measured and both miss the
  detail anchor, whose body is the caption — and 201 of the 1,878 detail anchors carry no text
  at all. Only the path catches every one.
- **Do not match on the target's basename alone.** It catches 565 of 1,878 detail anchors,
  because their slugs are captions rather than filenames, and it **wrongly destroys 28
  editorial links** — `/laagste-prijs-garantie` behind *Meer info*, `/showroom-eindhoven`,
  `/lowest-price-guarantee` behind *here*. Requiring the image within three positions removes
  only 9 of the 28, because those false positives are adjacent by construction.
- **Do not test whether a path contains `gallery`.** The image hrefs carry that token at
  segment index 2. Anchor on the index and the count.
- **Do not localise rule B.** The detail route is the literal English `gallery` in all six
  stores; album pages are the localised ones. `be_fr` carries a `/fr/` prefix and the `fr`
  store does not.
- **Do not scope by page.** The gallery url keys are localised, so a `/fotogalerij` filter
  reaches 10 pages of 52. Rule A also catches 350 lightbox wrappers on showroom and blog
  pages — the evidence that the rule is about a construct, not about galleries.
- **Do not reach for a bulk dismissal or an excluded region.** Both were considered and
  rejected: a dismissal claims a review that never happened and does not survive a re-crawl,
  and excluding the gallery grid takes the images with it and ends the one check that works.
