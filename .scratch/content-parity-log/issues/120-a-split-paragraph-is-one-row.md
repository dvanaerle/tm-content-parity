# 120 — A split paragraph is one row

Type: task
Status: resolved 2026-08-18 — built on branch `ticket-104-search-page-scope`. See the answer.
Blocked by: 116
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** the mirror of [116](116-a-merged-paragraph-is-one-row.md). When the new
site sends **one** production paragraph as several blocks, the log says so once instead of
reporting a `text-missing` and a handful of `text-added`.

The demo: `nl/glazen-schuifwand/productinformatie`. Production sends one paragraph —
`"Hulp bij uw keuze? Lees hier hoe u de juiste maatvoering kiest… neem contact met ons op."`
— and the new site sends it as four blocks. Today: one `text-missing` and four `text-added`.
After this ticket: one row reading `REGROUPED · p → 4×p`. The same page exists in `be` and in
`de`, where it is a three-way split.

Everything this needs already exists from 116 — the class, the wide row, the id over the
space-joined run, `detail`, the null `score`, the information-row behaviour. **The only new
work is searching in the other direction**, which is why it is a separate ticket rather than
a second half of 116.

## Why it lands second even though it is the larger half

Split is 163 instances against merge's 40, so by volume it is four times the work. But **201
of the 364 findings it clears are `text-added`, which is already hidden**, so it removes 153
`copy` and 2 `text-missing` — real, but it demos far less than 116 does. 116 fixes the row a
human complained about; this one mostly cleans up behind a PageBuilder rebuild.

## What must stay true

- **The criterion is the same, sides swapped.** The production unit is exactly the
  space-joined concatenation of an adjacent, uninterrupted run of 2 to 4 new-site units, after
  tier-1 normalisation, nothing left over, each member at least 4 tokens, each member unpaired
  or the production unit's own counterpart.
  [ADR 0012](../../../docs/adr/0012-regrouped-requires-total-coverage.md).
- **Merge resolves before split** within a page, and no unit is consumed twice. This is the
  order the measurement used; a different tie-break shifts a handful of instances.
- **The row is positioned at the production unit**, in production document order — there is
  only one on that side, so this is simpler than 116.
- **`detail` reads `p → h2 + 4×li`** — the new site's tags in document order, with a count
  when a tag repeats.
- **Never many-to-many.** A run on one side pairs with a single unit on the other, and that is
  all. A reader can verify that one block is those four; nobody can verify three against two.

## Acceptance criteria

- [x] `nl/glazen-schuifwand/productinformatie` produces one `regrouped` finding for that
      paragraph and ~~no `text-missing` and~~ no `text-added` for those units. The `be` and `de`
      counterparts behave the same, at run lengths 4 and 3. **The `text-missing` stays**:
      production sends that paragraph twice and the words are on the new site once. See the
      answer.
- [x] `fr/heavy-duty-veranda` — production's dimensions block against four new-site units, one
      per dimension line — produces one row.
- [x] `be_fr/fr/echantillons` is **not** `regrouped`: the leftover label
      `"Formulaire de commande:"` is three tokens ~~and no adjacent window covers production
      exactly~~ — **an adjacent window does cover it exactly**, and the four-token member floor
      is the only guard that refuses the page. This is the case that would break if somebody
      later adds a leftover tolerance.
- [x] `"Demander un pack d'échantillons"` inside `"Demander un pack d'échantillons gratuit"`
      is **not** `regrouped` — under four tokens, and one added word is not a re-division.
- [x] A production unit split across new-site units that are **not adjacent** is not
      `regrouped`.
- [x] Per-store counts before and after are in the answer. ~~Expect ≈163 instances, ≈153
      `copy`, ≈2 `text-missing` and ≈201 `text-added` absorbed.~~ **151 instances, 143 `copy`,
      0 `text-missing`, 184 `text-added`**, and 3 each of `restructured` and `campaign`. No
      class outside `copy`, `text-missing`, `text-added`, `restructured` and `campaign` moved,
      and the probe throws if one does.
