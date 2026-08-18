# Regrouped requires total coverage, not containment

A production block that the new site sends as several blocks — or several that it sends as
one — is the same words divided differently. The log called it `text-missing` plus `copy`,
which is two findings of nothing. The new `regrouped` class names it. The decision this ADR
records is **not** that the class exists; it is the test the class uses, because the obvious
test is wrong.

## The decision

One side's block must be **exactly** the space-joined concatenation of the other side's run
of blocks, after tier-1 normalisation, with **nothing left over**. A run is adjacent and
uninterrupted, at most four members, each member at least four tokens, and each member is a
block that nothing else claims or is the block's own counterpart. The arity is one-to-many
or many-to-one and never many-to-many.

## Why not containment, which is four times cheaper

Containment — *production's text appears verbatim inside a new-site block* — was measured
over the 722 comparable reports of 2026-08-12 and would have cleared **1,653 findings
(16.9% of shown `text-missing`)** against total coverage's **233 (2.09% of the 11,167 shown
text and copy findings)**. It was refused, and the rule that allowed the refusal to be
priced rather than argued is in `PRD.md` — *Implementation decisions* → *Classification*:
*a research ticket measures the false positives first **and may refuse the change***.

Containment is evidence of containment. It is not evidence of regrouping. The corpus names
its own counter-examples:

- `be_fr` `/fr/avantages`, `copy` at 0.72. Production's block ends with a sentence about
  `6061-T6` Heavy Duty aluminium; the new site **drops it** — 16 tokens of lost copy.
  Production's text contains the new site's text, so containment calls this `regrouped`,
  which is `information` and undecidable. A real defect would have gone quiet.
- `be_fr` `/fr/faq/collecte-livraison`, `copy` at 0.95. Production ends with
  `(+32) 014 480 375`; the new site carries a **different number** in its own block. Again
  containment accepts, and a changed phone number on a delivery page becomes unreportable.
- 38 of the 100 live overrides an early containment rule touched fired only because the
  container was the finding's **own partner** — `"… exacte prijs"` inside
  `"… exacte prijs >"`. Not a regrouping; the trailing-token noise editors dismiss by hand.

Total coverage rejects all of these, and accepts the case that started the work:
`nl` `/proefpakket/succes`, where `P1 (46 tokens) + P2 (18) === N1 (64)` byte-for-byte and
the false `copy` at 0.84 and the false `text-missing` leave together.

The asymmetry is the point. A rule that under-detects leaves a row an editor dismisses once.
A rule that over-detects moves lost content into a class that is not counted and cannot be
decided — which is the silence `CONTEXT.md` is written to prevent.

## Considered and rejected

- **One unaccounted run of up to three tokens.** +20 instances, +22 shown findings. Refused:
  the measurement's own counter-example is `/fr/echantillons`, where the leftover is the
  three-token label `"Formulaire de commande:"`. Three tokens is a real addition or a real
  loss, and this is the one relaxation that could later swallow an `/fr/avantages`.
- **A seam allowed to differ by punctuation.** Buys exactly one instance corpus-wide.
- **Similarity scoring on the concatenation.** The threshold that catches merge-and-edit is
  the threshold that calls a rewrite a regrouping. `copy` already exists for that.
- **Many-to-many.** A reader can verify that two blocks are one block at a glance and cannot
  verify that three are two. No measurement supports it.
- **Changing what a content unit is** — flattening a `ul`, splitting a `p` on sentences.
  Refused: ADR 0002 makes the unit the editable block, and the finding id, document order
  and the `li`-level rows of the content view are all built on it. This is a matching
  problem, so it is fixed in the matcher.

## Consequences

- **It runs as pass 2, ahead of the greedy matcher.** Greedy would otherwise claim
  `P1 ↔ N1` at 0.84 and destroy the run before the exact test ever saw it — the same
  argument that already puts LCS ahead of greedy.
- **Roughly 59 live overrides detach**, all of them `copy`, 90 of the wider population
  s.schouten's, because `rule` is a term of the finding id. Nothing can be migrated: the
  class change is not recorded anywhere the old key can be reached from. The loss is small
  because the class is `information` — nothing comes back to ask, so the judgement is not
  lost so much as made unnecessary. Against context, 192 live overrides are **already**
  orphaned by content drift.
- **It is a `copy` cleanup and not a `text-missing` cleanup.** 186 of 1,384 `copy` (13.4%)
  against 47 of 9,783 `text-missing` (0.48%). The `text-missing` mountain is something else,
  and this ADR must not be read as having explained it.
- **The cap of four is free.** The corpus holds no five- or six-member exact coverage, so the
  cap costs nothing today and admits pages a later crawl may find.
- **Re-pairing collateral is unmeasured.** Inserting a pass changes what the greedy pass
  pairs, so findings this test says nothing about can take new ids and shed overrides. That
  count gates the ticket, not this ADR.
- **A run may contain a heading.** ~~`be/laagste-prijs-garantie` merges a heading and the
  paragraph after it into one new-site paragraph.~~ The heading keeps its place in the heading
  jump-list and still anchors, because a landmark that vanishes when the other site inlines
  it would make production-order navigation depend on the new site's markup.
  **Corrected 2026-08-18, ticket 121.** The decision stands and the example was wrong: on that
  page production sends *"Hoe kan het dat…"* as a `p`, so the row reads `p + p → p` and no
  heading is in the run. The corpus holds the case **the other way round** — 29 of 189
  regrouped rows are `p → h3 + p` or `p → h2 + p`, where production sends one paragraph and
  the new site promotes its first sentence to a heading, and **no run on the production side
  holds a heading at all**. So the consequence is read on either side: a regrouped row answers
  the jump-list with every heading in production's run, and with the new site's where
  production holds none. `crawl/probes/probe-121-runs-with-headings.mjs` is the measurement.
