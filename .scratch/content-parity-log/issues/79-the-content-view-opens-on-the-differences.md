# 79 — The content view opens on the differences

Type: task
Status: ready-for-agent
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

- [ ] The content view opens with the differing rows visible and every run of equal
      rows collapsed into one marker naming its block count.
- [ ] **`equal` is narrowed for the marker: a row that carries a class is not equal.**
      68 set the operational rule as `prod.norm === next.norm` and said a row "can carry
      `heading-level` or `tag-changed` and agree about every word" and still be equal.
      That is right for a clamp, which compacts a row with nothing to read, and wrong
      for a marker, which **removes** it — the criterion above says the differing rows
      are visible, and a `heading-level` finding is a difference. Collapse less, not
      more. Found by the grilling of [48](48-open-and-done-board.md) on 2026-08-13,
      which widens this predicate again — to "no open work" — once 80 has defined
      Closed. Narrowing here is what makes that widening a single deliberate step.
- [ ] A marker expands and collapses, and an expanded run shows the same rows the view
      shows today, unchanged.
- [ ] The row tint is absent while the markers are collapsed, and the class pill is on
      every differing row. Expanding a run must not bring a meaningless tint back.
- [ ] Document order is untouched. No row moves, and the heading outline still jumps to
      the same places.
- [ ] `Alleen verschillen` stops being a filter and becomes the expand-all control, or
      it goes. Whichever is chosen, no control remains that narrows the view and could
      be mistaken for one that moves a count.
- [ ] **This is not a view mode.** Collapsing is one order with a fold in it, and the
      answer states that distinction plainly. [37](.out-of-scope/37-leesweergave.md)
      held the mode question and was **parked on 2026-08-11**, so there is no longer a
      ticket to pre-empt — which makes stating the distinction more important, not
      less: nothing else defines what a mode may do to document order.
- [ ] No count moves. `web/src/lib/view.mjs` still decides what is on screen, and the
      test that pins "a filter never moves a count" still passes unchanged.
- [ ] The dashboard's `pagina's gelijk` chip goes. It counts a thing nobody works on.
      The equal **rows** stay, behind the markers.
- [ ] Checked on `nl__fotogalerij/zonwering`, the worst page at 399 shown findings, and
      on a page with two findings, where collapsing must not look broken.
- [ ] **A jump opens the collapsed run that holds the row**, and the row inside it.
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
