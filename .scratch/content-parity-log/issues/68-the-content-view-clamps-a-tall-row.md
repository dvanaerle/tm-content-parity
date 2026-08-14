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

Blocked by: 67. **Sequenced after 79**, which collapses the runs of equal rows.

Status: wontfix 2026-08-14. Resolved 2026-08-10 and **the clamp is withdrawn**, in this
ticket rather than in a new one: the feature is redundant for this team, and a ticket that
only says so would carry nothing the reversal does not already say here.

**Why it goes.** A lot of the time a block is shorter than four lines, so the clamp
changed nothing about those rows while its control still drew itself on every one of them
— 68 decided against a measuring pass, so the common row paid furniture for an affordance
it had no use for. And where a block *is* long, the complete overview beats the window: an
editor deciding about a paragraph wants the paragraph, not its first change with the
context cut away, and would open the row by hand every time to get it. Scanning is already
carried by 79's collapsed runs and by the class pill.

**What that label does and does not cover.** The clamp is gone: the four-line window
`clampedSpans()`, `CLAMP_LEAD`, the `clamped` prop, the `line-clamp-4` class, the control,
the `open` row set and `rowKeyFromHash()`, whose only caller was the effect that opened a
jumped-to row. **The diff-cost half of this ticket shipped and stays** — the prefix and
suffix trim, the 50,000-cell cap and the `equal` fact are what produced the 97.5% fall,
and none of them is touched. So `wontfix` is about the clamp and not about everything
below it. The accepted cost is that a long page goes back to 450–550 pixel rows.

The measurements below are kept exactly as measured on the day. They are the record of
what the clamp did, and no longer a description of the interface.

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

- [x] **The content view stops diffing rows that are already equal.** Pass `equal` from
      `ContentView.jsx`, as `Ledger.jsx` does. Measure the total cell count on
      `nl__privacy-beleid` **before the trim and the cap land**, so this number is
      banked on its own. After 79 collapses the equal runs, opening one run must not
      bring 11.5 million cells back.
- [x] `wordDiff` trims the common prefix and the common suffix before it builds the
      table. One changed word in a long paragraph costs almost nothing.
- [x] `wordDiff` caps at 50,000 cells of n·m and returns a **fourth span type**,
      one `{ type: 'uncompared', text }` for each side. The return stays one array, so
      `spansFor` needs no change and a consumer that does not know the type renders
      text instead of failing.
- [x] An **uncompared** cell says, in Dutch, that the comparison did not run, and it
      says it about the comparison and never about the content. The cap is size and not
      similarity, so a paragraph with five scattered edits and a score of 0.97 also
      reaches it. The word *herschreven* is refused for the same reason `CONTEXT.md`
      retires "changed": the tool cannot know it.
- [x] The class stays `copy`, the score stays with it, and **no count moves**. No class
      enters `compare/vocabulary.mjs`.
- [x] **A row clamps to four lines.** One clamp state for the row, both cells at one
      height, and one control in the status cell beside the class pill. The control is
      always rendered and it is quiet: a measuring pass over 288 rows to hide a small
      piece of furniture is the trade backwards.
- [x] The clamp shows the lines that hold **the first difference**, which the trim
      already computed. A one-sided row and an uncompared row show the first lines.
- [x] A row's anchor id is keyed on the unit's **position in the whole document**, not
      on its index in the row list. Today `web/src/lib/view.mjs` writes `r${index}`
      over the filtered rows, so a hash link is already broken by a filter change, and
      79 changes which rows exist at all.
- [~] **A jump to a row opens it**, and it opens the collapsed run that holds it. A jump
      is a request to read that one row. The row grows downwards from the top of the
      screen, so it does not push its own target away.
- [x] **Nothing is added for the scroll offset.** Nothing above the table is sticky
      today, so the native jump and the `scroll-mt-4` on the row already put the first
      line at the top. The complaint is row height, and the clamp is the whole fix. Say
      in the answer that this holds only while nothing above the table is sticky:
      ticket 87 is what could break it.
- [x] **Tests in `compare/compare.test.mjs`**, beside the eleven that are there. Trim
      **equivalence**, that the trimmed diff equals the untrimmed diff — this is the one
      that lets the trim be trusted. The lossless rejoin test still passes. An identical
      prefix and suffix with a change between them. One side a strict prefix of the
      other. The cap just under and just over. A capped input where the table is never
      allocated, asserted by input size and never by a clock.
