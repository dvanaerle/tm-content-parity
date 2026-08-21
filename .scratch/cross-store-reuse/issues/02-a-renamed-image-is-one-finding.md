# 02 — A renamed image is one finding

Type: task
Status: resolved 2026-08-21 — `image-renamed` in `compare/vocabulary.mjs` and
`renamedImage()` in `compare/images.mjs`, on `main`, with ADR 0027. Every criterion below is
ticked. **Read `## Comments` first:** the matcher is the arity-and-position one written here, the
digest was refused for this ticket and given its own (`./12-a-renamed-image-is-paired-by-content.md`),
and what that costs in coverage is measured and written down rather than glossed.
Re-read before building — **2026-08-19**. This ticket was sequenced after
`gallery-opening-links/02`, on the reasoning that if the gallery photos turn out to be the same
bytes then a content digest pairs a renamed image **directly**, which is a stronger answer than
this ticket's arity-and-position heuristic. **That probe has now reported**
(`../../gallery-opening-links/BYTES.md`) and the answer is the strong one:
- Pairing rises from **19.6% by filename to 70.3% by content** on the album pages the new site
  renders.
- **Not one pair matches by filename and differs by content — zero, across all 52 pages.** So a
  digest match is exact, needs no threshold, and strictly contains what filename matching finds.
- **402 of 557 content pairs on the album pages match by content but not by filename** — the
  same photograph under a localised name. Those are exactly the *Image missing* + *Image added*
  rows this ticket exists to fold into one.
So the matcher below — *exactly one unclaimed `image-missing` and exactly one unclaimed
`image-added` at the same index in document order* — is probably the wrong design now. A digest
pairs without arity, without position and without an alt-text tiebreak. **Re-read the matcher
against the digest before building**, and if the digest wins, this ticket's *Traps* about
one-to-one pairing and document order lose their subject.
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

A rename becomes one row.

Today a renamed image makes two findings: `image-missing` on the old basename, which is `work`
and is in the search index, and `image-added` on the new one, which is `information` and is not.
So an editor reads two rows and joins them in their head, and a search for the **new** filename
finds nothing in any store. The one image change most worth tracing is the one the log describes
worst.

After this ticket, `max.svg → max-new.svg` is a single decidable finding that names both
filenames, and both names are searchable.

Write **a new ADR** before starting — the next free number at the time. (0023 was reserved
here and has since been taken by an unrelated decision; see `docs/adr/README.md`.) This is the first class in a closed vocabulary whose matcher
is not textual equality, and that is the decision the ADR carries.

## Criteria

- [x] The ADR is written: the class, its test, the alternatives refused, and why the run log's
      no-re-attachment rule is not implicated — the pairing is a rule over one page's data from
      one crawl, and never a match between finding ids over time.
- [x] One new class in `compare/vocabulary.mjs`, taking it from 32 to 33, with a key, a label in
      sentence case, a meaning and a visibility. Visibility is **`work`**.
- [x] The **detail is the arrow**, in the manner of `heading-level`'s `h2 → h3`, so it joins the
      finding id and a second rename asks again.
- [x] The class carries **no direction**: nothing is lost and nothing is added.
- [x] Pairing requires **arity and position, both**: exactly one unclaimed `image-missing` and
      exactly one unclaimed `image-added` on the page, at the same index in document order.
      One-to-one only, never many-to-many.
- [x] Equal `alt` text raises the row's **score**. It does not gate the pairing, because `alt` is
      often empty.
- [x] The rename **resolves before the singles are emitted**, so no image record is on two rows.
- [x] A search for the new basename returns the finding.
- [x] The `CONTEXT.md` entry for the class and its label.
- [x] `npm test`. 1,424 tests, 66 files, green. Typecheck and lint clean.

## Traps

- **Do not pair across pages or across stores.** The rule reads one page's two sides. Cross-store
  corroboration would make a finding depend on another store's crawl, and every finding here is
  page-scoped and store-scoped by construction. Let corroboration be what the search shows.
- **Do not make it `information`.** An undecidable rename cannot be dismissed and is not indexed,
  which kills both halves of the point. The denominator grows the day this ships; absolute counts
  already sit beside every percentage, which is exactly why.
- **Do not touch the basename key.** The comparison is set-based on the basename because
  full-path matching scored 2.8%. Parked ticket 45 records the asset convention that makes the
  key language-independent — the locale is a path segment and filenames are always English and
  semantic.
- **This is not parked ticket 45.** That ticket compares one store's image set against another's,
  on axis B, and stays parked. This makes no cross-store comparison at all.
- **Do not offer the pairing as a suggestion an editor confirms.** It is measured or it is not.

## Where it came from

A grilling session, 2026-08-19. The arrow `max.svg → max-new.svg` was load-bearing in two
prototypes and existed nowhere in the data. The choice was between deriving it from prior
dismissals — which ADR 0004 forbids in writing — and measuring it from the images check. This is
the second.

## Comments

**2026-08-21 — the digest was re-read, and refused here.** The note at the top of this ticket
asked for exactly that, so the answer is on the record.

The digest is the better matcher and `BYTES.md` is right about it. It cannot be built from this
ticket's seam: the comparison is pure and offline (ADR 0001) and **no crawl stage fetches an
image**, so it needs a new fetch-and-hash stage over 2,342 originals, a new `ImageRecord` field
and a re-crawl of the corpus before one finding moves. That is cost and not impossibility — the
probe fetched 2,341 of them — which is why it is a ticket and not a refusal:
`./12-a-renamed-image-is-paired-by-content.md`.

Two things settled the split. First, the digest is available on **less** of the corpus than it
looks: the original url only reaches the extract as `fullSrc`, which ADR 0026 puts there for a
photo wrapped in an opening link, and production's bare `<img src>` is a Cloudflare-resized
variant. `max.svg → max-new.svg`, this ticket's own case, is an ordinary content image with no
`fullSrc` and would get no digest at all. Second, the two matchers want the **same class**:
nothing in the vocabulary entry, the arrow, the two searchable names or the
resolve-before-singles ordering changes when the digest lands, so shipping the arity rule now
loses nothing and ticket 12 replaces one function.

**What that costs, measured and not glossed.** One-to-one arity is a strong filter and the
gallery pages are where it bites hardest. An album page that renamed a dozen photos has a dozen
unclaimed images on each side, so the rule declines all of them: of the 402 album-page pairs
`BYTES.md` matches by content and not by filename, this matcher claims **almost none**. What it
answers is the ordinary page with one changed image. ADR 0027 has a section saying so, headed
*How much this matcher answers, said plainly*, so nobody reads the class's existence as the
gallery problem being solved.

**Two things the review caught, both fixed with a test.**

- The rank was computed **before** the campaign filter, so a campaign banner one side carries
  and the other does not shifted every image below it and declined a rename the rule means to
  make. Campaign artwork now leaves before the ranking.
- The score returns 0.5 both where the alt is empty and where the two alts **disagree**. That is
  deliberate and now documented as such: both are *the alt does not corroborate*, and two alts
  that disagree are not evidence against a rename either, because a page that renamed an image
  is a page somebody edited and the alt is what they edited.

**One existing test changed.** `gives a one-sided image finding no heading on the side it is not
on` was, by accident, exactly a rename — one image lost and one gained at the same rank — so the
new class claimed it. It gained a second image that is on both sides, which puts the two singles
at different ranks and lets the test go on asking what it asked: which side a heading is on.
