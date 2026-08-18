# 121 — A run may hold a heading

Type: task
Status: resolved 2026-08-18 — built on branch `ticket-104-search-page-scope`. See the answer.
Blocked by: 120
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** a regrouping whose run includes a **heading** is reported as one row, and
the heading it swallowed is still in the heading jump-list and still anchors — so nobody
navigating the page loses a landmark because the other site inlined it.

~~The case: `be/laagste-prijs-garantie`, an accepted merge at `copy` 0.93. Production sends the
heading `"Hoe kan het dat Tuinmaximaal de laagsteprijsgarantie heeft?"` and the paragraph
after it; the new site sends **one paragraph** holding both. The row reads
`REGROUPED · h3 + p → p`.~~ **The extract says that block is a `p` and the row reads
`p + p → p`; the corpus holds the case the other way round only. See the answer.**

This is the only slice with a **navigation** consequence rather than a counting one, which is
why it is not folded into 116 or 120.

## Why it is not just another run

Two rules meet here and neither anticipated the other.

The leftover matcher refuses to pair a heading with a non-heading — `mayPair()` treats
heading-ness as a hard wall — and that wall exists to stop a heading matching a paragraph on
fuzzy similarity. **It must not apply to `regrouped`**, because a change of structure is the
phenomenon itself, and verbatim total coverage carries none of the risk the wall was built
for. A heading that became body text is a real structural change where every word survived.

And what is left of the retired *Outline* tab is a **heading jump-list beside the rows**,
built from production's headings. If a heading is absorbed into a `regrouped` row that
collapses by default, the naive outcome is that the heading **disappears from the jump-list** —
navigation that depends on the new site's markup, which is backwards for a view whose spine is
production order.

## What must stay true

- **The jump-list is built from production's heading units**, regardless of which row absorbed
  them. **Amended: production's heading units where the row has one, and the new site's where
  it has none** — production's units alone answer nothing on the shape the corpus has. See the
  answer.
- **Jumping to an absorbed heading opens the regrouped row**, as `Clamp` already promises: *a
  jump to a row opens that row.*
- **The row still carries an `anchorHeading`**, even when the run contains the heading that
  would otherwise anchor it.
- **`detail` names the heading**: `h3 + p → p`. The detail is doing real work in this case — it
  is the only place the log says a heading became body text — and it is part of the finding id.
- The class stays `regrouped` and stays `information`. This is not promoted to work: no word
  was lost. Whether a heading becoming body text should *itself* be work is a separate
  question and not this ticket's to answer.

## Acceptance criteria

- [x] `be/laagste-prijs-garantie` produces one `regrouped` row with detail ~~`h3 + p → p`~~
      **`p + p → p`**, and no `copy` for those units. **Production sends
      `"Hoe kan het dat…"` as a `p` and not as a heading**, so the page never held this
      ticket's case. It has produced the row since 116. See the answer.
- [x] ~~The heading `"Hoe kan het dat Tuinmaximaal de laagsteprijsgarantie heeft?"` is still in
      that page's heading jump-list.~~ **Void: it is not a heading.** The criterion is met on
      the shape the corpus does hold — a heading the **new site** promotes out of a production
      paragraph, 29 rows — and on a production heading in any member of a run, which no page
      holds today and the rule answers for anyway.
- [x] Selecting it in the jump-list opens the regrouped row and scrolls to it, even though the
      row is collapsed by default.
- [x] A regrouped row whose run crosses a heading boundary still reports an `anchorHeading`,
      and the answer says which heading it picks and why.
- [x] The heading-versus-non-heading wall still applies to the **greedy** pass. A reworded
      demoted heading must not start pairing with a paragraph as a side effect of this ticket.
- [x] Jump-list behaviour is tested at the `web/src/lib/view.test.mjs` seam;
      `landing.browser.test.mjs` is the prior art if a case genuinely needs a DOM. **No case
      needed one**: the DOM half is `ContentView.browser.test.mjs`'s *"opens the run a jump
      reaches after the first, which is what an outline click is"*, and an absorbed heading's
      entry hands that machinery the same row anchor every other entry does.

## Traps

- **Do not relax `mayPair()` itself.** The wall is correct for fuzzy pairing. `regrouped` runs
  in an earlier pass on an exact test, so it simply must not consult it — a different thing
  from removing it.
- A run may hold a heading on **either** side: production's heading folded into a new-site
  paragraph (the case above) or a production paragraph split so that the new site promotes its
  first sentence to a heading. The measurement found `p → h2 + 4×li` shapes, so both occur.
- `heading-level` is `information` after [86](86-heading-level-becomes-information.md), so a
  reader who wants heading shape reads `detail` in both classes. Keep the two details
  formatted consistently.

## Answer

Built 2026-08-18. **The comparison needed no change at all**, and the whole of the work is one
rule in the view: a regrouped row answers for **every heading in production's run, and for the
new site's where production holds none** — so a heading a regrouping absorbed keeps its entry,
and the entry opens the row.

**No number moves.** `compare/` gained tests and no code, so no finding id changes, no
dismissal detaches and no page review goes stale. The runbook's line that 116, 120 and 121
*"each move one"* count is true of the first two and not of this one: what this ticket moves is
navigation, and it is measured in jump-list entries.

### The trap the corpus set, and the criterion it corrected

The ticket's case is the wrong way round. On `be/laagste-prijs-garantie` production sends
`"Hoe kan het dat Tuinmaximaal de laagsteprijsgarantie heeft?"` as a **`p`** — it is styled as
a heading on the live page and it is not one in the markup — so the row has read
`REGROUPED · p + p → p` since 116 and there is no heading in the run. `nl` does not even
produce the row. Both facts are from `crawl/probes/probe-121-runs-with-headings.mjs`, and the
lesson is the one the probe's header states: an acceptance criterion written from a live page
has to be read against the extracts before it is ticked.

