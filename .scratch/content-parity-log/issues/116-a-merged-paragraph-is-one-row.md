# 116 — A merged paragraph is one row

Type: task
Status: resolved 2026-08-18 — built on branch `ticket-104-search-page-scope`. See the answer.
Blocked by: 86
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** when the new site sends several production paragraphs as **one**
paragraph, the log says so once instead of reporting a `copy` and a `text-missing` that are
both false.

The case, and the demo for this ticket: `nl/proefpakket/succes`. Production sends
`"Bedankt voor het aanvragen…"` (46 tokens) and `"Het pakket is zo ontworpen…"` (18 tokens);
the new site sends one paragraph of 64 tokens holding both, in order, unchanged. Today the
log shows `COPY 0.84` and `TEXT-MISSING`. After this ticket it shows one row reading
`REGROUPED · p + p → p`.

This is **merge only** (N production units → 1 new unit). The split direction is
[120](120-a-split-paragraph-is-one-row.md) and it reuses everything built here.

**Blocked by:** [86](86-heading-level-becomes-information.md) — not technically, but because
both tickets move the denominator, and ticket 33 established that one number hiding two
movements is how a measurement stops meaning anything. 86 also delivers the information-row
behaviour this ticket inherits: collapses into a context marker, no override control, no
class group.

## The criterion is not negotiable in this ticket

[ADR 0012](../../../docs/adr/0012-regrouped-requires-total-coverage.md) fixes it and prices
every alternative. In short: the new-site unit is **exactly** the space-joined concatenation
of an adjacent, uninterrupted run of 2 to 4 production units, after tier-1 normalisation,
**nothing left over**; each member is at least 4 tokens; each member is unpaired or is the
new unit's own counterpart. Comparison on token sequences, so every boundary is a word
boundary.

Do not relax it. Containment instead of total coverage was measured at 1,653 findings against
233 and refused, because it silences lost content — see the `/fr/avantages` criterion below.

## What must stay true

- **Pass 2, ahead of the greedy matcher.** Greedy claims `P1 ↔ N1` at 0.84 and the run is
  gone before the exact test runs. Exact beats fuzzy, as LCS already beats greedy.
- **The content unit does not change.** No flattening, no sentence splitting. ADR 0002.
- **One wide row**, holding the run on the left and the merged unit on the right, positioned
  at the **first production unit of the run**, in production document order.
- **The finding id's `prodNorm` is the space-joined run** — the same join the test uses — so
  the id expires if any member is edited. First-member-only is ADR 0004's silent-carry
  failure.
- **`detail` carries the shape**: `p + p → p`. **`score` is null**; the score belongs to
  `copy`.
- **Visibility `information`**, inheriting 86's behaviour. It keeps a finding id, because
  `Landing` needs one.
- **No word diff and no clamp budget** — the words are identical, only the seams differ.

## Acceptance criteria

- [x] `nl/proefpakket/succes` produces one `regrouped` finding and **no** `copy` and **no**
      `text-missing` for those units. Work 6 → 4.
- [x] `be_fr/fr/avantages` still produces a shown finding. ~~Production holds a sentence about
      `6061-T6`~~ — **the corpus has moved**: on the 2026-08-17 extract both sides carry the
      `6063-T6` sentence, so the exact unit the ADR argued from is no longer there to be
      silenced. What the criterion is measured against instead is the page: work **35 → 35**
      and **no** `regrouped` row on it. The shape itself — a run the new site covers all but
      the last sentence of — is a test at the `diffRows()` seam, which is where a future
      relaxation will meet it whatever the crawl holds that day.
- [x] `be_fr/fr/faq/collecte-livraison` still produces a shown finding: the phone number
      changed value. Work **11 → 11**, no `regrouped` row.
- [x] A `copy` whose sides differ only by a trailing token (`"… exacte prijs"` versus
      `"… exacte prijs >"`) is **not** `regrouped` — rejected by total coverage and by the
      two-member minimum independently.
- [x] A run of two units where the new site merged them **and** added a word stays `copy`.
- [x] Per-store counts before and after are in the answer. ~~Expect ≈40 instances, ≈33 `copy`
      and ≈45 `text-missing` absorbed.~~ **38 instances, 32 `copy`, 42 `text-missing`**, and 6
      `restructured` the estimate did not name. **No class outside `copy`, `text-missing` and
      `restructured` moved**, and the probe throws if one does — it caught `text-added` moving
      by 2 on one page, which is how the missing third guard was found.