- [x] The measured LCP and TBT, before and after, on both pages, written into this
      ticket. The probe script goes in a new `web/probes/`, because `crawl/probes/`
      holds crawl measurements and this measures `web/`.
- [x] The measurement of n·m is **re-run after 67**, and the cap is adjusted once if the
      tail asks for it.
- [x] **`blokken` stays.** Ticket 66 handed that word to this ticket, which owns the
      content view. ADR 0002 calls a content unit "the block an editor edits", and 79's
      context marker names a count of blocks, so the Dutch matches the decision. This
      ticket looked and declined to overrule it, and 66's loose end is closed.

## Resolved 2026-08-10

**A page of long units is read by scanning again.** On `nl__privacy-beleid` the rows
were 450 to 550 pixels; they are **105 pixels at the median and 125 at the worst**,
measured in the browser over all 55 rows, so a 900-pixel screen carries eight rows
where it used to carry two. The word diff over the whole corpus fell **97.5%**.

`compare/worddiff.mjs` holds the trim, the cap and the clamp window; `web/probes/`
holds the two probes; `web/src/lib/view.mjs` holds the anchor key, the `equal` fact
and the jump rule. **533 tests green**, 823 pages built, and
`node compare/measure.mjs nl` reads 9,635 findings, 6,747 shown, median 37 — unmoved
to the finding. It could not move: `worddiff.mjs` is read by the browser and by the
test file and by nothing in `compare/`, so no id, no class and no count is reachable
from this ticket.

### The three savings, measured after the fold

`web/probes/probe-diff-cost.mjs`, over **816 reports and 22,571 two-sided rows**. The
first number is banked on its own, as the first criterion asks.

| | LCS cells | fall |
|---|---|---|
| before | 32,137,902 | |
| equal rows skipped, alone | 5,330,291 | **−83.4%** |
| + the trim and the cap | **789,114** | **−97.5%** |

**On `nl__privacy-beleid` the gate is met about 20,000 times over.** 287,971 cells
before — the ticket's own figure, so the corpus is the one it was written against —
**87,468 from the equal skip alone (−69.6%)**, and **5 cells** after the trim. The
gate asked for 70%.

**20,380 of 22,571 two-sided rows already agree**, 90% of them, against 71% before the
fold. The fold made the agreeing rows bigger and did not make them differ.

### The cap stays at 50,000, and it fires on nothing

The tail was re-measured, and it does not ask for a change.

| n · m for one row | median | p95 | p99 | max |
|---|---|---|---|---|
| untrimmed | 49 | 8,281 | 25,281 | 170,569 |
| **after the trim — what the cap reads** | 1 | 817 | 9,991 | **44,523** |
| tokens, one side | 7 | 91 | 159 | 413 |

The worst row in the whole log is **44,523 cells after the trim**, which is 89% of the
cap and under it. So **no row in the log is uncompared today**, which is what the
ticket said the cap was for: the tail, not the reader. A cap below 44,523 would be a
rendering limit that reaches into text an editor can read, and the number is left
alone.

### First paint: the targets are met unthrottled, and the diff was never the driver

`web/probes/probe-first-paint.mjs`, median of three runs after one thrown away, Chrome
151 headless at 1440 × 900. **No Playwright** — it speaks the DevTools protocol over
the `WebSocket` Node already has, so the repository gains no dependency and ticket 19's
decision stands.

| page | cpu | LCP before | LCP after | TBT before | TBT after |
|---|---|---|---|---|---|
| `nl/privacy-beleid` | 1× | 1,000 ms | **936 ms** | 31 ms | **17 ms** |
| `nl/privacy-beleid` | 4× | 2,800 ms | **1,280 ms** | 1,286 ms | 1,075 ms |
| `nl/fotogalerij/zonwering` | 1× | 2,792 ms | **1,816 ms** | 380 ms | **153 ms** |
| `nl/fotogalerij/zonwering` | 4× | 3,680 ms | 3,240 ms | 1,910 ms | 2,090 ms |

