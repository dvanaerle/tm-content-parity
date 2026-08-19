# An opening link is not a link

Production's gallery module writes two anchors for every photo: one to the image file,
one to a page that displays it. The new site's module writes one, at a different
address. Nobody wrote any of those addresses and nobody can change them, and all three
produced findings — 4,089 of them, roughly a tenth of everything the log reports.

We decided that an **opening link** — an `<a>` whose target is a photo the same page
shows — never becomes a link record. The rule lives in `crawl/extract.mjs`, at
extraction, so the difference never becomes a class, needs no override and appears
nowhere. Corpus-wide `missing-link` falls from 4,750 to about 1,577 and `extra-link`
from 2,897 to about 1,981.

Nothing is removed from the DOM and no excluded region is added. Every image still
reaches the images check, which compares photos by basename and is already blind to
the path — so a gallery that genuinely loses a photo is still reported.

## The trade-off

**Link checking on image-wrapper anchors is given up.** An `<a>` with no text that
wraps a photo the page shows is no longer checked for a broken or changed target. That
is the price of the rule, and it is paid knowingly: those anchors are module output,
and 4,147 gallery link findings drew exactly one override in the whole log — a
`broken-link`, which this strands.

An image that links to a *product page* is untouched, because its target is not a
photo. A brochure or spec-sheet PDF is untouched, because its target is not an image
file. An album-page link such as `/fr/galerie/carport` is untouched, because it is not
the detail route.

## Two predicates, and why neither is the other

**Rule A, the image anchor:** empty anchor text, and a target that is an image file
whose basename matches an image the same page shows. This is a construct, not a place:
it catches 350 lightbox wrappers on showroom and blog pages, and it should.

**Rule B, the photo-detail route:** the target's path by segment index and count —
`segments[0] === 'gallery' && segments.length === 3`, or `segments[0] === 'fr' &&
segments[1] === 'gallery' && segments.length === 4`. The detail route is the literal
English `gallery` in all six stores; the album pages are the localised ones. `be_fr`
carries a `/fr/` prefix and the `fr` store does not, which is the only reason there are
two shapes.

Rule B is not stretched to cover rule A's case, and three simpler rules were measured
and rejected:

- **Anchor text.** Two text-based predicates both miss the detail anchor, whose body is
  the caption — and 201 of the 1,878 detail anchors carry no text at all.
- **The target's basename alone.** It catches 565 of 1,878 detail anchors, because their
  slugs are captions rather than filenames, and it wrongly destroys 28 editorial links:
  `/laagste-prijs-garantie` behind *Meer info*, `/showroom-eindhoven`,
  `/lowest-price-guarantee` behind *here*. Requiring the image within three positions
  removes only 9 of the 28, because those false positives are adjacent by construction.
- **A path that contains `gallery`.** The image hrefs carry that token at segment index
  2. Only the index and the count separate them.

Two mechanisms were considered and rejected as well. A bulk dismissal claims a review
that never happened and does not survive a re-crawl. Excluding the gallery grid as a
region takes the images with it and ends the one check that works.

## A scheduled consequence

Gallery photo pairing rests on filenames. The new site is moving to English filenames
for SEO, and when that lands the pairing falls towards zero and roughly 1,700 wrong
image findings appear. That is not a regression introduced here — it is the exposure
this decision leaves standing, and it is written down so its arrival is expected rather
than discovered. Ticket 02 of `.scratch/gallery-opening-links/` is the answer, and it
needs the full-size image url that rule A now carries onto the image record as
`fullSrc`: production's `<img src>` is a resized variant, and the opening link is the
only place the original appears.
