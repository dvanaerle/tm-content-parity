# The opening link is not a link

The spec for this feature. The tickets that carry it out are in `issues/`.

## Problem Statement

An editor opening a gallery page in the log is met with a wall of work that is not work.
The 52 gallery pages carry 9,987 findings — 24.5% of the corpus's 40,824 — and 41.5% of
those are *Link missing* or *Link added*. They read as defects an editor must repair. They
are not: production's gallery module writes two anchors for every photo, one to the image
file and one to a page that displays it, and the new site's module writes one, at a
different address. Nobody wrote any of those addresses and nobody can change them.

The reporter came to this as "false positives on the gallery pages", diagnosing it as a
path-prefix change: production serves `/media/lof/gallery/album/c/a/x.jpg`, the new site
serves `/media/wysiwyg/General/special/album/c/a/x.jpg`. That diagnosis is correct about
the mechanism and points at the wrong check. The images check already absorbs the
relocation completely — all 155 album image matches differ only by path, and `imageKey`
does all the work. The noise is entirely on the links check, where the path is still part
of a link's identity.

The volume matters because it is not confined to galleries in the reader's mind. Gallery
pages hold **67.7% of every `missing-link` in the corpus**. An editor who has learnt that
*Link missing* usually means nothing has learnt to skip the class everywhere.

Nobody has tried to work through them by hand: of 4,147 gallery link findings, the override
log contains exactly **one**, and it is a `broken-link`.

## Solution

An anchor whose target is a photo the same page shows stops becoming a link record at
extraction. It never reaches a class, so it produces no finding, needs no override and
appears nowhere.

The editorial fact on a gallery page — which photos are on it — is unaffected, because it
belongs to the images check, which compares photos by basename and is already blind to the
path. An editor still learns when a gallery loses a photo. They stop learning that a module
changed its addressing.

About 4,089 findings go, roughly a tenth of everything the log reports. Corpus-wide
`missing-link` falls from 4,750 to about 1,577; `extra-link` from 2,897 to about 1,981.

## User Stories

1. As an editor, I want a gallery page to show me only differences I can act on, so that I
   can trust the page count instead of learning to skip it.
2. As an editor, I want *Link missing* to keep meaning "a link an editor wrote has gone", so
   that the class is worth reading on every page and not only on non-gallery ones.
3. As an editor, I want to be told when a gallery loses a photo, so that a genuine content
   loss is not hidden by whatever silences the noise around it.
4. As an editor, I want a photo I placed as a promotional tile — an image linking to a
   product page — to keep being checked, so that a broken destination is still reported.
5. As an editor, I want a brochure or spec-sheet PDF I linked to keep being checked, so that
   the rule that quiets photos does not quiet documents.
6. As an editor, I want an album-page link such as `/fr/galerie/carport` to keep being
   checked, so that navigation between galleries is still covered.
7. As an editor, I want the *Link added* rows on the new site's lightbox anchors to stop
   appearing, so that the information rows I do read are worth reading.
8. As an editor, I want the same quiet on a showroom or blog page that wraps a photo in a
   lightbox anchor, so that the rule is about the markup and not about a page's name.
9. As an editor, I want my existing decisions on other link findings to survive, so that
   work already done is not thrown away by this change.
10. As an editor, I want no new control to learn, so that the improvement costs me nothing.
11. As an editor scanning the dashboard, I want gallery pages to stop dominating the
    corpus's `missing-link` total, so that the bar tells me where the work actually is.
12. As a log author, I want the rule to live at extraction, so that a difference that is not
    editor work never becomes a class and never has to be hidden later.
13. As a log author, I want the rule stated as two predicates, so that each says what it
    catches and neither is stretched to cover the other's case.
14. As a log author, I want the glossary to carry the term, so that the next person to read
    the extractor finds out why an anchor is missing from the link list.
15. As a log author, I want an ADR, so that giving up link checking on image-wrapper anchors
    is recorded as a trade-off rather than found as a gap.
16. As a log author, I want the full-size image URL preserved when the rule fires, so that a
    later check comparing images by content has its inputs on both sides.
17. As a log author, I want a test that a deleted photo is still reported, so that the cut
    can be proven narrow rather than asserted to be.
18. As a log author, I want a test pinning the 28 editorial links that a rejected rule
    destroyed, so that a future simplification cannot quietly reintroduce it.
19. As a log author, I want no DOM removed, so that the images check keeps seeing everything
    it sees today.
20. As a log author, I want the rule to need no list of media paths, so that it does not go
    stale when a seventh module ships.
21. As a maintainer, I want the change to expire almost no overrides, so that it can ship
    without a migration.
22. As a maintainer, I want the coming English-filename rename recorded as a scheduled
    consequence, so that the next wave of gallery noise arrives expected.

## Implementation Decisions

**A new term, `opening link`, enters the glossary.** An `<a>` whose target is a photo the
same page shows. The gallery module writes two per photo, one to the image file and one to a
page that displays it. Nobody edits either. The editorial fact is which photo is on the page,
and the images check owns it. It is the element-level sibling of **non-editorial region**.
The term deliberately avoids the word *anchor*, which `CONTEXT.md` already gives to the `<a>`
element — the same collision that retired *text element*.

**The link-record builder in the extractor gains the rule and returns nothing for an opening
link.** This is the only production change. Two predicates, because measurement showed one
cannot cover both shapes:

- **Rule A, the image anchor.** Empty anchor text, and the target is an image file whose
  basename matches an image the same page shows. Catches 1,882 of 1,882 production image
  anchors and 916 new-site lightbox wrappers, and destroys none of the 28 editorial links
  that a basename-only rule destroyed.
