# A renamed image is paired by arity and position

A renamed image makes two findings today. `max.svg` leaves production's page as an
`image-missing`, which is `work` and is in the search index; `max-new.svg` arrives on the new
site as an `image-added`, which is `information` and is not. An editor reads two rows and joins
them in their head, and a search for the **new** filename finds nothing in any store. The one
image change most worth tracing is the one the log describes worst.

The images check compares basenames as a set (ticket 06), because full-path matching scores
2.8%: production resizes through Cloudflare and the two environments carry different catalog
cache hashes. A rename defeats a set comparison by construction — the two sides share no key —
so nothing about the existing check can be tightened into an answer. A new class is needed, and
its matcher is not textual equality. That is the first such matcher in a closed vocabulary
where every other class fires on two strings being different, which is why this decision is
written down.

## The decision

**A new `work` class, `image-renamed`, labelled *Image renamed*, is emitted when exactly one
unclaimed `image-missing` and exactly one unclaimed `image-added` sit at the same position in
their own side's image order.** Both basenames are on the finding — production's in `prod`, the
new site's in `new` — and the detail is the arrow, `max.svg → max-new.svg`, in the manner of
`heading-level`'s `h2 → h3`.

Four properties of that sentence carry weight.

**Arity and position, both.** One-to-one only, never many-to-many. A reader can verify that the
fourth image on one side is the fourth image on the other; they cannot verify which of three
became which of three. This is `regrouped`'s rule about runs, applied to images: a member the
other side already answers for is what separates a rename from a page somebody re-illustrated.

**No direction.** Nothing is lost and nothing is added — one image is under a new name — so the
class carries no `direction` field, and the `lost`/`added` visibility rule has no subject here.
It is `work` and not `information`: an undecidable rename cannot be dismissed and is not
indexed, which kills both halves of the point. The denominator grows the day this ships, and
absolute counts already sit beside every percentage, which is exactly why they do.

**Equal alt text raises the score and does not gate the pairing.** `alt` is often empty and on
this corpus an empty alt on both sides is parity rather than a finding, so a rule that required
the alt to agree would answer nothing on most pages. The score is 1 where both sides carry the
same non-empty alt and 0.5 where the alt says nothing. It corroborates a pairing the arity and
the position already made.

**The rename resolves before the singles are emitted.** No image record is on two rows. This is
`regrouped`'s ordering — within a page the merge resolves first — for the same reason: a row an
editor can act on must not also be counted somewhere else.

## The test

The seam is `compareImages()`, and the assertions are about which findings come out for two
pages of image records — never about how the predicate is written. A page whose only difference
is one basename yields one `image-renamed` and no singles; two missing against one added yields
the singles it yields today; the same two names at different positions yield the singles too.

## How much this matcher answers, said plainly

One-to-one arity is a strong filter, and the gallery pages are where it bites hardest. An album
page that renamed a dozen photos carries a dozen unclaimed images on each side, so the rule
declines every one of them and the page reads exactly as it reads today. Of the 402 album-page
pairs `BYTES.md` matches by content and not by filename, this matcher claims **almost none**:
those pages were renamed by the album and not by the image.

What it does answer is the ordinary page with **one** changed image, which is where
`max.svg → max-new.svg` came from and where an editor reads two rows and joins them by hand.
This is written down so that nobody reads the class's existence as the gallery problem being
solved. The class, its visibility and its two searchable names are what the ticket asked for and
they are right whatever pairs them; the arity is the honest limit of pairing without the bytes,
and the ticket that lifts it is named below.

## Alternatives refused

**A content digest of the image bytes.** This is the strong answer and it is refused *here*, not
in general. `.scratch/gallery-opening-links/BYTES.md` measured it on 2026-08-19: pairing rises
from 19.6% by filename to 70.3% by content on the album pages the new site renders, not one pair
matches by filename and differs by content, and 402 of 557 content pairs are exactly the
*Image missing* + *Image added* couples this class exists to fold into one. A digest pairs
without arity, without position and without an alt tiebreak.

It cannot be built from this seam, and that is a **cost** and not an impossibility — the probe
fetched 2,341 originals, so nothing about it is out of reach. The comparison is pure and offline
(ADR 0001) and no crawl stage fetches an image, so the digest needs a new fetch-and-hash stage
over the 2,342 originals the 52 gallery pages alone carry, a new field on `ImageRecord`, and a
re-crawl of the corpus before a single finding changes.

It is also available on **less** of the corpus than it looks: the original URL
only reaches the extract as `fullSrc`, which ADR 0026 puts there for gallery photos wrapped in
an opening link, and production's bare `<img src>` is a Cloudflare-resized variant that will not
digest equal to the new site's. `max.svg → max-new.svg`, the case this ticket is named for, is
an ordinary content image with no `fullSrc` and would get no digest at all.

So the digest is a **better matcher for the same class**, and it is its own ticket —
`.scratch/cross-store-reuse/issues/12-a-renamed-image-is-paired-by-content.md`, which is what
turns a handful of findings into the 402. Nothing here is thrown away when it lands: the class,
its label, its visibility, the arrow, the two searchable basenames and the
resolve-before-singles ordering are all untouched by which rule does the pairing. What the
digest replaces is one function, and it replaces it for the gallery pages where the original URL
exists.

**Gating on equal alt text.** Refused above: it answers nothing where the alt is empty, which is
most of the corpus.

**Pairing across pages or across stores.** Refused. The rule reads one page's two sides. Every
finding here is page-scoped and store-scoped by construction, and cross-store corroboration
would make a finding depend on another store's crawl. Let corroboration be what a search shows:
the class is `work`, so both basenames are in the index, and an editor typing `max-new.svg` sees
the six stores that hold it.

**Deriving the arrow from prior dismissals.** Refused in writing by ADR 0004. The arrow was
load-bearing in two prototypes and existed nowhere in the data; the choice was between reading
it out of the override log and measuring it from the images check, and this is the second.

**Offering the pairing as a suggestion an editor confirms.** Refused. It is measured or it is
not. A control that asked *is this the same image?* would put a judgement on the screen that the
log has no way to record and no way to re-derive on the next crawl.

## Why the no-re-attachment rule is not implicated

ADR 0004 forbids the history from re-attaching: a finding id is a hash and a dismissal expires
when the strings behind it move. Nothing here reaches for that.

The pairing is a rule over **one page's data from one crawl**. Its inputs are the two extracts
in front of it — which basenames each side holds, in which order, with which alt — and it never
reads a finding id, an override, an event or a previous observation. It is a match between two
image records inside one comparison, and never a match between findings over time. Run the
comparison twice on the same two extracts and it answers the same; run it on a page that changed
and it answers about that page.

The ordinary consequence does follow and is accepted, as it is for every class: the id is a hash
over the store, the page, the check, the class and the two strings, so the day a page's rename
becomes an `image-renamed` instead of an `image-missing` and an `image-added`, the old ids are
gone and any decision on them expires. That is ticket 08's recorded cost of a
re-classification, not a new mechanism.
