# 116 — A merged paragraph is one row

Type: task
Status: ready-for-agent
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

- [ ] `nl/proefpakket/succes` produces one `regrouped` finding and **no** `copy` and **no**
      `text-missing` for those units.
- [ ] `be_fr/fr/avantages` still produces a shown finding. Production holds a sentence about
      `6061-T6` that the new site drops — 16 tokens of lost copy — and containment would have
      called it `regrouped`. **This is the regression test that matters most.**
- [ ] `be_fr/fr/faq/collecte-livraison` still produces a shown finding: the phone number
      changed value.
- [ ] A `copy` whose sides differ only by a trailing token (`"… exacte prijs"` versus
      `"… exacte prijs >"`) is **not** `regrouped` — rejected by total coverage and by the
      two-member minimum independently.
- [ ] A run of two units where the new site merged them **and** added a word stays `copy`.
- [ ] Per-store counts before and after are in the answer. Expect ≈40 instances, ≈33 `copy`
      and ≈45 `text-missing` absorbed. **No class outside `copy`, `text-missing` and
      `restructured` may move.**
- [ ] **The re-pairing collateral is counted before this lands.** Run the pipeline with and
      without the pass, diff the finding ids, count the live overrides that fall off the
      difference. The number goes in the answer whatever it is; per `PRD.md`'s
      *Classification* rule — *measures the false positives first and may refuse the
      change* — it may refuse the change.
- [ ] The announcement note for the detached overrides is written, in the shape of
      `notes/2026-08-07-the-fold-and-your-judgements.md`. ≈59 live dismissals are expected to
      detach, most of them s.schouten's.
- [ ] Tests live at the `diffRows()` seam in `compare/compare.test.mjs`. **Do not test
      `pairLeftovers()`, `mayPair()` or `similarity()` directly** — the pass order is what we
      may want to change next.

## Traps

- **A merge target was always an already-paired unit.** There is no case in the corpus of a
  brand-new unpaired unit being exactly the concatenation of orphaned production units. Do
  not build for it.
- **38 of 100 candidates under an early looser rule fired only because the container was the
  finding's own partner.** Two guards kill that — total coverage and the two-member minimum —
  and both must be present, because each alone would let a variant through.
- **Do not sell this as a `text-missing` fix.** It clears 0.48% of `text-missing`. The
  mountain is something else and stays open.
- The pill reads `REGROUPED`. The row's Dutch explanation uses the editors' own words —
  *dezelfde tekst, anders verdeeld*. Seven notes describe the fold in prose (*"de content
  staat een regel erboven"*); nobody has ever written *samengevoegd*.
- A run may contain a **heading** (`be/laagste-prijs-garantie`). That case, and the heading
  jump-list consequence, is [121](121-a-run-may-hold-a-heading.md). Do not build it here, and
  do not add a rule that would forbid it later.
