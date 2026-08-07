# Regions are excluded at extraction, by a committed list with a size cap

Some regions inside the content boundary are not editor work. A product grid comes
from the catalogue. A promo banner is a shared block that the new site will not get.
Both make findings that nobody can act on.

We decided that a region is removed **at extraction**, by a committed list in
`shared/excluded-regions.mjs`. Each entry names its selector, its reason and its
kind. An exclusion that removes more than a small number of content units **throws**
instead of running.

The list is in `shared/` and not in `crawl/`. `crawl/` cuts the region and `web/`
lists it, so two stages read it, and ADR 0001 gives that shape one home. The list
holds no DOM: `crawl/extract.mjs` holds the removal.

## Why at extraction, and not at the check

Ticket 27 asked whether ticket 19's shape — a committed list of exact keys with
reasons — works for a *region* of a page, and it named the obstacle: the extract
carries no DOM path, so a check cannot say "the third section down".

That obstacle is real, and it decides the answer. The DOM exists only in `crawl/`,
so the region must go before the extract is written. A check can then stay ignorant
of regions, and the report holds no unit that was never in scope.

## Why the size cap exists

`.magezon-builder` looks like the promo banner wrapper. It is not. It is the generic
Magezon wrapper for **all** CMS content on production. Measured inside `<main>`:

| page | units in `<main>` | units in `.magezon-builder` | removed |
| --- | --- | --- | --- |
| `/downloads` | 359 | 358 | 99.7% |
| `/showroom-contact` | 96 | 95 | 99% |
| `/betaalmethoden` | 59 | 58 | 98% |
| `/overkapping` | 284 | 139 | 49% |

That selector would have deleted the whole download index, the whole payment table
and the contact telephone number. The mistake was one plausible line of code, and
nothing in the pipeline would have reported it.

So the cap is not a nicety. The crawl fails loudly, in the same manner as
`assertHasContent`.

**The cap is per entry, and it defaults to 20.** An entry that declares none is
capped at 20, because no *editable* region on this site is that large. An entry that
needs more declares the number, and the list refuses the entry unless the declared
number is at or above the entry's own recorded measurement. The product grid is the
reason the cap has this shape: it is not editable, and it removes 50 units on
production. A flat 20 would have rejected the first entry the list was built for.

The declared number is not a free hand. `validateRegions()` checks it against
`measured`, so an entry cannot claim headroom it never measured. The same function
runs on a list that a caller gives the extractor, so a test list and a probe list
get the same bar.

**No entry may declare a cap above 100.** The per-entry number and the measurement
beside it are both written by hand. Without a ceiling the guard is only "type the
number twice". 100 is above the widest entry today (50) and below the near-miss
above (139 units on `/overkapping`). A region wider than the ceiling needs a new
decision here, and not a larger number in the list.

The cap counts **the whole entry on one page**, not one match. Two matches of half
the size are the same wrong selector as one wide match. A match inside another match
of the same entry counts once: the outer match removes the inner one anyway.

The cap counts **content units only**. A selector that takes few units and many
links or images does not trip it. That is a known limit and not an oversight: the
unit is what the cap is defined in, and the two other checks have no such guard yet.

Every extraction also records the regions removed and the units removed, beside
`diagnostics.imagesWithoutSrc`. An exclusion is visible, never silent. The store
dashboard lists each entry with its reason and with the pages it was removed on, so
an entry removed on no page reads as one line.

An extract written before this rule has no `regionsExcluded`. It reads as "no region
cut here", which is the over-reporting direction, and the dashboard says the snapshot
may be older than the entry rather than that the region stopped matching.

## The bar for a new entry

The list will grow. Each new entry needs all four:

1. **A reason from the vocabulary** — `non-editorial` (nobody writes it) or
   `legacy-only` (nobody will migrate it). A region that is neither is in scope.
2. **A measured unit count on both sides, on at least three pages.** The count goes
   in the entry. The `.magezon-builder` near-miss was found by measuring, not by
   reading the markup.
3. **A selector that matches on both hosts.** Production and the new site must be
   cut by the same definition, or the two sides stop being comparable.
4. **A failure direction that over-reports.** When the entry stops matching, the
   region must come back as findings. It must never widen.

## Considered options

- **`pageType` from the `<body>` class.** Rejected as the hook. It is a page kind,
  and a grid is a region inside a page that is otherwise in scope.
- **Position — "the first `.magezon-builder` in `<main>`".** Rejected. It is right
  on all eight pages measured today, and it cannot say when it stops being right.
- **A text anchor on the banner headline.** Rejected. The banner is in six stores.
  Production says `10% korting op terrasoverkappingen en carports.` in `nl`,
  `10% Rabatt auf Terrassenüberdachungen und Carports.` in `de` and
  `10% discount on verandas and carports.` in `uk`. A Dutch anchor is blind in four
  stores.
- **A content hash over regions across the corpus.** Not rejected — deferred to
  ticket 66. It is the durable rule, because the defining property of the banner is
  that it repeats on 371 pages, not what this campaign says. It needs a
  corpus-wide pass and a measurement that waits for the new environment.

## Consequences

- The promo banner removes 2,698 findings, 7.7% of the corpus of 34,910, on 371 of
  448 pages.
- The banner anchor uses the campaign option ids in a link href
  (`_model=6039,6040`). Magento attribute codes and option ids are global, so the
  signal is the same in every store. It is **campaign-specific**: the next campaign
  changes the ids, the entry stops matching, and the banner returns as findings. The
  list needs an owner.
- Excluded-region coverage is compared against the last snapshot. If a region was
  removed on 371 pages and is now removed on none, the log says so in one line. The
  reader must not have to infer it from 2,698 rows that came back.
- We are blind to content changes inside an excluded region. For both reasons in the
  vocabulary this is correct: a catalogue change is not editor work, and a region
  that will never be migrated cannot create work.
