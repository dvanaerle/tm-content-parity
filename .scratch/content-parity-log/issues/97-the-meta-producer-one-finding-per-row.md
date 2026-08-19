# 97 — The producer: one finding per head row

Type: build
Status: ready-for-agent
Blocked by: 91, 95, 96
Parent: 58-axis-a-meta-check.md

**What to build:** the `<head>` stops being display-only and becomes the fourth
check. A changed Meta Title, a changed Meta Description or a lost Robots directive
now produces a finding an editor can tick off, exactly like body copy. The dashboard
Meta column stops printing `—`.

**Each of the three checking rows holds at most one finding.** The three title
classes are mutually exclusive, and so are the two robots classes. The field row *is*
the finding row — that is what lets the panel stay a five-row table in ticket
[98](98-the-meta-tab-becomes-a-checklist.md).

## What makes no finding

- **`h1`.** It is a heading in `elements`, so the content view owns it. It differs on
  93 of 179 nl pages, so reading it here would report the same words twice.
- **Canonical.** It keeps the host fold it does today through `linkKey()`, and keeps
  suppressing the `added` state. Production has no canonical on 147 of 179 nl pages.
- **Keywords.** Captured and displayed, no rule, until there is evidence a value
  exists.

## Two rules that are easy to get wrong

- **Tier 2 is not folded.** A dropped trailing full stop is `meta-casing`, not
  silence. Folding it would make the head the one place in the log where a lost full
  stop is invisible.
- **No brand-suffix rule, and no `Tuinmaximaal` string anywhere in the code.** Only 3
  of 45 title differences collapse when ` | Tuinmaximaal` is stripped, and the suffix
  sits on about 45% of titles on *both* sides — so it is editor text, not a template.
  A template change would read as 0% against 100%. Those 3 pages are ordinary
  `meta-title-changed` findings.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `compare/meta.mjs` and the nine `metaRows` tests in `compare/compare.test.mjs`
- `compare/images.mjs` — the collector-as-parameter shape to copy
- `21-axis-a-meta-check.md` § Identity and normalisation
- ticket 91's table, pasted below

## Ticket 91's table

Measured 2026-08-14 by `crawl/probes/probe-91-meta-classes.mjs`, against `data/extract/`
and `data/reports/` as they stand: **816 extract files, 722 comparable**. Ticket 21's
figures were taken on 2026-08-07 over **373** comparable pages and every one of them
is stale.

**Two of the five rows are not measured here.** `keywords` and `metaTitle` have never
been crawled, so they are not on disk. Ticket [92](92-measure-meta-title-and-keywords-presence.md)
owns them, and this table is the three rows that are: title, description, and the
derived `noindex` boolean.

| class | nl | be | be_fr | de | fr | uk | **total** | 21 said |
|---|---|---|---|---|---|---|---|---|
| `meta-title-changed` | 16 | 17 | 10 | 7 | 10 | 7 | **67** | 45 |
| `meta-title-lost` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| `meta-title-added` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| `meta-description-changed` | 27 | 33 | 14 | 14 | 15 | 17 | **120** | 78 |
| `meta-description-lost` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| `meta-description-added` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 |
| `meta-casing` | 2 | 2 | 0 | 0 | 0 | 0 | **4** | 4 |
| `robots-index-lost` | 0 | 1 | 0 | 1 | 0 | 0 | **2** | 1 |
| `robots-noindex-lost` | 1 | 1 | 1 | 0 | 1 | 0 | **4** | 2 |
| **meta findings** | 46 | 54 | 25 | 22 | 26 | 24 | **197** | 130 |
| pages compared | 124 | 122 | 115 | 123 | 117 | 121 | **722** | 373 |
| pages with a meta row | 38 | 41 | 18 | 16 | 18 | 20 | **151** | ~110 |
| pages with none | 86 | 81 | 97 | 107 | 99 | 101 | **571** | — |

**All 197 are `work`.** The only two classes that are not are `meta-title-added` and
`meta-description-added`, and they fire zero times.

### The share, measured against today's log

**This is the share as the log stands, not the figure the gate will print.** Ticket 21's
method is reproduced exactly — meta over `work` — but the meta findings do not exist yet,
so `work` here is the denominator *before* this ticket adds to it. See the gate below for
the figure `measure.mjs` will actually read.

| | today | ticket 21 |
|---|---|---|
| meta findings | 197 | 130 |
| work findings before the meta check | 22,003 | 23,961 |
| **share of work** | **0.90%** | 0.54% |
| share of all findings (40,947) | 0.48% | — |
| pages with no meta row | 79.09% | 68% |

The share nearly doubled, and **neither raw count is the reason on its own**. Meta rose
52% with the corpus, and the denominator *fell*: ticket 86 moved 2,846 `heading-level`
findings out of `work`. Both movements push the ratio the same way.

