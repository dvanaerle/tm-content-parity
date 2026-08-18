# 03 — The interface is stable and reachable

**What to build:** the interface stops moving under the person using it, and it starts telling
people who cannot see it what happened. An editor who is about to tick *Fixed* does not have the
row jump out from under the cursor when the override log answers. A screen-reader user learns
that their decision saved, that a re-check failed, and that the log is read-only. A keyboard user
can see where they are. Three small things that are simply wrong are corrected on the way past.

This is the **correctness** part of the polish pass. Unlike the rest of it, none of this is
taste: each item is a defect that can be demonstrated.

**Blocked by:** 02 — turning badges into text changes the height of a row, so height must be
reserved against the final content rather than the current content.

**Status:** ready-for-agent

**Parent:** ../PRD.md

- [ ] A row does **not change height** when the override log resolves. Space for the per-row
  override control is reserved, so the control appears into space that was already there.
- [ ] A browser test proves it: render with the log pending, measure the row, resolve the log,
  measure again, assert the height is unchanged. This test **fails today** — the shift is 273
  pixels on `nl/carport`, measured and documented in the log's own source.
- [ ] The existing scroll-delay mitigation stays. It answers a different question — *when* to
  scroll — and it never prevented the shift.
- [ ] One **live region** exists and announces: a saved decision, a bulk write's result, a failed
  re-check, and read-only state.
- [ ] Every interactive element has a **visible keyboard focus state**. A browser outline may be
  replaced but never deleted.
- [ ] Every **icon-only control** has an accessible name — the `×` says it clears the selection,
  the `⋯` says what it opens. A guard refuses an icon-only control with no name.
- [ ] Small controls — `×`, `⋯`, chevrons, checkboxes, tabs — have comfortable hit areas. The
  glyph stays visually small; the target does not.
- [ ] A one-page repeat reads **`on 1 page`**. It reads `on 1 pages` today.
- [ ] A page note is **visible while it is being edited**, not only inside the input. The page
  currently either shows the note or lets you change it, never both.
- [ ] The docstring claiming a module holds "the Dutch label an editor reads" is corrected. It
  holds no label and nothing Dutch, and has not since ADR 0014.
- [ ] `npm test` passes.

## Traps

- **Reserve the height, do not animate the shift.** A transition makes the movement prettier and
  leaves it a movement. The control's slot exists before the log answers or the defect is still
  there.
- **Do not reserve space for the banners.** They shift once, above the fold, before an editor has
  started working. Paying for those with reserved blank space costs more than it buys, and that
  is a decision rather than an omission.
- **One live region, not one per surface.** Several regions announcing at once is worse than
  none: a screen reader interleaves them and the editor hears fragments.
- **The live region announces outcomes, not progress.** *Saving…* is already visible on the
  button; announcing it as well is noise, and the thing a person needs to hear is whether it
  worked.
- **`on 1 page` is not a copy question.** It is an unconditional plural in a template. Fix the
  template, and check the other counted nouns in the same file for the same bug.