- [x] Tests at the `diffRows()` seam in `compare/compare.test.mjs`, beside 116's.

## Traps

- **`text-added` is hidden, so most of this is invisible by design.** The answer must state
  the shown and hidden movements separately or the ticket will read as four times more
  valuable than it is.
- **Do not let split re-open the containment question.** Production containing a new-site unit
  is exactly the `/fr/avantages` shape — 16 tokens of dropped copy — and it must stay a shown
  finding.
- Run lengths in the corpus: 2 → 131, 3 → 28, 4 → 4, 5 or more → **none**. The cap of four
  costs nothing; do not raise it speculatively.

## Answer

Built 2026-08-18. **151 rows on 121 pages across all six stores**, absorbing **143 `copy`**,
**184 `text-added`**, 3 `restructured` and 3 `campaign`. **`text-missing` did not move at
all.** 52 of 1,061 live judgements detach, all of them dismissals on `copy`, and the change is
not refused.

### Where it lives

`mergeRuns()` is now **`regroupRuns()` in `compare/match.mjs`, called twice** — once with
production dividing the words and once with the new site — and nothing inside it or below it
knows which side it is on. ADR 0012's criterion is one sentence, *one side's block is exactly
the other side's run*, so it is one implementation: `coversExactly()`, `joinRun()` and
`claimedElsewhere()` are untouched except for parameter names that stopped naming a side.
`diffRows()` is what fixes the order — **merge resolves first**, and every unit either pass
claimed is out of the other's reach, so no unit is on two rows.

A split row carries `newRun` where a merge carries `prodRun`, and **never both**: that would be
the many-to-many ADR 0012 refuses. The row is positioned at the production unit, which is the
only one on that side, so it sorts, anchors and deep-links exactly where a `text-missing` did
and `outlineFrom()` needed no thought at all.

The view had one real decision in it. `RunCells` now draws **the side holding one block as a
run of one**, which made the second direction a `RunCell` called twice rather than a mirrored
component to keep in step. `DiffCells` is still not reached: the words are identical, so there
is no word diff and no clamp budget either way.

