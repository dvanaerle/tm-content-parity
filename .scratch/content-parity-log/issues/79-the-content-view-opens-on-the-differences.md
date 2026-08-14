# 79 — The content view opens on the differences

Type: task
Status: resolved 2026-08-14 — the content view opens on the differences, and the runs of
agreeing blocks are context markers. See the answer at the bottom.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor opens a page and sees the work. Runs of agreeing blocks
collapse into one row that says how many they are, and that row expands. Nobody scrolls
past 47 identical paragraphs to reach the next difference, and nobody loses the ability
to see where a missing line belonged.

Every rule is in
[ADR 0006](../../../docs/adr/0006-the-content-view-is-the-spine.md). **Read it first.**

## The decision this ticket carries

The **context marker**: one row standing for a run of equal rows, saying how many
blocks it holds, expanding on click. The content view stays the whole page in document
order. The marker collapses; it does not reorder and it does not filter.

**The row tint goes in this state.** Ticket 12 retired the *Diff* tab because it showed
the differing rows only, "so once every row was tinted the tint said nothing". That
failure is specific and avoidable: when every visible row is a difference, the tint
carries no signal, so the class pill carries the class instead. A version of this that
keeps the tint repeats the mistake exactly.

The marker is what makes this different from the retired tab. The tab deleted position.
The marker keeps it, states the distance between two findings, and gives the blocks
back on one click.

## Why the default changes

A comparable page holds a median of 37 shown findings, 151 at the 90th percentile, and
399 on the worst page. At that density the context is paid for at nearly every row and
read at few of them.

And it is context for a reason: 82% of shown findings are one-sided — `text-missing`
49.3%, `missing-link` 21.0%, `image-missing` 12.1% — and for those the question is not
what changed but whether the text is **gone or moved**. Only the neighbouring blocks
answer it. That is why the rows collapse instead of leaving.

## Acceptance criteria

- [x] The content view opens with the differing rows visible and every run of equal
      rows collapsed into one marker naming its block count.
- [x] **`equal` is narrowed for the marker: a row that carries a class is not equal.**
      68 set the operational rule as `prod.norm === next.norm` and said a row "can carry
      `heading-level` or `tag-changed` and agree about every word" and still be equal.
      That is right for a clamp, which compacts a row with nothing to read, and wrong
      for a marker, which **removes** it — the criterion above says the differing rows
      are visible, and a `heading-level` finding is a difference. Collapse less, not
      more. Found by the grilling of [48](48-open-and-done-board.md) on 2026-08-13,
      which widens this predicate again — to "no open work" — once 80 has defined
      Closed. Narrowing here is what makes that widening a single deliberate step.
- [x] A marker expands and collapses, and an expanded run shows the same rows the view
      shows today, unchanged.
- [x] The row tint is absent while the markers are collapsed, and the class pill is on
      every differing row. Expanding a run must not bring a meaningless tint back.
- [x] Document order is untouched. No row moves, and the heading outline still jumps to
      the same places.
- [x] `Alleen verschillen` stops being a filter and becomes the expand-all control, or
      it goes. Whichever is chosen, no control remains that narrows the view and could
      be mistaken for one that moves a count.
- [x] **This is not a view mode.** Collapsing is one order with a fold in it, and the
      answer states that distinction plainly. [37](.out-of-scope/37-leesweergave.md)
      held the mode question and was **parked on 2026-08-11**, so there is no longer a
      ticket to pre-empt — which makes stating the distinction more important, not
      less: nothing else defines what a mode may do to document order.
- [x] No count moves. `web/src/lib/view.mjs` still decides what is on screen, and the
      test that pins "a filter never moves a count" still passes unchanged.