- [x] **The re-pairing collateral is counted before this lands.** 80 finding ids vanished and
      38 arrived; **every vanished id is on a page that gained a regrouping**, so the
      re-pairing reached no page the criterion is silent about. 18 of 1,061 live judgements
      detach. The change is **not refused**.
- [x] The announcement note for the detached overrides is written:
      [notes/2026-08-18-the-same-words-divided-differently.md](../notes/2026-08-18-the-same-words-divided-differently.md).
      ~~≈59 live dismissals are expected to detach, most of them s.schouten's.~~ **18**, of
      which 12 are s.schouten's — the estimate was three times too pessimistic, and *most of
      them s.schouten's* held.
- [x] Tests live at the `diffRows()` seam in `compare/compare.test.mjs`. 15 there, and
      `pairLeftovers()`, `mayPair()` and `similarity()` are **not** touched. Spec 119's other two
      seams are covered as well: 6 at `prepareRows()` in `web/src/lib/view.test.mjs` — including
      the marker collapse, the landing and the absorbed heading — and the id over the run is an
      edited assertion in `compare/contract.test.mjs`.

## Traps

- **A merge target was always an already-paired unit.** There is no case in the corpus of a
  brand-new unpaired unit being exactly the concatenation of orphaned production units. Do
  not build for it.
- **38 of 100 candidates under an early looser rule fired only because the container was the
  finding's own partner.** Two guards kill that — total coverage and the two-member minimum —
  and both must be present, because each alone would let a variant through.
- **Do not sell this as a `text-missing` fix.** It clears 0.48% of `text-missing`. The
  mountain is something else and stays open.
