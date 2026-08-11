# Fotogalerij migration — is it finished?

**Purpose:** the content-parity log flags ~400 findings each on `fotogalerij` and
`fotogalerij/zonwering`, the two worst pages in the nl store. We can tell from
the crawl that the *text* half is a deliberate redesign. We cannot tell from any
crawl whether the *image* half is a redesign or a migration that is still in
progress. That answer decides whether we mute ~2,000 findings as noise or raise
them as the biggest defect the log has found.

**From:** d.aerle (content-parity log) — **To:** the owner of the gallery
migration on the new site — **How your answers will be used:** they resolve
ticket 25 in `.scratch/content-parity-log/issues/`, and they decide four
follow-up changes to the comparison rules that are currently on hold.

## Context

We run an automated comparison between the production site and the new site,
page by page, and record every element that exists on one side and not the
other. The gallery pages dominate the results: the ten `fotogalerij` pages carry
17% of all nl findings while being 5.6% of the pages.

We already worked out that the text difference is not a loss. Production renders
each photo's title three times — as an `h2`, as a `<p>` caption, and as the
image `alt`. The new site renders it once, as the `alt`, and 30 of 32 new alts
match a production `h2`. The new pages are hub pages: an `h1`, "Bekijk foto's
van:", and seven nav links. That is settled and we are not asking about it.

What we cannot settle is the images. Production's `fotogalerij` has 81; the new
one has 38, and only 12 of those pair by filename. `fotogalerij/zonwering` goes
from 81 to 16 with zero pairing. `fotogalerij/glazen-schuifwand` goes *up*, 42 to
50. Counts moving in both directions, plus empty alt attributes on four of the
seven pages, is exactly what a half-done migration looks like — and also exactly
what a finished redesign looks like, from the outside. Only you can tell them
apart.

## How to answer

Please answer inline under each question, in whatever detail you have. Roughly
20–30 minutes. **Deadline: end of this week** — the ticket blocks four rule
changes, and until it resolves we are deliberately not muting anything.

Partial answers and "I don't know" are genuinely useful. If a question rests on
a wrong assumption about how the migration ran, say so — that is itself an
answer. Flag anything you're unsure of rather than skipping it.

## Is the migration finished?

### Is the image migration for the `fotogalerij` pages complete, or is work still outstanding?

_Why this matters: this is the single blocking question. Everything below is a
refinement of it, and if the answer is "still outstanding" most of the rest can
wait._

>

### If work is outstanding, what is left to do, and on which pages?

>

### Is there a date, ticket, or backlog item that tracks the remaining gallery work?

>

### `fotogalerij/zonwering` went from 81 production images to 16 new ones, with zero filename overlap. Is that 16 the intended final set?

_Why this matters: production serves the same 81-image master gallery at
`fotogalerij`, `fotogalerij/zonwering` and `algemene-fotogalerij` — the three
page bodies are byte-identical. If the new site filtered that gallery down to a
real zonwering set, our log is penalising you for fixing a production bug._

>

### `fotogalerij` itself went from 81 to 38. Is that a curated subset, or the remainder of an unfinished upload?

>

## The renames

### Were the album images re-uploaded under new filenames during the migration?

_Why this matters: our comparison pairs images on filename alone. A renamed
photo is counted twice — once as missing, once as added — so our headline number
of 68 lost photos on the parent page is an upper bound, not a count._

>

### Is this pair the same photo, renamed? Production `antraciet_schuifwanden_vlonder_1.jpg` vs new `antraciet_glazen-schuifwand_vlonder_1.jpg`.

_Why this matters: we inferred a rename convention from filename shapes and have
never confirmed it against a real pair._

>

### The path moved from `/media/resized/.../lof/gallery/album/` to `/media/wysiwyg/General/special/album/`. Was that a one-off move of existing assets, or were the albums repopulated from source?

>

### Is there a mapping anywhere — a spreadsheet, a script, a CSV — from old asset names to new ones?

_Why this matters: if one exists, we can pair renamed images directly and skip a
proposed image-fetching probe entirely._

>

### If no mapping exists: any objection to us fetching both sides of the unpaired images once, to compare them perceptually?

_Why this matters: roughly 95 image fetches per page, one time, not part of the
regular crawl. We'd rather ask than surprise your servers._

>

## One decision or seven?

### Do all the `fotogalerij` subpages share one migration decision, or were they handled individually?

_Why this matters: seven pages showing the same shape might be one policy or
seven separate states of completion, and we'd handle them very differently._

>

### `fotogalerij/serre` and `fotogalerij/tuinkamer` are byte-identical on both the production and the new site. Are these meant to be one page at two URLs?

>

### Should `algemene-fotogalerij` exist on the new site? It currently 404s against 178 production elements.

>

### Are any gallery pages intended to be retired rather than migrated?

>

## Alt text

### On `fotogalerij/zonwering` all 16 new images have an empty `alt`. Same for all 4 on `fotogalerij/carport`. Is alt text a step that hasn't run yet on those albums?

_Why this matters: our log is currently blind to this — it only checks alt text
after a filename match, and those pages match nothing. It's plausibly the one
real regression on the page, hidden under 400 findings of noise._

>

### Where does alt text come from in the new setup — is it authored per image, or derived from a title field?

>

### Should we add a rule that flags any new-site image with an empty alt, regardless of whether it pairs with production?

>

## What we do with the log in the meantime

### While this is unresolved, is it safe for us to treat the gallery text findings as noise and hide them?

_Why this matters: we're fairly confident about the text half, but hiding ~155
findings per page on your word is worth asking for explicitly._

>

### We will **not** hide the image findings until you answer above — that count is the thing we're watching. Does that match your expectation?

>

### Once the gallery is finished, who should own re-checking these pages — you, us, or a content reviewer?

_Why this matters: there is a class of error neither of us can automate. If a
photo is correctly present but its new filename and alt describe the wrong
product, every check we have passes and the content is still wrong. That needs
an eye on the picture._

>

## Anything else?

Is there anything about how the galleries were migrated that we haven't asked
about, and that would change how we read these numbers?

>
