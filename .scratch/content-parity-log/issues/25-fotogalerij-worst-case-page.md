# 25 — `fotogalerij`: the worst-case page

Type: grilling
Status: resolved 2026-08-11 — the migration is unfinished
Blocked by: —
Parent: ../map.md

## Question

Production's `fotogalerij` holds **178 text elements** and **81 images**. The new
site's holds **9 text elements**, **38 images** and **45 links**. Both sides
answer 200. Is this the largest genuine parity defect in the nl store, or a
deliberate redesign of the gallery into a pure image grid — and either way, what
does the log do with a page that can emit about 170 findings on its own?

## Why this is a sharp question

Ticket 19 measured the near-empty band while designing its guard and found this
page sitting in it. It is the extreme case of the parity axis on live data:

| | production | new |
|---|---|---|
| text elements | 178 | 9 |
| images | 81 | 38 |
| links | 178 | 45 |
| markdown bytes | 13,939 | 156 |

Under ticket 02's rules almost every production element pairs with nothing, so
almost every one becomes a `structure` finding. `algemene-fotogalerij` shows the
same 178 elements against a new-site **404**, so ticket 20 owns that twin; this
one is pure parity and ticket 20 cannot take it.

Ticket 19 ruled out a ratio guard **because** this page occupies the band: 9
against 178 is a real page, so no threshold can separate "unrendered" from
"redesigned". That leaves the question to a human, which is this ticket.

## What to settle

- **Defect or redesign?** A gallery of 81 captioned photos rebuilt as a grid of
  38 uncaptioned ones is a content decision somebody made. If it was deliberate,
  ~170 findings are all noise on the busiest page in the store. If it was not,
  it is the biggest single thing the log has found.
- **One judgement or 170?** If it is deliberate, does an editor dismiss 170
  findings one at a time? Ticket 09 made bulk dismissal a UI action that writes N
  events, not a third key — is that enough here, or does this page want a
  page-level `muted`?
- **Does the bar survive it?** Ticket 09's bar counts shown classes on the
  snapshot. One page with 170 open findings dominates the store roll-up and makes
  every other page's progress invisible.
- **Does the tab survive it?** Ticket 12 chose Variant A's tabbed ledger with the
  two sides next to each other. A 178-against-9 diff is the stress test of that
  layout, and it was never prototyped at this size.
- **Are the other gallery pages the same shape?** `fotogalerij/zonwering` is 178
  against 9, `fotogalerij/glazen-schuifwand` 97 against 9,
  `fotogalerij/serre` and `fotogalerij/tuinkamer` 69 against 9,
  `fotogalerij/verlichting` 66 against 9. Six pages, one decision or six?

## Notes

Graduated from ticket 19.

Measurements in `data/probe-extract-v2.json` in `tm-content-parity`, re-made with
`node crawl/probes/probe-extract-v2.mjs`.

Resolve with `/grilling`. The defect-or-redesign half needs a human who knows
what the gallery was meant to become.

## Measured 2026-08-06 by ticket 26

The gallery pages are now the two worst pages in the store, by the log's own
count: `fotogalerij/zonwering` **401** shown findings and `fotogalerij` **395**,
against a median of 41 and a best of 6. `fotogalerij/glazen-schuifwand` is fifth
at 225.

So this ticket is no longer hypothetical: whatever it decides changes the top of
the dashboard. Note that these are `cms-page` on both sides, not category pages,
so ticket 27 does not cover them.

## Grilled 2026-08-07 — on hold

The ticket stays open. The text half is settled. The image half is not, and it
cannot be settled from one crawl.

### Settled: the text is a redesign, not a loss

Production renders each gallery tile three times: an `h2` title, a `<p>` caption,
and an `alt` on the image. The new site renders it once, as the `alt`.

- 30 of the 32 non-empty new alts on `fotogalerij` match a production `h2`
  exactly or near-exactly. Only 2 match nothing.
- Production's own alts already mirror the `h2` and not the caption. The new site
  keeps that convention.