- **Rule B, the photo-detail route.** The target's path, by segment index and segment count:

  ```
  segments[0] === 'gallery' && segments.length === 3
    || segments[0] === 'fr' && segments[1] === 'gallery' && segments.length === 4
  ```

  Catches 1,878 of 1,878. Measured across all 816 pages: every path whose route segment is
  the token `gallery` is one of these six shapes, all on gallery pages, none on the new side.

**Rule A carries the anchor's target onto the image record as the full-size source.**
Production's `<img src>` is a resized variant — `/media/resized/253x168/lof/…` — while the
anchor points at the original. The opening link is the only place the original appears, and a
later check comparing images by content needs it on both sides. This is load-bearing, not
tidiness.

**No DOM is removed and no excluded region is added.** The distinction is deliberate and was
the main alternative considered: excluding the gallery grid would take the images with it and
end the one check that still works on these pages.

**Rule B is a committed entry, rule A is structural.** Rule A is a claim about markup that
needs no paths. Rule B cannot be stated structurally, because its slugs are caption-derived
(`/gallery/galerij/gumax-moderne-terrasoverkapping-…-8747`), so it names the module's route
with its reason, in the manner of the drop rules.

**Link keys and finding ids are otherwise untouched.** Findings on links that remain keep
their ids and their overrides. Exactly one override in the log is stranded, and it is a
`broken-link`.

**An ADR records the trade-off and one scheduled consequence:** gallery photo pairing rests
on filenames, and the new site is moving to English filenames for SEO reasons. When that
lands, pairing falls toward zero and roughly 1,700 wrong image findings appear. That is the
next ticket's problem; the ADR's job is to make its arrival expected.

## Testing Decisions

A good test here asserts what comes out of extraction for a given fragment of HTML, and
never how the predicate is written. The rule's shape is not the behaviour; which anchors
become link records is.

**Primary seam: the page extractor.** It takes HTML and a context and returns the records,
and the existing suite already exercises it directly, with neighbouring blocks for the link
list and for link keys. Every assertion about the rule belongs here:

- A production photo card — an empty anchor around an image, beside a captioned anchor to
  the detail route — yields no link records and one image record.
- The new site's lightbox wrapper yields no link record.
- An album-page link in each of its localised forms still yields a link record.
- A captioned link to a page, on a page showing an image of the same basename, still yields
  a link record. This is the 28-link regression, pinned by example.
- A PDF link still yields a link record.
- The image record carries the anchor's target as its full-size source when rule A fires.
- A `be_fr` detail route with its locale prefix is caught; an `fr` album link of the same
  segment count is not.

**Second seam, one assertion: the comparison.** A photo on production and absent from the
new site still produces an `image-missing` finding. This is the promise the change makes,
and it is the one claim the extractor cannot make about itself.

Prior art: the existing extraction suite's content-boundary and content-unit blocks are the
model for fragment-in, records-out assertions; the comparison suite is the model for the
second seam.

No new test file is created, and the assertions are written before the implementation.

## Out of Scope

- **Knowing whether the same images are on the page.** The stated priority, and this change
  does not deliver it. The images check compares filenames, so it reports 1 match of 4 on the
  carport page while all four are the same photographs under localised names. Its own ticket,
  starting with a measurement of whether the migration copied file bytes or re-encoded them.
- **Changing `imageKey`.** Stripping a trailing `_N` was measured and rejected: it buys 4-6%
  fewer image findings and collapses 169 keys across 39 pages, merging the nine numbered step
  photos of an installation guide into one.
- **Re-curated albums.** `tuinkamer` is 30 production photos against 26 new ones, pairing
  zero. Whether that is a defect or a decision is an open content judgement.
- **Untranslated asset filenames** in `de`, `fr` and `be_fr`. A real new-site difference, and
  not to be repaired by re-uploading translated assets given the planned English rename.
- **Four general gallery pages that render no album** on the new site, and six gallery URLs
  that return 404.
- **A page-level statement for a re-curated album** — saying it once rather than 56 times.
  Worth considering once the triple count is gone and the pages can be seen.

## Further Notes

Three approaches were measured and rejected, and each is a trap worth naming.

**Bulk dismissal**, the reporter's first instinct. An override records a decision, and here
nobody is being asked anything; the log would claim thousands of reviews that never
happened. It also does not hold, because a finding id is a hash over the two link keys, so
every re-crawl mints fresh ids. The mute was withdrawn deliberately in an earlier ADR, and a
bulk dismissal is that mute performed by hand.

**Matching on anchor text.** Both text-based predicates miss the detail anchor, whose body is
the caption — and 201 of the 1,878 detail anchors carry no text at all. Only the path
catches every one.

**Matching on the target's basename alone.** Catches 565 of 1,878 detail anchors, because
their slugs are captions rather than filenames, and wrongly destroys 28 editorial links:
`/laagste-prijs-garantie` behind *Meer info*, `/showroom-eindhoven` behind *Tuinmaximaal
Eindhoven*, `/lowest-price-guarantee` behind *here*. Requiring the image to sit within three
positions of the anchor removes only 9 of the 28, because those false positives are by
construction adjacent to the image that illustrates them.

Two smaller traps. A rule testing whether a path *contains* `gallery` also matches the 1,882
image hrefs, which carry the token at segment index 2. And the detail route is always the
literal English `gallery` in all six stores, while album pages are the localised ones —
with `be_fr` carrying a `/fr/` prefix that the `fr` store does not.

Finally, scope by markup and not by page. The gallery url keys are localised —
`fotogalerij`, `fotogalerie`, `galerie`, `photo-gallery` — so a `/fotogalerij` filter reaches
10 pages of 52. Rule A also catches 350 lightbox wrappers on showroom and blog pages, which
is the evidence that the rule is about a construct and not about galleries.
