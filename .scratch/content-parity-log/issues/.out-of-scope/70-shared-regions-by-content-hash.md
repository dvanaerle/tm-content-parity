# 70 — Shared regions are found by content hash

Type: grilling (deferred half)
Status: wontfix — **parked 2026-08-18**, on the measurement in this file. Both halves of the
mechanism are gone, for different reasons: the exclusion half shipped by other means, and the
identity half is **already built under another name** — `repeatsInStore()` is the content key
this ticket asked for, and it folds deeper than the ticket proposed. **One box is not gone
and is not built**: surfacing an unlisted frequent block for a person to classify. It is
handed to ticket 63, because everything the measurement found under it is `information` or
`diagnostic` and so is out of reach of the `work`-only surface that answers the rest. Parked
before a line of it was written, on the numbers below.
Parent: ../../map.md

**Origin:** the grilling of 2026-08-07 on the content unit, questions 22 and 24. It was the
deferred half of both. ADR 0003 also deferred here: *"a content hash over regions across the
corpus — not rejected, deferred to ticket 70… it needs a corpus-wide pass and a measurement
that waits for the new environment."* **This is that pass**, and ADR 0003 has been updated
to record its result.

Was: blocked by 64, 67. Both resolved.

- [x] A region carries a hash of its normalised content, and the corpus records on how many
      pages of a store each hash occurs. — **Not built. Already built elsewhere**, keyed on
      the finding rather than the region, and the region framing is the weaker one.
- [x] The excluded-region list can name a shared block by hash instead of by a campaign
      anchor. Ticket 64's entry moves over, and the campaign anchor is retired. — **Shipped
      2026-08-11 without a hash.** `shared/excluded-regions.mjs` keys on
      `selector: '#campaign-banner'`, an id production puts on the block, which is the same
      signal in all six stores and names no campaign.
