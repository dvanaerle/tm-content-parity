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

The declared number must also allow the **same region more than once on one page**.
Ticket 64 found three nl pages that carry the promo banner twice, at 18 units. The
default cap of 20 held, and a third placement would have stopped the crawl on a
correct selector. So a small region that repeats declares room for a repeat: the
banner declares 30 for a block of 9.

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
   cut by the same definition, or the two sides stop being comparable. One
   definition, not one count: a `legacy-only` region is on production alone, so the
   same selector measures zero on the new site. That zero is the entry's evidence
   for its own kind, and ticket 64 records it as `measured.new`.
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
- **A content hash over regions across the corpus.** Deferred to **ticket 70** (this
  said ticket 66, which is the `ContentUnit` rename), and now **rejected on its
  measurement**. The reasoning that deferred it still reads correctly — the defining
  property of the banner is that it repeats on 446 pages, not what this campaign says
  — and the corpus-wide pass it was waiting for says the rule is already had, by a
  better instrument. `repeatsInStore()` keys on `[language-block-or-store, class,
  prod, new, detail]`, which is that content hash without the region: it folds 14,449
  of 22,048 `work` findings into 5,123 rows, and across a language block rather than
  per store. A hash on a `RegionRemoval` could only fold content inside a region a
  selector already names, and such a region is already excluded, so it produces no
  findings to fold. Depth is the other half of the answer: block-shaped content
  reaches **11 pages at most, 4 keys over 10, none over 25**, measured 2026-08-18 by
  `web/probes/probe-shared-regions.mjs` over the 722-page corpus. See
  `.scratch/content-parity-log/issues/.out-of-scope/70-shared-regions-by-content-hash.md`.

## Consequences

- The promo banner removes **4,055 findings, 11.8% of the corpus of 34,488, on 446
  of 448 pages**. Ticket 64 measured this. The estimate before it was 2,698 of
  34,910 on 371 pages, and it was low on all three numbers.
- **The banner anchor is an id production puts on the block**, `#campaign-banner`,
  the same shape as the product grid's. It is not campaign-specific: the next
  campaign changes its copy, its links and its option ids but keeps the hook, so the
  entry keeps matching and needs no commit. Measured 2026-08-11 as **identical to the
  anchor it replaced** — matches, units, links and images — on **48 page-store pairs**
  across all six stores. Not on the corpus: the corpus-wide probe last ran against the
  old selector. Ticket 90.
- **This reverses an earlier consequence of this ADR, recorded here rather than
  dropped.** The anchor used to be the campaign option ids in a link href
  (`_model=6039,6040`, and the same ids as `6039%2C6040`), chosen because Magento
  option ids read the same in every store while the block carried no stable class and
  no stable text. That anchor was campaign-specific by construction and the list was
  said to need an owner for exactly that reason. What changed is not the reasoning but
  the input: the block is editable in the Magento admin, so a stable hook could be
  **created** rather than found. Two consequences of the old anchor go with it — an
  anchor on a link href read the **raw attribute** and so had to ask for every
  encoding of the comma, and it had to name a **pair** of ids because a single id also
  appears on an editorial filter link. An id on the block has neither problem.
- **The rejected text anchor above stays rejected, and it was re-measured.** Ticket 89
  ran the one-sided `PROMO` pattern over 816 reports: it matches **0** banner lines in
  `de`, `fr` and `be_fr` and one per page in `uk`, sweeps 58 editorial findings, and
  cannot reach the **1,175 shown link findings** the banner carries. The "blind in four
  stores" objection recorded here held under measurement.
- **The failure mode moved, and it is silent.** The hook lives in a CMS block this repo
  cannot see, so a future campaign built as a fresh block without it makes the entry
  match nothing and the banner returns as findings. That is the over-reporting
  direction and it is safe, but `capBreachMessage` only fails the crawl when an entry
  matches **too much**; nothing fires when a committed entry matches **nothing**, and
  the coverage line below reports it a run later rather than at the crawl.
- Excluded-region coverage is compared against the last snapshot. If a region was
  removed on 446 pages and is now removed on none, the log says so in one line. The
  reader must not have to infer it from the 4,055 rows that came back.
  `compare/region-coverage.mjs` holds the rule, `data/snapshot.json` holds the
  verdicts, and the crawl and the dashboard write their own words from them.
- Coverage is compared **between two runs of the same scope**. A one-store run
  against a whole-corpus snapshot would read as five stores that stopped matching.
- We are blind to content changes inside an excluded region. For both reasons in the
  vocabulary this is correct: a catalogue change is not editor work, and a region
  that will never be migrated cannot create work.
