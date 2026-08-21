# 12 — A renamed image is paired by content

Type: task
Status: needs-triage — written 2026-08-21 as the named follow-up of ticket 02 and ADR 0027,
not yet triaged by a human. It is the ticket that makes ticket 02's class earn its keep.
Blocked by: None technically. It needs a crawl stage that does not exist, so it is the
larger of the two halves and it is not a quick follow-up.
Parent: ../PRD.md

## What to build

`image-renamed` exists and pairs almost nothing.

Ticket 02 landed the class — `work`, no direction, the arrow as its detail, both basenames in
the two searchable columns — and paired it with **arity and position**: exactly one unclaimed
`image-missing` and exactly one unclaimed `image-added`, at the same rank in their own side's
image order. ADR 0027 says out loud what that costs. An album page that renamed a dozen photos
has a dozen unclaimed images on each side, so the rule declines every one of them, and of the
**402** album-page pairs `../../gallery-opening-links/BYTES.md` matches by content and not by
filename, the shipped matcher claims almost none. What it answers is the ordinary page with one
changed image.

This ticket replaces `renamedImage()` in `compare/images.mjs` with a **content digest** of the
original, and nothing else about the class. Measured in `BYTES.md` on 2026-08-19:

- Pairing rises from **19.6% by filename to 70.3% by content** on the album pages the new site
  renders.
- **Not one pair matches by filename and differs by content — zero, across all 52 pages.** So
  the match is exact, needs no threshold, and strictly contains what filename matching finds.
- Every one of the 2,341 originals is `image/jpeg`. Nothing suggests a re-encode, so a
  perceptual hash has no work to do and no threshold has to be chosen or defended.

## What makes it big

The comparison is pure and offline (ADR 0001) and **no crawl stage fetches an image**. That is
cost and not impossibility — `crawl/probes/probe-gallery-image-bytes.mjs` already fetched 2,341
originals live — but the cost is the ticket:

- A new crawl stage that fetches and hashes, over 2,342 originals on the 52 gallery pages alone,
  on both sides, with whatever caching keeps a re-crawl affordable.
- A new field on `ImageRecord` carrying the digest, and the contract entry for it.
- A re-crawl of the corpus before a single finding changes.
- An answer for an image the new site's own page references and does not serve: `BYTES.md` found
  one such 404, with an HTML body, and a fetching stage meets that case on every run.

## What it does not change

The class, its key, its label, its visibility, the arrow, the two searchable basenames and the
resolve-before-singles ordering are all ticket 02's and all stay. **One function is replaced.**
Whether the arity rule survives beside the digest as a fallback for images with no original url
is this ticket's to decide and not ticket 02's.

## Traps

- **The digest is available on less of the corpus than it looks.** The original url only reaches
  the extract as `fullSrc`, which ADR 0026 puts there for a photo wrapped in an opening link.
  Production's bare `<img src>` is a Cloudflare-resized variant and will not digest equal to the
  new site's. `max.svg → max-new.svg`, ticket 02's own case, is an ordinary content image with
  no `fullSrc` and gets no digest at all — so this ticket is the **gallery** half, and deleting
  the arity rule would lose the half ticket 02 shipped.
- **Do not pair across pages or across stores.** ADR 0027's rule, unchanged by the matcher: one
  page's two sides, from one crawl.
- **Re-classification expires overrides.** A pair that becomes `image-renamed` mints a new id
  and any decision on the two singles is gone. Ticket 08's recorded cost, and 402 pairs is the
  scale of it here.

## Where it came from

ADR 0027, written 2026-08-21, which refuses the digest for ticket 02 and names this file.
