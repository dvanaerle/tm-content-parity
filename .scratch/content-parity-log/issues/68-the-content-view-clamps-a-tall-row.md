# 68 — The content view clamps a tall row

**What to build:** a page of long units is still read by scanning, and it still paints
quickly.

The content view exists so that a difference is found by scanning and not by reading.
Nothing clamps a row today. After ticket 67 a paragraph is one unit: about 1,250
characters in a cell that is roughly 40% of the width, so one row is 20 to 24 wrapped
lines and 450 to 550 pixels tall. A jump to a row lands inside a row that is taller
than the screen, so the reader cannot tell where they are.

The word diff costs more as well. `compare/worddiff.mjs` builds a full LCS table over
the tokens of both sides, in the browser, once for each cell pair, with no trim and no
cap.

**Blocked by:** 67. **Sequenced after 79**, which collapses the runs of equal rows.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, questions 7 and 8. The
numbers, the criteria and the decisions below come from the grilling of 2026-08-10.

## Measured on 2026-08-10, before the fold

448 reports, 32,158 rows, 11,847 of them two-sided. Tokens counted with the `TOKENS`
regex in `compare/worddiff.mjs`, so separator runs count and a token is about half a
word.

| | median | p95 | p99 | max |
|---|---|---|---|---|
| n·m | 49 | 7,569 | 23,409 | 112,225 |
| tokens, one side | 7 | 87 | 155 | 335 |

The corpus costs 14.8 million LCS cells in total.

- **8,461 rows are already equal**, and they hold 11.5 million of those cells: **78%
  of the whole cost**. The content view diffs them because
  `web/src/components/ContentView.jsx` passes no `equal` prop to `DiffCells`, where
  `web/src/components/Ledger.jsx` does. They are also the longest rows, because they
  hold the big untouched paragraphs.
- `copy` and `casing` together are 1,090 rows, and the largest is 45,059 cells.
- **The worst page for the diff is `nl__privacy-beleid`**: 47 two-sided rows, 287,971
  cells, about 1.15 MB of `Int32Array` for each render pass. Then
  `nl__heavy-duty-terrasoverkapping` at 208,449, and `nl__carport`, which holds the
  worst single row at 94,249 cells.
- **`nl__fotogalerij/zonwering` is the worst page by findings and one of the cheapest
  by diff**: 434 findings, but 7 two-sided rows and 15 cells. Its new side has 9
  elements against production's 178, so almost every row is one-sided, and a one-sided
  row costs the diff nothing. ADR 0006, ticket 79 and ticket 87 all name it as the
  worst page. It is the worst page **for the clamp and the jump**. Do not name it for
  the diff.

Rows are fragment-shaped today, which is what ticket 67 exists to correct: the median
side is 7 tokens, 78.5% of rows are under 20 tokens, and there are 19,096 `cta` units
against 20,247 `text` units.

**Caveat.** This corpus is before the fold. The words that the leaf rule discards are
in no stored file, and no raw HTML is kept, so the sizes after the fold cannot be
measured here. A naive merge of index-adjacent `cta` runs suggests about twice the
tokens and four times n·m, but it over-counts nav link lists and under-counts the
discarded prose at the same time, so it is not a number for this ticket. Re-run the
measurement after 67.

## The four numbers

- **The clamp is four lines.** It holds a change of two lines with one line above and
  one below, it puts a clamped row at about 100 pixels, and a 900-pixel screen then
  shows seven or eight rows.
- **The cap is 50,000 cells of n·m**, counted after the trim. It catches 13 rows today
  (0.11%) and no `copy` or `casing` row, so it fires on nothing anybody reads now. It
  exists for the tail after the fold, where a naive merge puts a bad pairing near 9
  million cells, or 36 MB for one row.
- **The diff cost falls by at least 70%** in total LCS cells on `nl__privacy-beleid`.
  This is the gate, because it is countable in Node and a test can hold it.
- **First paint: LCP at 2.5 s or less and TBT at 200 ms or less**, on
  `nl__privacy-beleid` and on `nl__fotogalerij/zonwering`. These are targets and
  evidence, not a passing condition: a browser number that no test can re-check is
  evidence and not a rule.

## Acceptance criteria

- [ ] **The content view stops diffing rows that are already equal.** Pass `equal` from
      `ContentView.jsx`, as `Ledger.jsx` does. Measure the total cell count on
      `nl__privacy-beleid` **before the trim and the cap land**, so this number is
      banked on its own. After 79 collapses the equal runs, opening one run must not
      bring 11.5 million cells back.
- [ ] `wordDiff` trims the common prefix and the common suffix before it builds the
      table. One changed word in a long paragraph costs almost nothing.