The case is real in the **mirror** the traps predicted, and it is the only form the corpus
holds. Of **189 regrouped rows, 29 hold a heading, every one of them on the new site and every
one of them the run's first member**: production sends one paragraph and the new site promotes
its first sentence to a heading. **No run on the production side holds a heading at all.**

| store | regrouped rows | rows holding a heading | jump-list entries gained |
|---|---|---|---|
| be | 29 | 6 | +6 |
| be_fr | 35 | 4 | +4 |
| de | 24 | 1 | +1 |
| fr | 34 | 4 | +4 |
| nl | 33 | 10 | +10 |
| uk | 34 | 4 | +4 |
| **all** | **189** | **29** | **+29** |

The shapes: `p → h3 + p` 20, `p → h2 + p` 9. Nothing else. The ticket's `p → h2 + 4×li` is not
in the corpus either — the four-member shapes are all `p → 4×p`.

**+29 and −0 is the reading of the whole ticket.** Nothing was losing an entry when this
started, because the merge direction has no headings to absorb; what was losing one is
**ticket 120**, which had absorbed 29 `text-added` rows that each carried a heading of their
own, and those rows were `information` — drawn, collapsed, and in the jump-list. So this
ticket restores 29 landmarks that ticket 120 took away in the commit before this one, and the
*"nobody navigating the page loses a landmark because the other site inlined it"* the ticket
was written for is exactly the promise, read on the other side.

### Which side the jump-list reads, and why it is not production's alone

*What must stay true* says **the jump-list is built from production's heading units**. That
sentence was written for a merge and it cannot answer the corpus on its own: a split row's
production side is a `p`, so production's units hold no heading and reading them alone would
leave 120's 29 absorbed landmarks unreachable.

The rule as built keeps the sentence and adds the fallback: **production's headings, and the
new site's only where production has none.** That is spec 32's own precedence — production is
the reference, the new site answers where production cannot — said over a run instead of over a
unit, so it is one rule for both directions rather than two to keep in step.

The first draft concatenated the two sides instead, and the code review found the shape that
breaks: **`h2 → h3 + p`**, production's heading split so that the new site keeps its first
sentence as a heading of its own. Both sides hold a heading there, it is **one** landmark, and
a concatenation printed it twice at one anchor — the doubling the one-heading-per-row rule
exists to stop. No page in the corpus holds the shape and nothing in `regrouped` forbids it, so
it is a test.

Nothing outside `regrouped` moved: an ordinary row still answers with its one unit,
production's or the new site's where the row exists there only. A one-to-one promotion is a
`heading-level` finding and not a landmark this list gained.

### The heading a regrouped row is filed under

`anchorHeadingFor()` is untouched, and its rule already answers the question: **the nearest
heading before the position, and a heading is never its own anchor.** The row is positioned at
the run's first member on a merge and at production's single block on a split, so:

- a merge that absorbed an `h3` is filed under the `h2` **above** that `h3` — the section the
  absorbed heading opened a subsection of, which is where a reader looking for the words finds
  them, and which is also the only heading the new site still draws there;
- a split whose new-site run promotes a heading is filed under the production heading above the
  paragraph, which is what the row was filed under as a `text-missing` before 120.

Both are pinned at the `diffRows()` seam. The corpus's 29 rows carry an anchor in every case.

### `mayPair()` is where it was

The trap is honoured by construction rather than by care: `regroupRuns()` and everything under
it read `norm` and never `kind`, so the exact pass has never consulted the wall, and 116's
*"accepts a heading as a member of the run"* already pinned that. What was missing was the
other half — that the wall in front of the **greedy** pass did not move — and that is now a
test: a demoted heading whose wording also changed stays a `text-missing` beside a
`text-added`, and does not begin pairing with a paragraph at 0.6.

`detail` needed no work either. `h3 + p → p` and `p → h3 + p` come out of the one function
116 and 120 share, so the two directions are formatted consistently by construction.

### Where it lives

`outlineFrom()` in `web/src/lib/view.mjs`, plus `headingsIn()` beside it — the one place that
decides which units a row is the landmark for. An entry's `key` is renamed **`anchor`** and it
gained an **`id`**: two headings one row absorbed share the row a jump aims at, so the link
target and the list's own key are two fields and each is named for its job. `Outline` in
`ContentView.jsx` keys on `id` and links to `anchor`, and needs no comment to say why.

The jump itself needed nothing. An entry hands `runKeyHolding()` a row anchor, which seeds the
open run during the render, and `useLandOn()` scrolls and focuses in the commit the row is
drawn in — the machinery ticket 79 built and 68 handed over, unchanged.

### Tests

Six at the `prepareRows()` and `outlineFrom()` seam in `web/src/lib/view.test.mjs`: a heading
in a **later** member of a production run keeping its entry (the case 116's test explicitly
disclaimed), a heading the new site promoted out of a split keeping its entry, `h2 → h3 + p`
naming production's heading once, two headings on one row being named apart, and the entry
opening the collapsed row it lands in. The existing
`outlineFrom` case is an **edited assertion**, which is the clearest record that the entry
shape moved on purpose. Four at the `diffRows()` seam in `compare/compare.test.mjs`: the merge
direction with a heading in the run, its `anchorHeading`, the split direction with a promoted
heading, and the greedy wall. `pairLeftovers()`, `mayPair()` and `similarity()` are still
untested directly.
