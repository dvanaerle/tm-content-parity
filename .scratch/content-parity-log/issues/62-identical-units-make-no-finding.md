# 62 — Two identical units make no finding

**What to build:** the log stops reporting a `casing` difference between two strings
that are equal, character for character.

`/downloads` shows the defect. The page holds 24 copies of
`Download de montagehandleiding` on production and 25 on the new site. Pairing
matches on exact text first, but that match keeps document order, so a count or an
order change leaves identical strings unmatched on **both** sides. The leftovers then
pair by word overlap, score 1.0, and the classifier is asked to name a difference
that does not exist. Its first test is "equal after tier 2, therefore `casing`".

`CONTEXT.md` already decides this: the tool never makes a finding that it then
hides, and a row that is equal after tier-1 normalisation is not a finding.

**Blocked by:** None — can start immediately.

**Status:** resolved 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit.

- [x] A leftover pair with equal normalised text is a matched row with no class and
      no finding.
- [x] Such a pair still reports `tag-changed` or `heading-level` when the tag moved.
      The words are equal; the markup is not.
- [x] A test with the same string repeated on both sides in a different order, which
      is the shape that produced the defect.
- [x] `/downloads` reports no `casing` finding for
      `Download de montagehandleiding` or `Bekijk de installatievideo`.
- [x] No new class enters the vocabulary. A reorder of 24 identical links is an
      artefact of the matching, not an editorial fact.

## Resolved, 2026-08-07

`classifyPair()` gained one line, before all the others. Equal `norm` on both
sides hands the pair to `classifyExactPair()`. The tier-2 classifier now names a
**visible** difference only when there is one. `casing` was its first test, so it
used to name a difference between two equal strings.

The guard sits in the classifier, not in `diffRows()`. No caller can ask the
question again. The element rule answers instead: the same words in a moved tag are
`tag-changed`, whichever tier paired them. Which tier paired a row is an artefact
of the matching, and it now decides nothing.

`heading-level` is **not** reachable this way, and the first draft of this note
said it was. `mayPair()` holds a leftover pair to one `kind` and one heading level,
so a demoted heading never reaches the tier-2 classifier. It reaches
`classifyExactPair()` through the LCS, which is ticket 33's path and is unchanged.
The measurement agrees: 0 of the reclassified rows are `heading-level`.

**391 findings were the defect, over 448 pages.** All 391 were shown by default.
The rebuild takes the totals from 34,910 findings, 23,961 shown, to **34,559 and
23,570**: 351 disappear, and **40 become `tag-changed`** — text that is equal in a
tag that moved, which the phantom `casing` had been hiding. `casing` stands at 271
findings, and every one of them is a real letter-case difference.

`/downloads` is clean. `nl` and `uk` report no `casing` at all;
`Download de montagehandleiding` and `Bekijk de installatievideo` make no finding.
The two `casing` findings left on that page across the six stores are genuine:
`Heavy Duty` → `Heavy duty` on `be`, and
`Das installationsvideo ansehen` → `Das Installationsvideo ansehen` on `de`.

No class entered the vocabulary. 279 tests green, four of them new. The classifier
takes two equal strings, and then two equal strings in a moved tag. `diffRows()`
takes the `/downloads` shape twice: one line repeated on both sides in another
order, which is what defeats the LCS, and the same shape with the tag moved on one
copy.

### Found while resolving

**391 finding ids leave the log, and an override keyed on one of them is now an
orphan.** `overrides/state.mjs` keys a finding-scope override on `finding_id`, and
a phantom `casing` finding was shown by default — so an editor could have marked
one fixed or dismissed it. The ids are content-addressed and ticket 01 accepts that
they expire, so nothing is broken. It is a number nobody has, and
[65](65-count-the-overrides-the-fold-detaches.md) is the ticket that counts it.
This resolution adds 391 ids to that count.
