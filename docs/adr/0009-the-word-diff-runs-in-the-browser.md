# The word diff runs in the browser, with a trim and a cap

ADR 0006 decided that the word diff is a cell renderer inside the content view. This
record says where that renderer runs: in the browser, on demand, per cell — and not at
compare time with the spans written into the report.

`compare/worddiff.mjs` builds a full LCS table over the tokens of both sides. It is a
pure function that imports nothing, and `web/` imports it directly. That import runs
**with** the arrow, from `compare/` to `web/`, so it breaks no rule in ADR 0001 and the
file stays in `compare/`.

## Why not at compare time

Precomputing the spans is the obvious answer, and it is the wrong one here. A full
report is already about 11 MB across the NL store, and the two text extracts are the
largest thing in it. Spans would add a third copy of every string, split into objects.

The cost this decision is about is **first paint**, and the report payload is on that
same path: `web/` is a static Astro build that serialises the whole `PageReport` into
the HTML and rehydrates it on `client:load`. Moving the diff to compare time would take
work off the CPU and put bytes on the wire, which pays the bill in the same currency.

## What makes it affordable

Measured on 2026-08-10 over 448 reports, 11,847 two-sided rows, 14.8 million LCS cells:

- **78% of the cost is rows that already agree.** 8,461 rows are exact tier-1 matches
  and hold 11.5 million cells. They are also the longest rows, because they hold the
  untouched paragraphs. The content view diffed them because it passed no `equal` prop.
  Not diffing two identical strings is the largest saving available, and it is free.
- **Trimming the common prefix and suffix** makes the common case — one changed word in
  a long paragraph — cost almost nothing.
- **A cap of 50,000 cells** bounds the tail. It caught 13 rows of 11,847 on that corpus
  and no `copy` or `casing` row at all.

With those three, the diff is cheap enough to stay where the reader is.

## The cap is a rendering budget, not a judgement

Above the cap the cell is **uncompared**: both versions are rendered in full and neither
is coloured. The class stays `copy`, the score stays with it, and no count moves.

The cap must not become a class. `rule` is the class and the class is in the finding id,
so a new class would change every affected id and detach dismissals — a browser
performance limit reaching into identity. And the cap measures **size, not similarity**:
a long paragraph with a few scattered edits scores high and still reaches it. So the
cell says that the comparison did not run, and never that somebody rewrote the text,
for the reason `CONTEXT.md` retires the word "changed": the tool cannot know that.

## Considered options

- **Write the spans at compare time.** Rejected. It obeys the arrow perfectly and pays
  in report bytes, which are already the complaint and are on the first-paint path too.
- **Render no diff until the reader asks per cell.** Rejected. It makes the reader work
  for the thing the row exists to show, and after the three savings above there is no
  cost left to justify it.
- **A new class for the capped row.** Rejected. It changes finding ids to record a
  rendering limit.
- **Cap on the similarity score instead of on size.** Rejected. The score answers
  "was this rewritten", which is not the question. A high-scoring paragraph with
  scattered edits is the case that costs most, and a score cap lets it through.

## Consequences

- The cap number rests on a corpus measured **before** ticket 67 folds inline links, so
  it understates the sizes that will exist. The words the leaf rule discards are in no
  stored file, so the post-fold sizes cannot be measured until the crawl is re-run.
  Ticket 68 carries that re-measurement as its own criterion.
- `DiffSpan` gains a fourth type, `uncompared`. A consumer that does not know the type
  renders text rather than failing, and `spansFor` is unchanged.
- The trim must be provably a speed-up and nothing else, so the test that matters is
  equivalence: the trimmed diff equals the untrimmed diff.