`work` is ticket 21's *shown*, renamed by ticket 75 and ADR 0005. The denominator is
`summariseReports()` over comparable reports — what `node compare/measure.mjs` prints,
which is this ticket's gate. It is not `data/snapshot.json`'s 40,966: that counts every
report file, including 19 non-comparable ones each carrying one `no-declared-alternate`.

### The baseline your gate is read against

From the same probe run, as the log stands **before** you start. Take `nl` down the left
of your gate.

**Where each row comes from, because the two are not the same command.** `findings` and
`work` are what `node compare/measure.mjs <store>` prints. **The per-check rows are not:
`measure.mjs` has no per-check output at all** — it prints findings, work, medians and a
by-*class* table. The check split lives in `report.summary.byCheck` in `data/reports/`,
and `crawl/probes/probe-91-meta-classes.mjs` totals it under `=== THE GATE BASELINE ===`.
Re-run that probe after your change to read the per-check rows again.

| `measure.mjs` | nl | be | be_fr | de | fr | uk | **total** |
|---|---|---|---|---|---|---|---|
| findings | 7,354 | 6,571 | 6,607 | 6,780 | 6,522 | 7,113 | **40,947** |
| work | 3,832 | 3,293 | 3,645 | 3,873 | 3,614 | 3,746 | **22,003** |
| `text` | 4,394 | 4,049 | 3,847 | 3,975 | 3,821 | 4,192 | **24,278** |
| `links` | 1,476 | 1,245 | 1,358 | 1,353 | 1,296 | 1,409 | **8,137** |
| `images` | 1,484 | 1,272 | 1,312 | 1,371 | 1,313 | 1,431 | **8,183** |
| `meta` | **0** | 5 | 90 | 81 | 92 | 81 | **349** |

**`check: 'meta'` is not empty today, and the ticket's own framing is loose about it.**
It already holds 349 `no-declared-alternate` findings, so this ticket does not create the
fourth check — it adds the head rows to a check that already fires. Two consequences:

- On the gate store, the existing count happens to be **0**, so `nl` reads a clean
  `0 → 46`. Do not generalise that: on `fr` the same check goes `92 → 118`.
- `no-declared-alternate` is `diagnostic`, so none of the 349 sits in `work`. The share
  arithmetic above and below is unaffected by it.

**After this ticket lands**, on today's corpus: `check: 'meta'` is **349 + 197 = 546**
findings, `work` is **22,003 + 197 = 22,200**, and the meta share `measure.mjs` reads is
**197 / 22,200 = 0.89%** — not the 0.90% above. All 197 are `work`, so the numerator and
the denominator move together; a gate that checks for 0.90% is checking the wrong number.

### `no-route` is inside these numbers

Ticket [93](../.out-of-scope/93-no-route-leaves-the-log.md) proposed to remove it and is
now **out of scope**, so it stays. This measurement counts it, and counts it correctly. `no-route` contributes **3** of the 197: `meta-title-changed` on `be_fr`
and on `fr`, and `meta-description-changed` on `fr` — production's
`Page non trouvée | Tuinmaximaal` against the new site's `Page introuvable | Tuinmaximaal`.

~~So expect **194 meta findings over 716 comparable pages** once 93 has landed.~~
**Corrected 2026-08-19: 93's exclusion was reversed.** `no-route` is a CMS content
page — its body is written in CMS > Pages and the new site has rewritten it — so it
stays in the log and so do its 3 meta findings. The number to check against is
**197 over 722**, which is what this measurement already read. See ticket 93's
`## Correction`.

### What the counts must survive

- **The four `lost`/`added` classes fire zero times**, as ticket 21 found. Both sides
  still always send a title and a description. They ship anyway.
- **All 4 `meta-casing` are a dropped trailing full stop on a description**, exactly as
  ticket 21 reported — two pages, `aluminium-zijwand/productinformatie` and
  `showroom-berlijn`, each on `nl` and on `be`. None is on a title. This is the check
  that `meta-title-changed` and `meta-description-changed` are not also claiming them.
- **`robots-index-lost` fires twice, not once.** Ticket 91 asked for this to be
  written down as a finding about a head rather than as corpus drift, and it is one:

  | store | page | production | new site |
  |---|---|---|---|
  | `be` | `bedrijfsinformatie` | index | **noindex** |
  | `de` | `(de)erfolg-probepaket` | index | **noindex** |

  `be/bedrijfsinformatie` is ticket 21's original. `de/(de)erfolg-probepaket` is new,
  and it is the severe direction: a page that is indexable on production leaves Google
  on the new site. It was invisible for the seven days between the two measurements,
  which is the argument for the class.

- `robots-noindex-lost` fires 4 times, on `beleid-en-regelgeving` (`nl`, `be`) and its
  two French counterparts `(be_fr)fr/politique-et-reglementation` and
  `(fr)politique-et-reglementation`. It is the same page in four stores.