`detail` reads `p → 4×p`, with a repeat counted, while a merge still reads `p + p → p`. The
count is of **adjacent** tags, and that is not a narrowing of the ticket's *"with a count when a
tag repeats"* but the rest of the same sentence: the tags are *in document order*, so `li + p +
li` cannot be counted without printing a run the new site does not have. No run in the corpus
separates a repeat that way. Spec 119 writes both shapes down, and the asymmetry is the reading: production's
runs are two and three blocks of prose, where `p + p` is plainer than `2×p`, and the new site's
are lists of up to four, where spelling them out is longer than the row it describes.

### Per-store counts, before and after

From `node crawl/probes/probe-120-regrouped-split.mjs`. **The probe carries a baseline file
where 116's did not**: `data/reports/` on disk still predates 116, so reading it would have
measured both directions together. The baseline is the same 722 extracts compared by this
working tree before the split pass was written, fingerprinted on `compare/`, and the diff run
refuses a baseline carrying its own fingerprint.

| store | pages | rows | `copy` | `text-missing` | `text-added` | work |
|---|---|---|---|---|---|---|
| be_fr | 22 | 29 | 212 → 184 | 1657 → 1657 | 1057 → 1020 | 3640 → 3612 |
| fr | 21 | 27 | 202 → 176 | 1622 → 1622 | 1093 → 1058 | 3606 → 3580 |
| nl | 21 | 27 | 229 → 204 | 1625 → 1625 | 1357 → 1327 | 3839 → 3814 |
| uk | 20 | 26 | 216 → 192 | 1617 → 1617 | 1267 → 1236 | 3736 → 3712 |
| be | 20 | 24 | 252 → 230 | 1386 → 1386 | 1321 → 1294 | 3307 → 3285 |
| de | 17 | 18 | 194 → 176 | 1739 → 1739 | 1050 → 1026 | 3849 → 3831 |
| **all** | **121** | **151** | **1305 → 1162** | **9646 → 9646** | **7145 → 6961** | **21977 → 21834** |

`text-missing` is in the table because the ticket estimated it at ≈2, and the column that
carries the correction has to be there to be read: **not one store moves by one finding.**

**Shown and hidden, stated apart, because the trap says to.** The corpus moves by **−143 in
`work`** and by **−39 in what is not counted** (184 `text-added` and 3 `restructured` leave,
151 `regrouped` arrive, and 3 `campaign` are diagnostic). **190 of the 333 findings this clears —
57% — were already out of sight**, and only the 143 `copy` were ever on anybody's screen. As
predicted, it demos far less than 116 does.

Three of the four estimates were close and one was not: ≈163 instances → **151**; ≈153 `copy`
→ **143**; ≈201 `text-added` → **184**; ≈2 `text-missing` → **0**, and the reason is the repeat
below.

Run lengths, which is the cap of four earning its keep: **2 → 119, 3 → 28, 4 → 4, five or more
→ none.** The ticket's corpus figures were 131, 28 and 4; the threes and fours are exact and
the twos are 12 short, which is the whole of the shortfall against ≈163. The shapes: `p → 2×p` 87, `p → 3×p` 22, `p → h3 + p` 20, `p → h2 + p` 9,
`p → p + 2×li` 5, `p → 4×p` 4, `p → p + li` 2, and one each of `li → 2×li` and `li → 3×li`.

### The collateral

333 finding ids vanished and 151 arrived, and **every vanished id is on a page that gained a
split** — the re-pairing reaches no page the criterion is silent about.

| what | live | detaches |
|---|---|---|
| dismissals | 829 | **52** |
| fix claims | 232 | 0 |

All 52 sat on a `copy`, 42 are s.schouten's and 10 d.aerle's, and they are spread over 42
pages with at most four on one (`uk/veranda/sidewall`). 24 on `nl`, 22 on `uk`, 6 on `be`; the
other three stores lose nothing. The announcement is a second section in
[notes/2026-08-18-the-same-words-divided-differently.md](../notes/2026-08-18-the-same-words-divided-differently.md),
beside the merge's rather than a note of its own: it is one change an editor met once.

### The named cases

- `nl/glazen-schuifwand/productinformatie` — one row, `p → 4×p`, and the four `text-added` are
  gone. `be` is the same at four members, and `de/(de)glasschiebewand/produktinformationen` is
  the three-way split the ticket predicted.
- `fr/(fr)heavy-duty-veranda` — one row, `p → 4×p`: production's dimensions block against one
  new-site block per dimension line. Work 32 → 31.
- `be_fr/(be_fr)fr/echantillons` — **not** `regrouped`, work 11 → 11. The corpus is sharper
  than the ticket here: the two new-site blocks *do* cover production's paragraph exactly, and
  the **only** guard that refuses them is the four-token floor on the label
  `"Formulaire de commande:"`. So this page is not defended by total coverage at all — it is
  defended by the member floor, which is the guard a leftover tolerance would have to argue
  past. The test at `diffRows()` uses the page's own strings and says so.
- `"Demander un pack d'échantillons"` inside `… gratuit` — stays `copy`, refused twice over.

**The acceptance criterion the corpus corrected.** *"no `text-missing` for those units"* does
not hold on the demo page, and it cannot: production sends that paragraph **twice** (units 29
and 30, byte-identical), the new site sends the words once, and no unit is consumed twice. So
the row appears, the second production copy stays a `text-missing`, and its finding keeps its
id with `occurrences` 2 → 1. That is the honest reading — production really does hold those
words twice — and it is why corpus `text-missing` moved by zero instead of the estimated two.
The same is true on `be`.

### Tests

16 at the `diffRows()` seam in `compare/compare.test.mjs`, beside 116's, and `pairLeftovers()`,
`mayPair()` and `similarity()` are still untested directly. Three more at `prepareRows()` in
`web/src/lib/view.test.mjs` — the run resolving on the right, the row anchored at production's
unit with no `prodRun`, and a member that does not resolve dropping the whole run — and the id
over the new side's run is an added assertion in the same `findingId` case 116 edited.