- The pill reads `REGROUPED`. ~~The row's Dutch explanation uses the editors' own words —
  *dezelfde tekst, anders verdeeld*.~~ **Struck 2026-08-18**: [ADR
  0014](../../../docs/adr/0014-the-interface-speaks-english.md) landed after this ticket was
  written and the interface speaks English on all six stores, and `meaning` is drawn — the
  class pill wears it. The phrase survives as the **sense** and not the letters: the label is
  *Same text, divided differently*, because what the editors were pointing at is the division
  and never the merge. Seven notes describe the fold in prose (*"de content staat een regel
  erboven"*); nobody has ever written *samengevoegd*, and nothing in the log says *merged*.
- A run may contain a **heading** (`be/laagste-prijs-garantie`). That case, and the heading
  jump-list consequence, is [121](121-a-run-may-hold-a-heading.md). Do not build it here, and
  do not add a rule that would forbid it later.

## Answer

Built 2026-08-18. **38 rows on 34 pages across all six stores**, absorbing **32 `copy`**, **42
`text-missing`** and **6 `restructured`**. Nothing else moves. **18 of 1,061 live judgements
detach**, all of them dismissals, and the change is not refused.

### Where it lives

Pass 2 is `mergeRuns()` in `compare/match.mjs`, called from `diffRows()` between the LCS and
`pairLeftovers()`. ADR 0012's criterion is `coversExactly()` beside it, on token sequences, and
`joinRun()` is the one function that both the criterion and the finding id read — so the id
cannot be keyed on a string the test did not compare.

A row carries `prodRun`: the whole run, with `prod` its **first** member. That choice is what
made the rest free — the row sorts, anchors, deep-links and names its section exactly where it
did before, and a reader that knows nothing about runs still draws a unit. On the wire
`DiffRow.prodRun` is **absent** and not null on every other row: 38 rows carry one, and a null
on the rest is bytes in all 816 reports.

The class inherits ticket 86's information-row behaviour whole and for free — `canDecide()` and
`toneOf()` both read visibility and not a class name, and `classes.test.mjs` was already
asserting `regrouped` by name. What had to be built in the web layer is the row itself:
`RunCells` in `ContentView.jsx`, which is deliberately **not** `DiffCells` — there is no word
diff to draw and no clamp budget to spend, because the two sides hold the same tokens in the
same order.

**One wide row was read as one row whose left cell holds the run**, stacked in document order
with each member's own tag and its own link into production, rather than a `colSpan={3}` band
like `Marker`. *Left* and *right* in this ticket are the two comparison columns, and a band
would have had to rebuild them inside itself — losing the column alignment that is the reason
the table is `table-fixed` at all.

### The third guard was missing, and the corpus caught it

ADR 0012's criterion has three parts, and the first draft of this ticket built two of them.
Total coverage and the two-member minimum were there; *each member is a block that nothing
else claims* was not, on the reading that at pass-2 time nothing but the LCS has claimed
anything.

That reading is wrong, and the probe found the page:
`de/(de)shading-panel/produktinformationen` sends its two height rows both as themselves **and**
as one joined block. Production's two rows cover the joined block exactly, so the pass took
them — and the two new-site blocks holding those same words were left with no counterpart and
read as `text-added`. The page then said the words were regrouped and invented in the same
breath. It was the whole of the movement outside the three classes this ticket permits: 1 page
of 722, +2 `text-added`, and the acceptance criterion is what refused it.

`claimedElsewhere()` is the guard, and it is deliberately the conservative test — *any* other
new-site leftover at the pair threshold, not merely a better one than the merged block. A pass
that runs ahead of the greedy matcher cannot ask the greedy matcher who it would have chosen
without becoming the thing it runs ahead of. It costs 3 of the 41 instances the looser
reading found.

### Per-store counts, before and after

From `node crawl/probes/probe-116-regrouped-collateral.mjs`, 816 extracts against the 816
reports on disk, which are the pipeline as it stood before this ticket over the same extracts.

| store | pages | rows | `copy` | `text-missing` | `restructured` | work |
|---|---|---|---|---|---|---|
| uk | 6 | 8 | 223 → 216 | 1628 → 1617 | 151 → 150 | 3754 → 3736 |
| fr | 6 | 7 | 207 → 202 | 1630 → 1622 | 109 → 107 | 3619 → 3606 |
| be_fr | 5 | 6 | 216 → 212 | 1664 → 1657 | 117 → 115 | 3651 → 3640 |
| de | 6 | 6 | 199 → 194 | 1744 → 1739 | 83 → 82 | 3859 → 3849 |
| nl | 6 | 6 | 235 → 229 | 1631 → 1625 | 105 → 105 | 3851 → 3839 |
| be | 5 | 5 | 257 → 252 | 1391 → 1386 | 95 → 95 | 3317 → 3307 |
| **all** | **34** | **38** | **1337 → 1305** | **9688 → 9646** | **660 → 654** | **22051 → 21977** |

**The corpus tally moved in four classes and no others**, which the probe asserts and fails
on. 80 finding ids vanished and 38 arrived, and **every vanished id is on a page that gained a
regrouping** — the re-pairing collateral the ticket told us to fear reaches no page the
criterion is silent about.

Two of the ticket's estimates were close and one was not. ≈40 instances → **38**; ≈33 `copy` →
**32**; ≈45 `text-missing` → **42**. The estimate of ≈59 detaching dismissals was three times
too pessimistic: it is **18**.

### The collateral, and why it is cheap

| what | live | detaches |
|---|---|---|
| dismissals | 829 | **18** |
| fix claims | 232 | 0 |

11 on `nl` and 7 on `uk`; the other four stores lose nothing. 13 sat on a `copy` and 5 on a
`text-missing` — the two classes the row absorbs. 12 are s.schouten's and 6 d.aerle's. No page
review and no fix claim is touched, and nothing on a page without a regrouping moved.

The announcement is
[notes/2026-08-18-the-same-words-divided-differently.md](../notes/2026-08-18-the-same-words-divided-differently.md).
It makes one point the fold's note could not: a lost dismissal here does **not** come back to
be pressed again, because the row that replaces it is not work and asks nothing. What was
being dismissed was the log being wrong, and it is no longer wrong.

### The named regressions hold

- `nl/proefpakket/succes` — one `regrouped` row, and the false `copy` at 0.84 and the false
  `text-missing` are both gone. Work 6 → 4.
- `be_fr/(be_fr)fr/avantages` — work **35 → 35**, no `regrouped` row. Containment would have
  taken it.
- `be_fr/(be_fr)fr/faq/collecte-livraison` — work **11 → 11**, no `regrouped` row. The phone
  number is still a finding.

### What the next two tickets inherit

- `be/laagste-prijs-garantie` **fires**, with a heading as a run member. Nothing in the pass
  reads `kind`, so no rule forbids it and [121](121-a-run-may-hold-a-heading.md) still has its
  ticket — the jump-list consequence is untouched here: `outlineFrom()` reads `row.prod`, so a
  run whose **first** member is the heading keeps its entry and a run whose second member is
  the heading does not.
- [120](120-a-split-paragraph-is-one-row.md) reuses `coversExactly()`, `joinRun()` and
  `claimedElsewhere()` with the sides swapped. `mergeRuns()` is the shape that has to be
  mirrored, and `prodRun` is the field 120 will need a counterpart for on the new side.
- A `regrouped` finding is **not searchable**: `search.mjs` indexes work only, and its own
  comment says widening that is a payload decision and not this ticket's to make. Written down
  here rather than left for a reader to discover.