- The 178 production elements are 79 headings + 82 text + 17 cta. About 157 of
  them are the per-image title and caption pairs. Only 2 elements are editorial
  prose, and they are emitted twice.

So the 155 `text-missing` findings are the loss of a duplicate render. Do not
read them as lost copy.

The new side of all six pages is one template: an `h1`, the label
"Bekijk foto's van:", and seven sibling nav links. It is a hub page. Eight of the
nine elements are navigation.

### Not settled: is the image migration finished?

There is a third state that the first pass of this ticket missed. The pages are
not only "defect" or "redesign". They can also be **not finished yet**, and a
half-migrated page and a broken page look the same in one snapshot.

The signals that say unfinished:

- Empty alt on 4 of the 7 comparable pages. `fotogalerij/zonwering` has 0 of 16,
  `fotogalerij/carport` 0 of 4, `serre` and `tuinkamer` 10 of 26.
- `fotogalerij/serre` and `fotogalerij/tuinkamer` are byte-identical on both
  sides. Two URLs, one page.
- The image counts move in both directions. `glazen-schuifwand` goes up, 42 to
  50. `zonwering` goes down, 81 to 16.
- Only 12 of 81 assets on the parent page pair, after the key strips the
  directory and the size suffix.

### Two facts that make the counts unreliable

**The counts punish a production bug.** Production serves the same 81-image
master gallery at `fotogalerij`, `fotogalerij/zonwering` and
`algemene-fotogalerij`. The three bodies are byte-identical, 178/81/13939. The
new `fotogalerij/zonwering` serves a real zonwering set of 16. The overlap is
zero and the page scores 80 `image-missing`. On that page the log penalises the
new site because it filtered a gallery that production forgot to filter.

**`image-missing` cannot see a rename.** Pairing keys on the basename alone
(`shared/keys.mjs:40-52`, `compare/images.mjs:31-35`). The migration re-uploaded
the albums under new names in a new directory, from
`/media/resized/.../lof/gallery/album/` to `/media/wysiwyg/General/special/album/`.
A photo that was renamed counts once as `image-missing` and once as
`image-added`. So 68 is an upper bound on lost photos, not a count of them.

Note that this is a suspicion, not a measurement. It comes from filename pairs
such as prod `antraciet_schuifwanden_vlonder_1.jpg` against new
`antraciet_glazen-schuifwand_vlonder_1.jpg`. Nobody has confirmed that these are
the same photo.

### The one measurement that would move this ticket

Perceptual hashing of the unpaired images. Fetch both sides, make them grayscale,
downscale to 32x32, do a DCT, keep the low-frequency block, and compare the
Hamming distance. It survives re-encoding and resizing, which is necessary here:
production serves 253x168 thumbnails and the new site serves originals. A byte
comparison, a file size comparison and EXIF are all useless for that reason.

Run it only on the leftovers of the exact-basename pass. On the parent page that
is 69 production images against 26 new ones, so about 95 fetches.

The result reads as follows:

- Most unpaired production photos have a near-duplicate on the new side. The
  albums were repopulated and renamed. The count is noise.
- They do not. The photos are gone and the migration is unfinished.

This belongs in `crawl/probes/` as a one-time measurement, not in the pipeline.
The crawl must not fetch every image on every run.

### A question the log can never answer

A perceptual hash tells you that two files hold the same photo. It does not tell
you that the new filename and the new alt are **correct** for that photo. If
`antraciet_schuifwanden_vlonder_1.jpg` becomes
`antraciet_glazen-schuifwand_vlonder_1.jpg` and the photo shows no schuifwand,
the file exists, the hash matches, and the content is still wrong. Both sides
have an image, so no parity rule can see it. That needs an eye on the picture. It
is an asset-metadata audit and it is not this log's job.

### A defect this log is blind to today

Alt text is compared only after a successful key match
(`compare/images.mjs:69-90`). `fotogalerij/zonwering` matches zero keys, so all
16 of its images are `image-added` and none of them get an alt check. All 16 have
an empty alt.

