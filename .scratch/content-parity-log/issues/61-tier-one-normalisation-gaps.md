# 61 — Tier 1 folds the three invisible characters

**What to build:** two strings that look the same stop making a finding. Tier 1 is
invisible equivalence, and three characters that a browser never draws are outside
it today. A hexadecimal HTML entity stays literal, so text reads as
`Sorteer&#x20;op`. A zero-width space and a soft hyphen survive, so one side of a
comparison carries a character an editor cannot see or delete. Each one is a finding
that nobody can act on.

**Blocked by:** None — can start immediately.

**Status:** resolved 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit. The user opened the
session with two reports of findings on text that looks identical.

- [x] A hexadecimal numeric entity folds like a decimal one.
- [x] A zero-width space, a zero-width joiner, a zero-width non-joiner and a soft
      hyphen fold to nothing.
- [x] The remaining Unicode space characters fold to one space.
- [x] Letter case and trailing punctuation still do **not** fold. They are tier 2,
      and the `casing` finding depends on them.
- [x] One test for each character above. Normalisation has two tests today, and
      neither covers a no-break space or an entity of any form.
- [x] No other finding count moves. **The first half of this box cannot be shown:
      the corpus holds none of the reported characters.** See below.

## Resolved, 2026-08-07

`tier1()` gained three things. The entity pattern takes `&#x…;` beside `&#…;`, and
a hexadecimal match is read with radix 16. `&shy;`, `&zwj;` and `&zwnj;` enter the
named table. A new `INVISIBLE` class removes U+00AD, U+200B, U+200C and U+200D
after the entities are decoded, so `&#x200b;` and a literal zero-width space fold
the same way. `SPACES` now names every Unicode space: U+1680, U+2000 to U+200A,
U+2028, U+2029, U+202F, U+205F, U+3000, beside the no-break space and U+FEFF it
already held.

U+FEFF stays a space rather than nothing. It was already in `SPACES`, and moving
it would change text the corpus carries for no reason this ticket gives.

Every invisible character in `crawl/normalise.mjs` is now written as an escape.
The regular expressions held the literal characters before. A reader could not
see those bytes, and had to trust a comment about them.

Tier 2 is untouched. `tier1('Kleuren')` is still different from
`tier1('kleuren')`, and a trailing full stop stays.

294 tests are green. Six of them are new. They cover the hexadecimal entity in
three forms and its decimal twin; a form that is not an entity, which must
survive; a numeric entity outside Unicode; the no-break space as a character and
as `&nbsp;`; the four invisible characters and all five of their entities; and
all eighteen space characters.

### Found while resolving

**A malformed numeric entity stopped the crawl.** `String.fromCodePoint()` throws
above U+10FFFF, so `&#x110000;` in one paragraph threw a `RangeError` out of
`tier1()` and up through the extractor. The decimal branch had the same defect
before this ticket, but `&#1114112;` is 10 digits and rare. The hexadecimal branch
makes it easy to hit: any long run of hexadecimal digits in CMS text, such as
`&#xdeadbeef;`, is now a match. A new `character()` guard returns the entity
unchanged when the number is no character. A lone surrogate, U+D800 to U+DFFF, is
also left as it was written.

### The corpus does not carry the reported characters

`crawl/probes/probe-tier1-gaps.mjs` re-normalises all 448 stored extracts and
compares each page twice, before and after, with the same seeds and link statuses
the batch uses. **The totals do not move: 34,559 findings on both sides**, and no
class moves by one.

That is one half of the box. The other half cannot be shown, because the reported
findings are not in the report to remove. Across
`data/extract/`, `data/reports/` and `data/rechecks/` there is **not one**
hexadecimal entity, zero-width space, zero-width joiner, zero-width non-joiner or
`&shy;`. The string `Sorteer` does not occur anywhere in the corpus. The **soft
hyphen** occurs, twice: one paragraph of `steel-look-glazen-schuifwand` on `nl`
and on `be`. It sits inside a `text-missing` finding, so the character never
caused that finding — the fold only shortens the text and moves the id.

The fix is correct and it is tested. But the two reports that opened the session
name text the corpus does not hold. `Sorteer op` is a listing-toolbar label, so
the page is outside the seed list, or it is client-rendered (ticket 19). **A page
that shows the symptom is still necessary.** Until one is named, this ticket
cannot say that the fix removed a finding an editor saw.

The two soft-hyphen ids move only after the extractor runs again. The probe
measures that. It does not write it. Nothing was re-crawled here.

The probe writes the unit rule of `contentUnit()` again in its own body, rather
than importing it. Ticket 65's probe does the same with the extractor walk, and
for the same reason: a probe is evidence of one day, and it must not move when the
extractor moves. The two can drift, and after they drift this probe measures the
corpus as it was.
