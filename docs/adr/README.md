# Architecture decision records

One decision per file, `NNNN-a-sentence-that-states-the-decision.md`, numbered in the order
they were **written**.

## A number is taken when the file lands, never before

A ticket must not reserve an ADR number. Write *"a new ADR"*, or *"a new ADR superseding
0025"* — name the number it supersedes, never the number it will get. The number is chosen by
whoever writes the file, as the next free one at that moment.

This rule is written down because the repo has already paid for its absence. On 2026-08-19 a
PRD created seven tickets that pre-assigned 0023, 0024 and 0025. Only the ticket holding 0025
was built. 0023 was then taken by unrelated ui-polish work (`da588cf`) and 0026 by the gallery
work (`71a6cea`), so two tickets now name numbers that belong to other decisions, and:

**0024 is vacant and will stay vacant.** It was reserved by
`.scratch/cross-store-reuse/issues/04-an-image-repeat-crosses-all-six-stores.md`, which was
not started until 2026-08-21 and took **0028** when it was, as this rule says it should.
Nothing was ever written at 0024 and nothing was deleted. The gap is a reservation that
expired, not a lost decision — do not go looking for it, and do not fill it, because a number
that once meant one thing should not later mean another.