**Trap: the producer cannot import `findings.mjs`.** `compare/meta.mjs` is imported
by a React island, and `findings.mjs` reaches `node:crypto` through `contract.mjs`,
so the Vite island build fails. Take the collector as a parameter and type it with a
JSDoc import, as `compare/images.mjs` already does.

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- compare/meta.test.mjs` and show the red before you write the
implementation. Then the next criterion. Do not plan across all six.

- [ ] 1 `compare/meta.test.mjs` exists and the nine `metaRows` tests move into it
      **unchanged**, green, out of `compare.test.mjs`.
- [ ] 2 The producer takes the collector as a parameter, and the island build passes.
- [ ] 3 Title: the three classes fire, mutually exclusively, at most one per row.
- [ ] 4 Description: the two directions and `meta-casing`, tier 2 unfolded, at most
      one per row.
- [ ] 5 Robots: both directions off the derived boolean, mutually exclusive.
- [ ] 6 Every meta finding carries `score: null` and `anchorHeading: null`. `score`
      is a `copy`-finding field and a head row has no similarity pairing;
      `anchorHeading` is defined by document order inside the content boundary, and
      the head is outside it.

## Gate

`npm test`, then `node compare/measure.mjs nl`, then
`node crawl/probes/probe-91-meta-classes.mjs`. **Two commands, because one of them cannot
show you half the gate** — `measure.mjs` prints no per-check breakdown, so the four `check`
rows below are read off the probe's `=== THE GATE BASELINE ===` section instead.

Read it against the baseline table above, on `nl`:

| | before | after | why | read from |
|---|---|---|---|---|
| findings | 7,354 | **7,400** | all 46 are new | `measure.mjs nl` |
| work | 3,832 | **3,878** | all 46 are `work` | `measure.mjs nl` |
| `check: 'meta'` | 0 | **46** | the 46 head findings 91 measured on `nl` | the probe |
| `check: 'text'` | 4,394 | 4,394 | unmoved | the probe |
| `check: 'links'` | 1,476 | 1,476 | unmoved | the probe |
| `check: 'images'` | 1,484 | 1,484 | unmoved | the probe |

**The three existing checks are unmoved** — this ticket adds head rows and must not
disturb text, links or images. If one of them moves, you have changed the body-copy
comparison and the gate has failed, whatever the meta count says.

**Trap: `measure.mjs nl` already prints a `46`.** It is `casing`, an unrelated `work`
class that happens to sit at 46 on this store. It is not your meta count and it must not
move. Your 46 is on `check: 'meta'`, which that command does not print at all.

If ticket 93 lands first, `nl` is unaffected: all three `no-route` meta findings are on
`be_fr` and `fr`. The whole-corpus number is stated properly below.

## The whole-corpus measurement

**Absorbed from ticket 99 on 2026-08-17.** The gate above is `nl` alone, and it is the
build's own red-green check. This is the second of the two numbers ticket 58 owes, over all
six stores, and it is the ticket's real close. Excluding `no-route` removed findings; the
meta classes add them. **One number would hide both**, exactly as ticket
[33](33-directional-text-classes.md) found, so the two are measured apart and both go in the
answer.

**No extra session.** A run of the existing measurement over the six stores, and a diff
against the baseline ticket 93 left behind. It reads `compare/measure.mjs`, ticket 93's
recorded baseline and ticket 91's predicted table, and its tables go here and in the probe
output — never into ticket 58.

- [ ] Per store and totalled: findings added on `check: 'meta'`, and the share of shown they
      represent. 21 put that share at **0.54%** over 373 comparable pages. The share, not
      the raw count, is the figure to compare — the corpus is 722 now.
- [ ] Stated beside ticket 93's `no-route` drop, as two numbers on one line, so the net
      movement never appears without both halves.
- [ ] The four `lost`/`added` classes fire **zero** times, or the exceptions are named by
      page. Both sides always send a title and a description. They ship anyway, because a
      one-sided check needs both directions and a title that disappears after a later
      content edit is the exact defect this log exists to catch.
- [ ] `robots-index-lost` is counted by store. 91 measured it firing **twice**, on `be` and
      on `de` — the severe direction, where the page leaves Google. This is the one claim
      that does not scale with the corpus: if it fires more often now, that is a finding
      about a head and it is named.
- [ ] **Text, link and image finding counts are unmoved** against ticket 93's baseline, on
      every store and not just `nl`. This work adds a check; it must not disturb the other
      three. A moved count here is a defect in the producer above, not a measurement.
- [ ] The chips move as predicted: open differences up by most of the total, hidden noise by
      the rest, pages-equal down.

**Why this is not its own ticket.** It is `Type: measure` with no session, it is blocked by
nothing but this ticket, and it measures exactly what this ticket produced. A build whose
corpus-wide effect is booked in a separate tracker entry is a build that can land and sit
unmeasured — and the runbook's rule batches freely up to a gate, which is what this is.
