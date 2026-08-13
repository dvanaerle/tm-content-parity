# 33 — The class vocabulary: direction, and the changes the log cannot see

**What to build:** an editor opening any page can tell, without inspecting the
columns, whether production lost something or the new site invented something —
and a heading demoted from `h2` to `h3` stops being reported as identical.

Today `structure` is 61% of everything shown and says only "the element is on one
side only". A dropped paragraph and an invented one carry the same word, and the
invented ones are mostly a PageBuilder rebuild rather than a defect. Separately,
the pairing matches on normalised text while ignoring tag and kind, so **762
elements on 80 pages** match on text but differ in tag or heading level and are
rendered as *"gelijk"* — 467 of them a heading-level change. (Spec 32 said 67
pages. The probe re-measured 80, and every other number in that table reproduced
exactly.)

After this ticket the log says less and means more: the invented side goes quiet,
and 469 real structural regressions appear for the first time.

**Not the dropped `h1`.** `heading-level` needs the text to be identical on both
sides, so it reports the pages where an `h1`'s own words moved into another tag,
and not the pages that lost the words as well. Spec 32's user story 24 stays open.
See "Left for another ticket".

Blocked by: None — can start immediately.

Status: resolved — built on branch `axis-a-compare-and-log`.

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 1.

- [x] `structure` is retired. `text-missing` (production has it, the new site
      does not) is **shown**; `text-added` (the new site has it, production does
      not) is **hidden**. Same directional split as `missing-link`/`extra-link`
      and `image-missing`/`image-added`.
- [x] Two elements that match on normalised text but differ in tag or heading
      level stop being an exact match and become a finding: `heading-level`
      (**shown**) when either side is a heading, `tag-changed` (**hidden**)
      otherwise. `compare/text.mjs`, `classifyExactPair()`. The test is the tag
      alone, because `level` is derived from the tag in `crawl/extract.mjs` and
      cannot differ while the tag is equal.
- [x] Both of those findings carry a **`detail`** (`h2 → h3`), and it is part of
      the id. Added by the code review: their two sides of text are equal, so the
      record said "identical" and an `h2` → `h3` shared an id with an `h2` → `h4`
      on the same words — a demotion that got worse would have kept the editor's
      dismissal. `detail` joins the id key only when it is present, so no id in
      the other 19 classes moves. The Taken tab prints it; the Diff tab already
      showed the tag of each element.
- [x] A pair with the same text and the same tag is still an exact match and
      emits nothing.
- [x] The closed class vocabulary goes from 18 to 21, each with its check and
      shown/hidden default, and the browser reads it through the existing
      browser-safe module (`compare/vocabulary.mjs`, read by
      `web/src/lib/classes.mjs`). **No `axis` was added:** the map has ticket 39
      adding `axis` to this same table *after* 33 lands, and doing it here would
      be resolving 39. The word in this line is a slip from spec 32's testing
      section.

      ⚠️ **This criterion was amended by the implementer**, from "check, axis and
      shown/hidden default" to "check and shown/hidden default". The reason is
      above and ticket 39 owns the word, but the change is a build ticket editing
      its own acceptance criterion, so it needs a human to agree. Raised by the
      code review of 2026-08-06.
- [x] A one-sided class carries `direction` (`lost` or `added`), and the
      shown/hidden default follows from it. Added by the code review: the rule
      "lost is shown, invented is hidden" was spelled out in three names in
      `web/src/lib/classes.mjs` and again in three names in the test, so the
      colour could come apart from the meaning. It is one field now, and the test
      reads the field rather than a list.
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
      anchor was reported and the words around it disappeared. **The mirror case
      is not fixed**: a container that is not a heading and holds a heading plus
      loose text (`<td>Levertijd <h4>Vraag</h4></td>`) still drops the loose
      words. Recorded below, and pinned by a test.
- [x] Overrides keyed on `structure` detach. Accepted and recorded, not
      migrated — see below.
- [x] Tests at the existing compare and contract seams, plus the extract seam for
      the bug fix. `structure` gone from the contract; finding ids for untouched
      classes unchanged, pinned by a literal. **176 tests green** after the code
      review, 161 before it. The review added the gate its own tests: `median()`
      and the page roll-up were exported and untested, and "a rule with no test is
      not a rule".

## Measurements

Baseline reproduced from the reports on disk before any change, and it matched
the ticket exactly: 10,076 findings, 8,573 shown, median 41, 179 crawled, 124
comparable. `compare/measure.mjs` is the new command that takes these, so the
regression gate is repeatable rather than an ad-hoc one-liner. **The command is
surface this ticket did not ask for** — the criterion above asks only for a
measurement written into `map.md`. It is kept because spec 32 measures after
every one of eight phases, and a one-liner retyped eight times is a number nobody
can check. The tally itself is `rollUp()` in `compare/findings.mjs`, beside the
tally over findings, so the gate and the page bar cannot count a class differently;
`measure.mjs` only prints.

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

Re-measured after the code review of 2026-08-06, which put `detail` into the
grouping key: **10,796 findings / 7,456 shown / median 37, unchanged to the
number.** No group on any of the 124 pages held two different tag changes of the
same words, so nothing split. The field is there for the day one does, and the
gate says it cost nothing today.

## The override detach, recorded

`class` is both the rule id ~~and the mute key~~ and a term of the finding id, so retiring
`structure` orphans any override keyed on it: a `fixed`, `dismissed` or `reviewed` event on a
`structure` finding no longer matches any finding ~~, and a mute on
`nl|<page>|structure` no longer matches any class~~. — **the mute clauses are struck
2026-08-13, [ADR 0011](../../../docs/adr/0011-the-mute-is-withdrawn.md); the detach is
unchanged.** It was always the finding id that carried the class. Nothing is migrated and no
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
heading. An outline-shape rule needs an owner — ticket 44 is now the nearest, and
the map records it there.

**Loose text beside a heading in a container is still dropped.** The heading rule
above fixed one half of the leaf rule. The other half is
`<td>Levertijd <h4>Vraag</h4></td>`: the `<td>` is skipped for holding a text tag,
so `Levertijd` never becomes an element on either side. To rescue it the extractor
would have to emit the direct text nodes of a container as an element of their
own. That changes what an element **is**, it moves the count on all 179 pages, and
it needs its own measurement — which is a ticket, not a line in this one.
`crawl/extract.test.mjs` pins today's behaviour so the next reader sees the limit
instead of finding it. **This needs an owner.**