- [ ] `wordDiff` caps at 50,000 cells of n·m and returns a **fourth span type**,
      one `{ type: 'uncompared', text }` for each side. The return stays one array, so
      `spansFor` needs no change and a consumer that does not know the type renders
      text instead of failing.
- [ ] An **uncompared** cell says, in Dutch, that the comparison did not run, and it
      says it about the comparison and never about the content. The cap is size and not
      similarity, so a paragraph with five scattered edits and a score of 0.97 also
      reaches it. The word *herschreven* is refused for the same reason `CONTEXT.md`
      retires "changed": the tool cannot know it.
- [ ] The class stays `copy`, the score stays with it, and **no count moves**. No class
      enters `compare/vocabulary.mjs`.
- [ ] **A row clamps to four lines.** One clamp state for the row, both cells at one
      height, and one control in the status cell beside the class pill. The control is
      always rendered and it is quiet: a measuring pass over 288 rows to hide a small
      piece of furniture is the trade backwards.
- [ ] The clamp shows the lines that hold **the first difference**, which the trim
      already computed. A one-sided row and an uncompared row show the first lines.
- [ ] A row's anchor id is keyed on the unit's **position in the whole document**, not
      on its index in the row list. Today `web/src/lib/view.mjs` writes `r${index}`
      over the filtered rows, so a hash link is already broken by a filter change, and
      79 changes which rows exist at all.
- [ ] **A jump to a row opens it**, and it opens the collapsed run that holds it. A jump
      is a request to read that one row. The row grows downwards from the top of the
      screen, so it does not push its own target away.
- [ ] **Nothing is added for the scroll offset.** Nothing above the table is sticky
      today, so the native jump and the `scroll-mt-4` on the row already put the first
      line at the top. The complaint is row height, and the clamp is the whole fix. Say
      in the answer that this holds only while nothing above the table is sticky:
      ticket 87 is what could break it.
- [ ] **Tests in `compare/compare.test.mjs`**, beside the eleven that are there. Trim
      **equivalence**, that the trimmed diff equals the untrimmed diff — this is the one
      that lets the trim be trusted. The lossless rejoin test still passes. An identical
      prefix and suffix with a change between them. One side a strict prefix of the
      other. The cap just under and just over. A capped input where the table is never
      allocated, asserted by input size and never by a clock.
- [ ] The measured LCP and TBT, before and after, on both pages, written into this
      ticket. The probe script goes in a new `web/probes/`, because `crawl/probes/`
      holds crawl measurements and this measures `web/`.
- [ ] The measurement of n·m is **re-run after 67**, and the cap is adjusted once if the
      tail asks for it.
- [ ] **`blokken` stays.** Ticket 66 handed that word to this ticket, which owns the
      content view. ADR 0002 calls a content unit "the block an editor edits", and 79's
      context marker names a count of blocks, so the Dutch matches the decision. This
      ticket looked and declined to overrule it, and 66's loose end is closed.

## The decisions the grilling made

`docs/adr/0009-the-word-diff-runs-in-the-browser.md` records the first three, with the
rejected alternatives. **Read it before you change `compare/worddiff.mjs`.**

- **The diff stays in the browser.** Writing spans at compare time obeys the arrow, and
  it pays the bill in the same currency: a full report is already 11 MB across NL, and
  the payload is on the first-paint path too.
- **`compare/worddiff.mjs` stays where it is.** `web/` importing from `compare/` runs
  with the arrow, so it only looks like a back-arrow. ADR 0001 says the same on
  2026-08-10.
- **The cap is a rendering budget and not a class.** A new class would change every
  affected finding id, because `rule` is the class, and it would detach dismissals — a
  browser performance limit reaching into identity is the sharpest own-goal available
  here. Ticket 79's own trap says not to promote the diff.
- **The word `replaced` is refused.** `CONTEXT.md` already gives it to a migration
  decision on a one-sided page, which is a claim of fact that loses to re-check. The
  cell state is **uncompared**.
- **The clamp is about length, not about findings.** The original second criterion said
  the quiet rows stay short and the rows with findings open. After 79 there are no quiet
  rows left on screen, so that sentence says nothing — and the measurement shows the
  tallest rows today are the rows that **agree**.
- `CONTEXT.md` gained **clamp** and **uncompared**, and it now reserves **fold** to its
  two meanings there. A run of equal rows **collapses**; the row that stands for it is a
  **context marker**.

## Known and accepted

- The equal-row skip and 79's collapsing overlap: 79 keeps the equal rows off the first
  paint, and this ticket keeps them off the diff when a run is opened. Both are needed,
  and the first criterion is measured before the others so the two numbers stay apart.
- The cap number rests on a corpus taken before the fold. It is deliberately loose for
  that reason, and it has its own re-measurement criterion.
