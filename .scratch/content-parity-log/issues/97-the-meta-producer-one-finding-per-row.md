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

Measured 2026-08-14 by `crawl/probes/probe-meta-classes.mjs`, against `data/extract/`
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

### The share, which is the figure the gate reads

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

### `no-route` is inside these numbers

Ticket [93](93-no-route-leaves-the-log.md) removes it, and this measurement was taken
before that. `no-route` contributes **3** of the 197: `meta-title-changed` on `be_fr`
and on `fr`, and `meta-description-changed` on `fr` — production's
`Page non trouvée | Tuinmaximaal` against the new site's `Page introuvable | Tuinmaximaal`.

So expect **194 meta findings over 716 comparable pages** once 93 has landed. If 93
lands first, that is the number to check against, not 197.

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

`npm test`, then `node compare/measure.mjs nl`.

Findings appear on `check: 'meta'` at roughly ticket 91's counts. **Text, link and
image counts are unmoved** — this ticket adds a check and must not disturb the other
three. Ticket [99](99-measure-what-the-meta-check-added.md) states the number
properly.