So the log emits about 400 findings of noise on that page and zero findings for
the one real regression on it. A rule that flags an empty alt on any new-side
image, paired or not, would catch it. That is a one-sided quality rule, not a
parity rule, and it needs its own class and a test.

### Why it is on hold

The next step is human, not mechanical. The owner will rebuild the page structure
by hand and compare it against the live page, to see what is inconsistent and
what is missing. That answers "unfinished or finished" in a way that no crawl of
one snapshot can.

Do not mute anything in the meantime. A mute on `image-missing` would hide
exactly the number that we want to watch.

## Resolved 2026-08-11 — the gallery will be re-uploaded

**The image migration is not finished.** The gallery is to be uploaded again. That
is the one question this ticket was on hold for, and it is answered by the owner of
the work and not by a crawl.

`to-questionnaire-fotogalerij-migration.md` was written on 2026-08-11 to ask it. Its
first question is *"Is the image migration for the `fotogalerij` pages complete, or
is work still outstanding?"*, and it says that if the answer is "still outstanding",
most of the rest can wait. It can. The questionnaire is **not answered** and it is
kept as the list of questions to ask when the upload is done.

**So the images are neither a defect to raise nor noise to hide.** They are a
migration in progress, and the count is the thing that watches it.

- ~~**Do not mute `image-missing` on these pages.**~~ The instruction in **Why it is on
  hold** stands, and it now has a reason with a date on it. — **2026-08-13, ADR 0011: it
  cannot be disobeyed any more.** There is no mute, so nothing can take the count out of
  the denominator and hide the migration this ticket is watching. The reason it was written
  is the reason the mute went.
- **Do not read the image numbers as a parity result.** 81 → 38 on `fotogalerij` and
  81 → 16 on `fotogalerij/zonwering` describe an unfinished upload, and the two facts
  in **Two facts that make the counts unreliable** still apply on top of that.
- **The text half is settled and unchanged.** It is a deliberate redesign to hub
  pages, decided on 2026-08-07 and recorded in **Settled: the text is a redesign, not
  a loss**. This resolution does not touch it.
- **Re-check after the upload**, and ask the questionnaire then. The empty `alt` on
  every new image of `zonwering` and `carport` is the one plausible regression, and
  it is unreadable until the images are final.

**The follow-ups below stay unfiled.** They depend on the *finished* shape of the
gallery, which does not exist yet. This ticket resolving is not the trigger; the
upload is.

### Follow-ups, not filed

Do not file these until the gallery is uploaded again. They all depend on its final
shape.

- An empty-alt rule for unpaired new-side images.
- A second image pairing pass for the leftovers, so a rename does not score
  twice.
- Production's byte-identical bodies at three URLs.
- `fotogalerij/serre` and `fotogalerij/tuinkamer` as one page at two URLs.

### Numbers, as measured on 2026-08-06

| page | prod elem/img | new elem/img | new alts set | keys paired |
|---|---|---|---|---|
| `fotogalerij` | 178 / 81 | 9 / 38 | 32 of 38 | 12 |
| `fotogalerij/zonwering` | 178 / 81 | 9 / 16 | 0 of 16 | 0 |
| `fotogalerij/glazen-schuifwand` | 97 / 42 | 9 / 50 | 49 of 50 | 13 |
| `fotogalerij/serre` | 69 / 28 | 9 / 26 | 10 of 26 | 1 |
| `fotogalerij/tuinkamer` | 69 / 28 | 9 / 26 | 10 of 26 | 1 |
| `fotogalerij/verlichting` | 66 / 25 | 9 / 22 | 21 of 22 | 19 |
| `fotogalerij/carport` | 26 / 5 | 9 / 4 | 0 of 4 | 2 |

The ten `fotogalerij` pages hold 17.0% of all nl findings and sit on 5.6% of the
nl pages. Across all stores they are 3,019 of 34,559 findings, or 8.7%.