- [x] The dashboard's `pagina's gelijk` chip goes. It counts a thing nobody works on.
      The equal **rows** stay, behind the markers.
- [x] Checked on `nl__fotogalerij/zonwering`, the worst page at 399 shown findings, and
      on a page with two findings, where collapsing must not look broken.
- [x] **A jump opens the collapsed run that holds the row**, and the row inside it.
      Handed over by [68](68-the-content-view-clamps-a-tall-row.md), which built the
      other half on 2026-08-10: a jump already opens the clamped row it lands on, and
      `rowKeyFromHash()` in `web/src/lib/view.mjs` is the rule that names it. A run that
      holds that key must open with it, or a hash link lands on a marker. 68 ran before
      79 rather than after it, against the order in the map, so this is the one criterion
      of 68 that could not be finished.

## Traps

- **The word diff is a cell renderer, not the interface.** `copy` is 3.4% of shown
  findings. Do not let this ticket promote the diff while reshaping the view around it.
- **`restructured` is hidden today** and it is the class that separates moved from gone.
  This ticket does not move it — [75](75-class-visibility-replaces-shown.md) triages
  it — but the answer should say whether the collapsed view made the case for it
  stronger.
- A run of equal rows can be the whole page. A page with no differences must not render
  as one marker and nothing else with no explanation.
- Markdown stays an export and is not touched.

## Resolved 2026-08-14

**The content view opens on the work.** Over the nl store's 179 pages it draws **5,290
rows where it drew 6,977, a fall of 24.2%**, with **2,560 agreeing blocks behind 873
markers** and the largest run 107 blocks. Nothing left the page: every one of those
blocks is one press away, in its own position, and the heading outline still names all of
them. **770 tests green**, 823 pages built.

`web/src/lib/view.mjs` holds the three new rules — `collapses()`, `collapseRuns()` and
`rowKeyFromHash()` — and `web/src/components/ContentView.jsx` is the pixels, which is the
split this module already had. `web/src/components/ContentView.browser.test.mjs` is new
and it is the first test to mount this component at all.

### The predicate is narrower than `equal`, and that is the decision

`collapses(row)` is `row.equal && row.class === null`. **`ContentRow.equal` is untouched**
— it is 68's `prod.norm === next.norm`, the word diff still skips those rows, and none of
the 97.5% fall 68 measured is given back. The marker reads its own rule beside it.

The grilling of [48](48-open-and-done-board.md) is what found this, and it is right: 68
was describing a **clamp**, which compacts a row with nothing to read, and a marker
**removes** the row. A `tag-changed` row whose words agree is an open finding, and this
view is supposed to open with the open findings on screen. So the two predicates are two
functions, one narrow and one wide, and neither has to lie for the other.

**48 widens this in one step**, to `equal || closed || !decidable`, once it lands. Both
of the terms it adds are already on the row — `ContentRow.decidable` is 86's, and 80 has
defined Closed — so what it changes is one expression in one place.

### `Differences only` is gone, and *Show unchanged blocks* is what replaced it

It went rather than being reworded. It **narrowed**: it dropped the agreeing rows
outright, which is the one thing ADR 0006 says this view must not do, and it sat beside a
class filter counting rows where a reader could take the pair for something that moves a
count. `ContentFilter` is now a class list and nothing else, and `onlyDifferencesState()`
went with it.

What stands in its place opens **every marker at once** — the same want said as a fold
instead of a filter — and it is drawn only on a page that has a marker, because a control
over nothing teaches a reader that it does nothing. `isNarrowed()` is now the class pills
alone, so the amber *Filtered* strip says what it always said and about one control.

### The jump: `rowKeyFromHash()` comes back, three days after it left

68 withdrew the clamp on 2026-08-14 and took `rowKeyFromHash()` with it, "whose only
caller was the effect that opened a jumped-to row". This ticket is the other caller it was
written for, so the rule is back in `view.mjs` and the run holding the key opens in the
same render — before the browser goes looking for the row. Two paths reach it: a finding
link through `landingRow()` (ticket 109), and a bare `#p12` from the outline or from a
copied address, which needs a `hashchange` listener because the browser changes the hash
without a navigation.

This is what keeps **the outline honest**. It is still derived from the rows and not from
the drawn items, which is exactly the difference between a filter and a fold: a filtered
row is not on the page, a collapsed one is one press away, so a heading inside a run keeps
its entry and the jump opens the run it lands in.

### The row tint was already absent, and now something says so

Nothing at row level has ever read the class here — the tint ticket 12 complained about
went with the *Diff* tab. The browser test pins it the way that survives a new tone being
added: **two rows of two different classes carry the same className**. The one-sided cell
fill in `Diff.jsx` stays, and it is not this tint: it reads `direction` and says *which
side has nothing*, which still carries signal when every row is a difference.

### What the two named pages look like

- **`nl/fotogalerij/zonwering`, 446 findings, 185 rows: no marker at all.** Almost every
  row is one-sided, so almost every row carries a class, so nothing collapses and the
  page is what it was. The expand-all control is not drawn. **The marker does not help
  the worst page** — the honest reading is that it helps the middle of the distribution,
  and 64 of the store's 179 pages have no marker either. `nl/privacy-beleid`, 37 findings,
  is the shape it does help: 63 rows to 45 drawn, 29 blocks behind 11 markers.
- **A page with two findings** — `nl/herroeping/ontvangen/ruilen`, 4 rows — draws one
  marker over 3 blocks and one row. It does not look broken, and a page where **nothing**
  differs says so in a sentence above its marker rather than presenting a bare fold.

### The traps

- **The word diff was not promoted.** `Diff.jsx` and `worddiff.mjs` are untouched.
- **The collapsed view makes the case for `restructured` stronger, not weaker.** The
  argument for keeping the equal rows is that only the neighbouring blocks tell *moved*
  from *gone* on the class that is half the corpus. Those blocks are now behind a press,
  so on the pages the marker helps, the question costs a click it did not cost before —
  and on `fotogalerij/zonwering` there is no context to expand at all. A class that says
  *this text moved* answers without either. [75](75-class-visibility-replaces-shown.md)
  still owns it; this is the evidence, not the decision.
- **Markdown is untouched**, still two download links.

### What else moved

`pages equal` left the dashboard strip, and `totals.clean` with it — the only number
there that could rise while the work went nowhere. `CONTEXT.md`'s **Context marker**
entry now says which of its three collapse rules is built and which one 48 carries, and
says plainly that collapsing is not a view mode: one order with a fold in it, nothing
reordered and nothing filtered away. Ticket 37 was parked, so nothing else defines what a
mode may do to document order, and the marker must not be read as the first answer.