**Unthrottled, both pages are inside LCP 2.5 s and TBT 200 ms, and `fotogalerij` was
outside both before this ticket.** Under a 4× CPU throttle TBT is 1 to 2 seconds on
both pages, before and after, and the 4× rows move less than their own spread. That
number is **hydration and payload, not the diff**: `privacy-beleid` spent 288,000 LCS
cells in total, which is a few milliseconds of the 1,286. ADR 0009 already names the
payload as the other half of the first-paint bill; closing it is not this ticket's
work, and no ticket owns it yet.

These are **evidence and not a passing condition**, as the ticket says: no test in this
repository can re-check a browser number.

### Three things the work decided

- **Exact trim equivalence is not true, and the test is what found it.** The trimmed
  diff equals the untrimmed diff token for token while **no word repeats inside one
  side**. With a repeat there are two alignments of the same length and the suffix trim
  takes the later one: on `de` against `kap de zwart kap de kap de` both call one `de`
  shared and they disagree about which. Neither reading loses a word or invents one. So
  the guard is three properties over 1,000 generated pairs — identical spans without a
  repeat, **the same number of words called shared** with one, and the lossless rejoin
  of each side — and the reference implementation from before the trim lives in the test
  file so that there is something to be equal to. Written into ADR 0009 rather than
  left in a comment.
- **`equal` is `prod.norm === next.norm` and not `class === null`.** A row can carry
  `heading-level` or `tag-changed` and agree about every word, and that row is not worth
  a table either. It is a field on `ContentRow`, so the fact is in the tested rule and
  not in the component.
- **The clamp window is a pure function, `clampedSpans()`.** The height is four lines of
  stylesheet, but *which words the four lines start at* is judgement, and a rule with
  judgement in it has to be testable in Node. It runs on the whole span list and not on
  one side's, so both cells of a row start at the same words. It fires on **155 of 823
  built pages**; the rest have their first difference in the first lines already.

### Reviewed on 2026-08-10, and four things came back

Two axes, standards and spec. Nine findings, of which four were acted on.

- **The uncompared sentence contradicted the clamp.** It said *beide versies staan er
  volledig* inside a cell that is clamped to four lines until the row is opened, so the
  copy was false for every uncompared row in its default state. It now says what it
  knows and nothing else: *Dit blok is te groot voor de woordvergelijking. Er is niets
  vergeleken.*
- **The clamp control said `uitklappen`, which is the fold.** `CONTEXT.md` reserves
  "fold" to two meanings and refuses it to a clamp, and *inklappen* is what 79's run of
  equal rows will do. *Openen* was not free either — the finding state beside it is
  already *open*. The control names what the reader gets: **hele blok** and **vier
  regels**.
- **The cap number was written twice and the comment held the retired one.** The
  docstring still said "13 rows of 11,847" from the pre-fold corpus while the ADR said
  the cap fires on nothing. And the threshold itself was compared in two places, so
  `diffCost` and `wordDiff` could have come to two answers about one pair. One
  `overBudget()` now, and the docstring holds the measurement this ticket made.
- **The probe kept a second copy of `TOKENS`.** A measurement that counts tokens its own
  way is not a measurement of this module. `tokenCount()` is exported and the copy is
  gone. `web/probes/` is in `README.md` and `AGENTS.md` now, beside `crawl/probes/`.

Left alone, with reasons: `clampedSpans` stays in `compare/worddiff.mjs` because the
window it computes is the trim's own answer, and the arrow allows `web/` to read
`compare/`; the one-sided skip in `Diff.jsx` is not scope creep but the same saving on
the other half of the pairs, and it moves no pixel because those spans were discarded
already; and the trim-equivalence deviation is recorded rather than repaired, because
it cannot be repaired — see above.

### One criterion is half done, and 79 owns the other half

**A jump opens the row** — verified in the browser: the target row is open, its control
reads *vier regels*, every other row stays clamped, and the row's top is at **16 px**,
which is the `scroll-mt-4` and nothing else. **Nothing was added for a scroll offset**,
and that holds only while nothing above the table is sticky. **Ticket 87 is what could
break it.**

**"And it opens the collapsed run that holds it" is not built, because ticket 79 is not
built.** There is no collapsed run and no context marker yet. The map sequences 79
before 68 and the session took 68 as asked; the equal-row skip is in `prepareRows`, so
it covers whatever rows 79 renders and **opening a run cannot bring the cells back**.
What 79 must add is one line: a run that holds `rowKeyFromHash(location.hash)` opens
with the row.

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