- [ ] A hash that appears on many pages and is not in the list is surfaced **once**, for a
      person to classify as legacy-only, non-editorial, or real work. — **Not built, and not
      satisfied by the repeats surface.** The repeats list and the search index are
      `work`-only (`view.mjs`'s docblock; `search.mjs` skips `!isWork`), and the two frequent
      unlisted blocks this measurement actually found are **not** `work` — the compare
      toolbar is 516 `information` findings and `no-declared-alternate` is 349 `diagnostic`.
      So the one box with a live want behind it is **out of scope of the surface that
      answers the other two**, and it is handed to ticket 63, where an excluded-region
      entry is the decision a person would record anyway. This probe is the surfacing for
      now: `recurrence.deepestShared` is the list, and re-running it is the classification
      pass.
- [x] Measure first, and put the number in this ticket. — **Done, below.** The share is
      small in the only shape that matters, so by this ticket's own gate the identity half
      is not worth building.
- [x] If the measurement shows most findings are shared-block findings, stop and say so. —
      **Answered on the word `block`, and it needs saying carefully, because one reading of
      the number is a majority.** Findings that recur across pages *at all* are **most of
      the work queue**: `repeatsInStore()` folds 14,449 of 22,048 `work` findings, 65.5%,
      into multi-page rows. What is **not** most is shared-*block* findings — the thing this
      ticket proposed to identify. 81.4% of shared findings are labels under 60 characters,
      block-shaped content is **5.9% of all findings**, and it reaches 11 pages at most. So
      the roadmap does not reorder, and the reason it does not is the shape of what recurs
      and never the headline share. Stated rather than left implied, because the 36.3% on
      its own would not carry this box.
- [x] Needs the new environment. It answered HTTP 500 on all six hosts while this was
      written. — **It has since answered.** The corpus read below was built 2026-08-17.

## The measurement

`node web/probes/probe-shared-regions.mjs`, over `data/reports/` as built **2026-08-17**:
816 reports, **722 comparable**, all six stores, both sides. Written to
`data/probe-shared-regions.json`. It needs no network — the corpus on disk holds every
finding, and every key is a pure function of it.

The instrument is the **content key**: the finding id minus store, page and `rule` — check,
class, the two normalised sides, detail. Two pages carrying the same authored block land on
one key, and no region boundary is required, so it counts recurrence a region hash could not
reach as well as recurrence it could.

**It is not an upper bound on the fold in §"Why it is parked", and a first draft of this file
said it was.** This key is *finer* than `repeatsInStore()` in two ways — it carries `check`,
and it never crosses a store — so the shipped fold folds strictly coarser and reaches
further. The two measurements answer different questions: how much content recurs at all,
and how much the log already folds. Neither bounds the other. Dropping `rule` cuts the same
way, and can only *under*-count.

**41,030 findings over 30,087 distinct content keys. 14,913 findings (36.3%) share their
content with at least one other page**; 37.1% of units, and 32.8% of the 22,048 `work`
findings.

| pages carrying the same content | findings | share |
| --- | --- | --- |
| 1 | 26,117 | 63.7% |
| 2 | 4,764 | 11.6% |
| 3–5 | 3,214 | 7.8% |
| 6–10 | 3,473 | 8.5% |
| 11–25 | 3,085 | 7.5% |
| 25+ | **377** | **0.9%** |

**36.3% is the wrong number to act on in either direction, and the shape says why.** It reads
low against the fold below, which reaches 65.5% of the work queue; it reads alarmingly high
against what a region hash could ever fold. Of the shared findings:

- **81.4% (12,135) are label-shaped** — under 60 characters. `Sluiten`, `Montage`,
  `Fotogalerij`, `Clear all`, `Vergelijken`, `Filteren & Sorteren`, and link targets.
- **2.3% (349) carry no content at all** — `no-declared-alternate`, a page-level
  diagnostic. It is 4 keys and it is the **entire** 25+ page tail bar one broken link.
- **16.3% (2,429) are block-shaped**, 60 characters or more. That is **5.9% of all
  findings**, and it is the only slice the ticket's mechanism was ever about.

Block-shaped recurrence is **shallow**: 1,036 keys, of which **4 reach 10 pages and none
reaches 25**. Those 4 account for 44 findings — **0.11% of the corpus**. The deepest is 11
pages, and all of them are one cluster:

| store | pages | class | text |
| --- | --- | --- | --- |
| `be_fr`, `fr` | 11 | `text-missing` | `Le showroom est-il accessible aux personnes à mobilité réduite ?` |
| `de` | 11 | `text-missing` | `Kann ich während meines Besuchs ein Angebot erstellen lassen?` |
| `nl`, `be` | 9 | `text-added` | `Nee, je bent binnen onze openingstijden van harte welkom…` |

That is the **showroom FAQ**, on the ~11 showroom pages. Ticket 140 found the same cluster
from the opposite direction — production units against themselves, not findings — and capped
block-shaped text at 7 pages over 7 texts. **Two instruments, two corpora, one cluster.**
There is no third thing hiding.

## Why it is parked

**1. The identity half is already built, and it is called a repeat.** This is the finding
that ends the ticket. `repeatsInStore()` in `web/src/lib/view.mjs` groups on
`[language-block-or-store, class, prod, new, detail]` — a **content key, not a page key**.
Its own docblock is this ticket's opening paragraph: *"One footer line that is wrong on
thirty pages is one row here, and an editor meets it once instead of thirty times."*

Over the same corpus, on the `work` classes the dashboard loads:

| | |
| --- | --- |
| work findings | 22,048 |
| repeat rows an editor meets | **12,722** |
| rows spanning more than one page | 5,123 |
| findings those rows fold | **14,449** |
| deepest row | **44 pages** |

It folds **deeper than this ticket asked for**. The ticket wanted per-store identity; a
repeat crosses a language block (ticket 03, ADR 0018), so one defect in `{nl, be}` or
`{be_fr, fr}` is one row and not two. A press over a repeat writes one event per entry, so
*one fix closes many findings* is already one action. The ticket's premise — "one fix closes
many findings that nobody can see are the same thing" — describes a surface that shipped.

**2. The 2,698-row disaster cannot recur, and it was never about a hash.** The ticket's
motivating case was the campaign banner. It is excluded at extraction on `#campaign-banner`
since 2026-08-11, and if it were not, it would arrive as **one repeat row** — the banner text
is per-store, so per store it is one key over ~136 pages, above the 44-page row that tops the
list today. The ticket asks for a new item "to judge instead of thousands of rows". The log
already gives one row to *meet*; it deliberately refuses to make it one thing to *judge*,
because a repeat has no id, no override and no history, and every decision on it is still N
decisions on N findings (ADR 0017). That is a decided position, not a gap.

**3. A region hash would be a narrower instrument than the one that exists.** The content key
measured above ignores region boundaries entirely and is therefore generous. A hash carried on
a `RegionRemoval` could only fold content **inside a region a selector already names** — and a
region a selector already names is already excluded, so its content produces no findings to
fold. The mechanism is circular for everything except an *unlisted* frequent block, which is
box 3, which the repeats surface already answers.

**4. What actually recurs is chrome, and the log is a `<main>`-shaped instrument.** The
deepest rows are nav labels, section headings and toolbar text. Ticket 140
parked on this same structural fact and stated it best: the content that wants to be shared is
footer, header and USP-strip content, and the log never compares chrome. Deepening the log's
grip on shared content means moving the content boundary, which is ADR 0003 and the boundary
definition both.

**5. `hash` would be the fifth overloaded word here.** The repo already carries
`findingSetHash`, the finding id's own `sha256`, the generated wrapper-class hashes the banner
entry warns about, and the catalog cache hashes `imageKey()` folds. `Block` was refused a
fourth meaning in 140 for the same reason.

## Re-open trigger

**A block-shaped content key reaching 25 pages in any store.** Zero do today, and the deepest
is 11. That is the number that would make the identity half worth its own mechanism, and
`probe-shared-regions.mjs` prints it as `recurrence.blockKeysOn25Plus`. Re-run it after any
change that widens the content boundary or removes an exclusion — either can create depth that
does not exist today.

**A shared region that the repeats surface cannot fold.** The fold keys on the literal text,
so it holds only while the same block renders the same words. A shared block that is *translated per
page*, or that carries a per-page token — a page name, a price, a date — breaks
into one key per page and the fold is blind to it. Nothing in the corpus does this today. If
something starts to, the region framing becomes the right one, because the region would be the
only stable thing left, and this ticket is the place to start.

## Two things the measurement found that are worth more than this ticket

Neither is actioned here.

**The product-compare toolbar leaks into the log, and it is non-editorial.** `Clear all`,
`Producten vergelijken`, `Vergelijken`, `Filteren & Sorteren`, `Comparer`, `Filter and Sort`,
`Afficher plus` and `extra-link` to `self/catalog/product_compare/index` account for **516
findings** across the six stores, on 30–34 pages each. This is catalogue furniture in exactly
the sense that `#amasty-shopby-product-list` and `.filter-content` already are, and it is not
what those two entries cut: it survives on the **new** side, outside `.filter-content`. Ticket
63's entry predicts a residue here — *"between zero and eight rows appear, all `text-added` or
`link-target`"* — so the residue is documented; what is new is that it is the same rows on 34
pages rather than a scatter.

**The value is smaller than it first reads, and that is the reason to write it down.** All 516
are `information` — 419 `text-added`, 97 `extra-link` — and **not one is `work`**. So they are
out of the bar, out of the roll-up and out of the repeats list, and an exclusion entry would
move **no number an editor is measured on**. It would take noise out of the content view and
the search, and that is the argument it has to be judged on — not a queue-size argument. That
is ticket 63's business and wants its own measurement.

**`no-declared-alternate` is the whole visible tail, and it is a page fact repeated per page.**
4 keys carry 349 findings — `fr` on 92 pages, `be_fr` 90, `de` 81, `uk` 81. It is a
`diagnostic` class, so it is out of the bar and out of the repeats list, and nothing is wrong.
It is recorded because it is why a naive "how much is shared" read alarms at 25+ pages when no
authored block goes near that depth.

## Notes

Everything a revival needs is on disk and needs no crawl:
`data/probe-shared-regions.json` holds the run, and `data/reports/<store>__*.json` holds every
finding and every `ContentUnit` under `sides.<side>.elements`. `repeatsInStore()` is the fold
to measure against, and `web/probes/probe-search-index.mjs` is the precedent for reaching it
from a probe.

The corpus split by visibility, for anyone quoting a share out of this file: **22,048 `work`,
16,310 `information`, 2,672 `diagnostic`**, of 41,030.

Nothing waits on this ticket. It is a leaf.
