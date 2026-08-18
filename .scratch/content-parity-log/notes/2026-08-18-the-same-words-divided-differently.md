# The same words, divided differently — and what happens to your dismissals

Drafted 2026-08-18 by ticket 116, from the run of
`node crawl/probes/probe-116-regrouped-collateral.mjs` on the morning of the same day: 816
extracts, 722 comparable pages, against an override log dumped that morning at 1,618 rows.
The numbers below are that run and no other.

## What changes

On some pages the new site sends two or three of production's paragraphs as **one**
paragraph. Not a word is edited and not a word is lost — only the seams between the blocks.

Until today the log had no way to say that, so it said two things that were both false: a
**Copy changed** with a score, because the first paragraph looked like most of the new
block, and a **Text missing**, because the second paragraph had nothing left to match. One
of them accused an editor of an edit nobody made, and the other reported a loss of text that
is on the page.

From today those pages carry one row instead, reading **REGROUPED · p + p → p**: the
production blocks on the left, one under the next, and the single block the new site sends
them as on the right. You can see the seam that moved and you can read that nothing else
did.

**It is drawn and it does not count.** Like a heading level since 2026-08-13, this is a
difference to read and not work to do: there is nothing for an editor to change, so the row
carries no tick and no dismissal, and it is in no bar. It still has an id, so a link to it
works and a search result can name it.

**The test is strict on purpose.** The new block has to be **exactly** production's blocks
joined, with nothing left over — not one word more and not one word less. The looser test
was measured and refused: it would have cleared 1,653 findings instead of 233, and among
them a `/fr/avantages` block whose closing sentence the new site simply drops. Sixteen words
of lost copy would have moved into a row nobody counts and nobody can decide.

## How many rows this is

38 rows on 34 pages, across all six stores. It replaces 32 `Copy changed`, 42 `Text
missing` and 6 `Moved to another element`. Every store's open-work number goes down by
between 10 and 18 findings, out of some 3,300 to 3,900.

It is **not** a fix for the `Text missing` mountain. Those 42 are 0.4% of the 9,688 there
are. That mountain is something else and it stays open.

## What this costs you

**A dismissal is about two exact texts, so it expires when one of them changes.** The row
you dismissed no longer exists: its two paragraphs are now one row with one merged block, so
the dismissal has no subject left and it detaches. There is nothing to migrate — the log
records what you looked at, and it was not this.

Measured over the 1,061 live judgements in the log:

| what | live | detaches |
|---|---|---|
| dismissals | 829 | **18** |
| fix claims | 232 | 0 |

**Eighteen of 1,061.** Eleven on `nl` and seven on `uk`; the other four stores lose nothing.
Thirteen sat on a `Copy changed` and five on a `Text missing` — exactly the two the new row
absorbs. Twelve are s.schouten's and six are d.aerle's, and they sit on nine pages:
`nl/dop`, `nl/samplepakket`, `nl/samplepakket/succes`, `nl/proefpakket/succes`,
`nl/shading-panel/montage`, `nl/veranda/prijzen`, `uk/disclaimer` and two of the `uk`
landing pages.

**Nothing detaches anywhere else.** No judgement on a page that gained no such row moved,
and no page review and no fix claim is touched.

**And nothing comes back to be dismissed again.** This is the one difference from the fold
of 2026-08-10, where a lost dismissal returned as an open finding you had to press again.
Here the row that replaces it is not work and asks you nothing. The judgement is not so much
lost as made unnecessary: what you were dismissing was the log being wrong, and it is no
longer wrong.
