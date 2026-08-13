# 120 — A split paragraph is one row

Type: task
Status: ready-for-agent
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

- [ ] `nl/glazen-schuifwand/productinformatie` produces one `regrouped` finding for that
      paragraph and no `text-missing` and no `text-added` for those units. The `be` and `de`
      counterparts behave the same, at run lengths 4 and 3.
- [ ] `fr/heavy-duty-veranda` — production's dimensions block against four new-site units, one
      per dimension line — produces one row.
- [ ] `be_fr/fr/echantillons` is **not** `regrouped`: the leftover label
      `"Formulaire de commande:"` is three tokens and no adjacent window covers production
      exactly. This is the case that would break if somebody later adds a leftover tolerance.
- [ ] `"Demander un pack d'échantillons"` inside `"Demander un pack d'échantillons gratuit"`
      is **not** `regrouped` — under four tokens, and one added word is not a re-division.
- [ ] A production unit split across new-site units that are **not adjacent** is not
      `regrouped`.
- [ ] Per-store counts before and after are in the answer. Expect ≈163 instances, ≈153 `copy`,
      ≈2 `text-missing` and ≈201 `text-added` absorbed. No class outside `copy`,
      `text-missing`, `text-added`, `restructured` and `campaign` may move.
- [ ] Tests at the `diffRows()` seam in `compare/compare.test.mjs`, beside 116's.

## Traps

- **`text-added` is hidden, so most of this is invisible by design.** The answer must state
  the shown and hidden movements separately or the ticket will read as four times more
  valuable than it is.
- **Do not let split re-open the containment question.** Production containing a new-site unit
  is exactly the `/fr/avantages` shape — 16 tokens of dropped copy — and it must stay a shown
  finding.
- Run lengths in the corpus: 2 → 131, 3 → 28, 4 → 4, 5 or more → **none**. The cap of four
  costs nothing; do not raise it speculatively.
