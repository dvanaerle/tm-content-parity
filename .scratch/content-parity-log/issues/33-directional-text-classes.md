# 33 — The class vocabulary: direction, and the changes the log cannot see

**What to build:** an editor opening any page can tell, without inspecting the
columns, whether production lost something or the new site invented something —
and a heading demoted from `h2` to `h3` stops being reported as identical.

Today `structure` is 61% of everything shown and says only "the element is on one
side only". A dropped paragraph and an invented one carry the same word, and the
invented ones are mostly a PageBuilder rebuild rather than a defect. Separately,
the pairing matches on normalised text while ignoring tag and kind, so **762
elements on 67 pages** match on text but differ in tag or heading level and are
rendered as *"gelijk"* — 467 of them a heading-level change.

After this ticket the log says less and means more: the invented side goes quiet,
and 467 real structural regressions appear for the first time, including the 16
pages where the new site dropped its `h1`.

**Blocked by:** None — can start immediately.

**Status:** resolved — built on branch `axis-a-compare-and-log`.

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 1.

- [x] `structure` is retired. `text-missing` (production has it, the new site
      does not) is **shown**; `text-added` (the new site has it, production does
      not) is **hidden**. Same directional split as `missing-link`/`extra-link`
      and `image-missing`/`image-added`.
- [x] Two elements that match on normalised text but differ in tag or heading
      level stop being an exact match and become a finding: `heading-level`
      (**shown**) when either side is a heading, `tag-changed` (**hidden**)
      otherwise. `compare/text.mjs`, `classifyExactPair()`.
- [x] A pair with the same text and the same tag is still an exact match and
      emits nothing.
- [x] The closed class vocabulary goes from 18 to 21, each with its check and
      shown/hidden default, and the browser reads it through the existing
      browser-safe module (`compare/vocabulary.mjs`, read by
      `web/src/lib/classes.mjs`). **No `axis` was added:** the map has ticket 39
      adding `axis` to this same table *after* 33 lands, and doing it here would
      be resolving 39. The word in this line is a slip from spec 32's testing
      section.
- [x] The 0.6 pair threshold is **not** touched. `PAIR_THRESHOLD` is unchanged.
- [x] **Measurement written into `map.md` between the two changes above.** Three
      measurements, not two: the extraction bug fix below moves the numbers as
      well, so it is measured on its own.
- [x] The 434 cases where `kind` changes (mostly `a` → `h3`) are sampled and
      judged. **They are an extraction artefact, and it is fixed here.**
      Production builds every FAQ question as
      `<h4 class="panel-title"><a data-toggle="collapse" …>`; the leaf rule made
      the anchor speak and threw the heading level away. Sampled 12 of the 40
      affected pages by fetching production: **135 of 137 anchors sit directly
      inside an `<h4>`**. The fix is *a heading is never a container*
      (`crawl/extract.mjs`). `a` → `h3` (330) became `h4` → `h3` (331), and
      `kind` changes fell from 434 to 98. The same leaf rule was also losing
      content outright on `<h2>Bekijk onze <a>carports</a> nu</h2>`, where the
      anchor was reported and the words around it disappeared.
- [x] Overrides keyed on `structure` detach. Accepted and recorded, not
      migrated — see below.
- [x] Tests at the existing compare and contract seams, plus the extract seam for
      the bug fix. `structure` gone from the contract; finding ids for untouched
      classes unchanged, pinned by a literal. **161 tests green.**

## Measurements

Baseline reproduced from the reports on disk before any change, and it matched
the ticket exactly: 10,076 findings, 8,573 shown, median 41, 179 crawled, 124
comparable. `compare/measure.mjs` is the new command that takes these, so the
regression gate is repeatable rather than an ad-hoc one-liner.

| | findings | shown | median shown | crawled | comparable |
|---|---|---|---|---|---|
| baseline | 10,076 | 8,573 | 41 | 179 | 124 |
| **1. directional split** | 10,076 | **7,010** | **34.5** | 179 | 124 |
| **2. + `heading-level` / `tag-changed`** | **10,814** | **7,477** | **37** | 179 | 124 |
| **3. + the heading-leaf bug fix** | 10,796 | 7,456 | 37 | 179 | 124 |

The two vocabulary changes move the count in opposite directions, exactly as the
ticket said, and measuring them as one number would have hidden both:

1. The split is a **rename and nothing else** — total holds at 10,076 while shown
   falls 1,563. The 5,049 `structure` findings split into **3,486 lost** and
   **1,563 invented**, and hiding the invented side is where the whole reduction
   comes from.
2. The new classes **add** 738 findings, of which **467 are shown**, and put the
   median back up from 34.5 to 37. 271 `tag-changed` are hidden.
3. The bug fix is close to neutral on the totals (−18 findings) because it
   changes *which* element a finding names rather than how many there are.

Net against the baseline: **8,573 → 7,456 shown, median 41 → 37**, with 469
structural regressions reported that the log could not see at all before. 179
crawled and 124 comparable held at every step.

## The override detach, recorded

`class` is both the rule id and the mute key, so retiring `structure` orphans any
override keyed on it: a `fixed`, `dismissed` or `reviewed` event on a
`structure` finding no longer matches any finding, and a mute on
`nl|<page>|structure` no longer matches any class. Nothing is migrated and no
back-compatibility alias is added, per spec 32 decision 4 and ticket 08. It is
free today because the Supabase project carries no override data yet (ticket 13
is still the open risk), and it will never be cheaper.

Every finding id in the `heading-level` and `tag-changed` classes is new, and
every id in the other 17 classes is unchanged — `contract.test.mjs` pins one with
a literal so a future change to the id recipe cannot pass silently.

## Left for another ticket

**User story 24 — "a page whose first heading is not an `h1` surfaced" — is not
closed by this ticket, and is not one of its acceptance criteria.**
`heading-level` needs the text to be *identical* on both sides, so it surfaces
only the 6 pages where an `h1`'s own words moved into another tag. A page where
the new site dropped the `h1` text as well is `text-missing`, which is honest but
does not say "the outline is broken".

Re-measured after the bug fix: **11 pages start on a non-`h1` heading** on the
new site and **3 carry no `h1` at all** (production also none on 1 of the 3),
against spec 32's 16 and 8. The fix explains the fall: production wraps some
`h1`s in an anchor too, so those pages *looked* as though they started on a lower
heading. An outline-shape rule needs an owner — ticket 36 is the nearest.
