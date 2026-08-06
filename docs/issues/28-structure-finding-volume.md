# 28 — 41 findings on a median page, 61% of them `structure`. Is that usable?

Type: grilling
Status: resolved — 2026-08-06, by the grilling session specified in
[32](32-scannable-log-and-six-stores.md)
Blocked by: —
Parent: ../map.md

## Answer

**`structure` is vague because it is two findings wearing one name.** It splits
directionally into `text-missing` (shown) and `text-added` (hidden) — the same
split ticket 05 made for links and ticket 06 for images, and the one check that
never got it. A PageBuilder rebuild invents elements; those stop being counted.

The other four questions:

- **The threshold stays at 0.6.** Not re-tuned, and deliberately not in the same
  pass — this ticket's own warning against moving the same rows twice was taken.
- **The bar is not re-based.** Ticket 29 built the overrides this ticket assumed
  were missing, so the denominator question was already answered elsewhere.
- **Diff stays the landing tab**, and the reason this ticket doubted it goes
  away: Diff and Content merge, matched rows show by default, and the tab stops
  being a wall of unexplained differences and becomes the page itself.
- **"Done" is unchanged.** No per-page target and no migration/drift split; the
  volume problem is answered by the class split, not by moving the finish line.

**Found while resolving, and larger than the question asked:** the pairing
matches on normalised text while **ignoring tag and kind**, so **762 elements on
67 pages match on text but differ in tag or heading level and are reported as
identical** — 467 of them a heading-level change. A heading demoted from `h2` to
`h3` is invisible to the log. Two new classes, `heading-level` (shown) and
`tag-changed` (hidden), close it. So this ticket both removes findings and adds
them.

## Question

The log runs. It reports **8,573 shown findings over 124 pages**, a median of
**41 per page**, and **no page is clean**. Can an editor work with that, and if
not, what changes — the rules, the presentation, or the expectation?

## The numbers

- 10,076 findings, **8,573 shown**, 11,417 raw occurrences.
- Median **41** shown per page. Worst `fotogalerij/zonwering` 401, `fotogalerij`
  395, `serre` 255, `terrasoverkapping` 245. Best `meettool` 6.
- **`structure` is 5,191 — 61% of everything shown**, and it holds at 59% whether
  or not the category pages are counted.
- Next: `missing-link` 1,555, `image-missing` 944, `link-target` 272, `copy` 270,
  `casing` 221.

Ticket 27 accounts for at most a third. This is the rest.

## Why `structure` dominates

`structure` means "the element is on one side only" — it is what the log says when
the **pairing found nothing**. So 61% is not a statement about the sites, it is a
statement about the alignment: production and the new site do not present the same
elements in a recognisable order.

The map already knew why, from the very first session: *production emits 9
`data-content-type` attributes on a page where the new site emits 246. Production
holds this content as plain HTML; the new site rebuilt it in PageBuilder. Section
structure is not comparable between the two sites.* Element-level alignment was
chosen **because** section structure was hopeless — and now the element level is
showing the same strain.

## What to settle

- **Is `structure` one finding or two?** Today a dropped paragraph and an added
  paragraph are two rows with the same class. A migration reviewer wants
  "production said this and the new site does not" separately from "the new site
  invented this" — which is exactly the split ticket 05 made between
  `missing-link` and `extra-link`, and ticket 06 between `image-missing` and
  `image-added`. Text is the one check that did not get it, and `extra-link` and
  `image-added` are both **hidden**. If `structure` splits the same way, a large
  part of the 5,191 goes quiet by the same argument that already convinced the map
  twice.
- **Is the 0.6 threshold right after all?** Ticket 02 raised it from 0.55 on the
  principle that a wrong pair is worse than no pair. That principle assumed
  unpaired rows are cheap. At 5,191 they are not. Measure the pairing rate at 0.5,
  0.55 and 0.6, and look at what the extra pairs actually are.
- **Is the bar's denominator honest?** The dashboard scales the bar by the
  production element count, because ticket 09's overrides do not exist yet. A page
  with 178 elements and 178 findings reads as 100% broken, which is true and
  useless.
- **What does "done" look like now?** The destination says an editor watches the
  count fall to zero. With no page clean on day one, zero is not a finish line an
  editor can believe in. Does the log need a per-page target, or a first pass that
  says "these 20 pages are the migration, the rest is drift"?
- **Does the volume change the landing tab?** Ticket 12 kept Diff first. At 41
  findings a page that is a wall, and Tasks — grouped by check, the shown classes
  only — may be the honest entry.

## Notes

Do **not** re-tune a number before the split question is settled: raising the
threshold and hiding half of `structure` would move the same rows twice and the
second change would be measured against a moved baseline.

Resolve with `/grilling`. The data is in `data/reports/`; the tool is at
`npm run dev` in `web/`.
