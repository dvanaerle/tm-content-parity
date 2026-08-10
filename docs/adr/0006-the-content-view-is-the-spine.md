# The content view is the spine, and the word diff is a cell renderer

The proposal named the side-by-side word diff "the main working interface". The
corpus says it is not. Measured over 448 reports, 22,990 shown findings:

| class | shown findings | share |
| --- | --- | --- |
| `text-missing` | 11,344 | 49.3% |
| `missing-link` | 4,834 | 21.0% |
| `image-missing` | 2,789 | 12.1% |
| `heading-level` | 1,215 | 5.3% |
| `link-target` | 1,076 | 4.7% |
| `copy` | 789 | 3.4% |
| the other six shown classes | 943 | 4.1% |

Three one-sided classes are **82%** of the work. `copy` is 3.4%, and it is the only
class with a similarity score.

For a one-sided finding the two sides are a string and nothing. A word diff of
`Bekijk alle deals` against nothing draws one deletion block. It compares nothing,
because the comparison is already answered. The question that is **not** answered is
where the text belongs, and whether it is gone or moved. That question is answered by
the rows around it, in document order.

So we decided: the **content view** is the main working interface. The word diff is a
cell renderer inside it, and it earns its keep on `copy`, `casing`, `alt-changed` and
`link-target`.

## The default is differences, with the equal rows collapsed

The content view shows the differing rows by default. A run of equal rows collapses
into one **context marker** that names how many blocks it holds, and the marker
expands.

The measurement that decides the default: a comparable page holds a median of 37
shown findings, 151 at the 90th percentile, and 399 on the worst page
(`nl__fotogalerij/zonwering`). At that density an editor who must scroll past every
agreeing block pays for context at nearly every row and reads it at few of them.

Ticket 12 retired the **Diff** tab because it showed the differing rows only, "so
once every row was tinted the tint said nothing". That failure is specific and it is
avoidable: when every visible row is a difference, **the row tint carries no signal,
so it goes**, and the class pill carries the class instead. A view that keeps the tint
in this mode repeats the mistake.

The context marker is what makes this different from the retired tab. The retired tab
deleted position. The marker keeps position, states the distance between two findings,
and returns the blocks on one click.

## Considered options

- **Keep every equal row on screen, always.** Rejected. It is correct about context
  and wrong about cost. At 151 findings on a p90 page the context is paid for
  continuously and used rarely.
- **Remove the equal rows entirely.** Rejected. `restructured` exists as a class
  because moved text is the common case behind a `text-missing`, and a tool that
  cannot show the neighbouring blocks cannot tell *moved* from *gone* on the class
  that is half the corpus.
- **A word diff for every class.** Rejected. It renders 82% of findings as a solid
  deletion and calls it a comparison.

## Consequences

- `restructured` is worth triaging deliberately under ADR 0005, because it is the
  class that answers the question the collapsed view is built to keep answerable.
- The one-sided classes need an affordance the word diff does not give: where the
  missing text belongs. The content view gives it by position, and that is the whole
  reason it stays the spine.
- Markdown stays an export beside the view and never the spine, because Markdown
  flattens the element identity the finding id needs.
- The dashboard count of equal pages counts a thing nobody works on, and it may go.
  The equal **rows** may not.

## Scope

Axis A only. Axis B keeps its own tab and its own bar.
