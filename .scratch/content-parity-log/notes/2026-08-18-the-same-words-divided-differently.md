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

## The other direction, the same day

Added 2026-08-18 by ticket 120, from `node crawl/probes/probe-120-regrouped-split.mjs` over
the same 722 comparable pages and the same override log.

Far more often it happens the other way round: production sends **one** paragraph and the new
site sends it as two, three or four blocks — usually a heading and the rest, or a list where
production had a sentence. That is the same thing, mirrored, and it now reads as one row:
**REGROUPED · p → 4×p**, production's block on the left and the blocks the new site divides it
over on the right, one under the next.

This half is **151 rows on 121 pages**, four times the merge. It replaces **143 `Copy
changed`** and **184 `Text added`**, and three each of `Moved to another element` and
`Campaign`. Open work goes down by 18 to 28 findings a store.

**Most of it you were never shown.** `Text added` is content the new site invented, and the log
has never counted it, so 184 of the 333 rows this replaces were already out of sight. What you
will notice is the 143 `Copy changed` rows that are gone, and they are the ones that were
wrong.

**A run of two is most of it** — 119 of the 151 — with 28 of three and 4 of four. There is no
page in the corpus where a paragraph is divided over five blocks.

### What it costs

| what | live | detaches |
|---|---|---|
| dismissals | 829 | **52** |
| fix claims | 232 | 0 |

Every one of the 52 sat on a `Copy changed` — the class this row absorbs — and every one is on
a page that gained one of these rows. **24 on `nl`, 22 on `uk`, 6 on `be`**, spread over 42
pages with no more than four on any of them; the heaviest are `uk/veranda/sidewall` (4) and
`nl/privacy-beleid` (3). Forty-two are s.schouten's and ten d.aerle's. No page review and no
fix claim is touched, and nothing on a page without one of these rows moved.

As with the merge: none of it comes back to be pressed again. The row that replaces your
dismissal is not work and asks you nothing.

### One thing it does not fix

Where production sends the **same paragraph twice** — `nl` and `be`
`/glazen-schuifwand/productinformatie` both do — the new site's blocks can only be the one
paragraph, not both. So the row appears and a `Text missing` stays behind for the second copy,
now reading once instead of twice. That is not the log being coy: production really does hold
those words twice and the new site holds them once.
