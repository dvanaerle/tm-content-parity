# 61 — Tier 1 folds the three invisible characters

**What to build:** two strings that look the same stop making a finding. Tier 1 is
invisible equivalence, and three characters that a browser never draws are outside
it today. A hexadecimal HTML entity stays literal, so text reads as
`Sorteer&#x20;op`. A zero-width space and a soft hyphen survive, so one side of a
comparison carries a character an editor cannot see or delete. Each one is a finding
that nobody can act on.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit. The user opened the
session with two reports of findings on text that looks identical.

- [ ] A hexadecimal numeric entity folds like a decimal one.
- [ ] A zero-width space, a zero-width joiner, a zero-width non-joiner and a soft
      hyphen fold to nothing.
- [ ] The remaining Unicode space characters fold to one space.
- [ ] Letter case and trailing punctuation still do **not** fold. They are tier 2,
      and the `casing` finding depends on them.
- [ ] One test for each character above. Normalisation has two tests today, and
      neither covers a no-break space or an entity of any form.
- [ ] The findings that these characters caused are gone from the report, and no
      other finding count moves.
