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

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit.

- [ ] A leftover pair with equal normalised text is a matched row with no class and
      no finding.
- [ ] Such a pair still reports `tag-changed` or `heading-level` when the tag moved.
      The words are equal; the markup is not.
- [ ] A test with the same string repeated on both sides in a different order, which
      is the shape that produced the defect.
- [ ] `/downloads` reports no `casing` finding for
      `Download de montagehandleiding` or `Bekijk de installatievideo`.
- [ ] No new class enters the vocabulary. A reorder of 24 identical links is an
      artefact of the matching, not an editorial fact.
