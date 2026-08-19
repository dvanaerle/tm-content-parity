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

**Status:** resolved — 2026-08-19, branch `ticket-104-search-page-scope`.

Seven things landed differently from the way this ticket wrote them, and they are here
rather than left for a reader to find:

- **The height is reserved by the control itself, not by a reserved blank height.** The
  ticket says *reserve the height*, and a `min-h-*` on the slot was the obvious way. It
  cannot be tested: nothing mounts Tailwind's stylesheet in the browser project — ticket 02
  recorded the same limit about its container query — so a reserved height written as a
  utility would measure the same with the defect present and this test would pass over it.
  What holds the space instead is the control, drawn in full while the log reads and taking
  no press until it answers, so the row is the same height because it holds the same
  elements. The test measures real pixels and went red at 38→41 and 84→105 before the fix.
- **The reservation is scoped to *reading*, and never to `!canWrite`.** `canWrite` is false
  for four reasons and only one of them is *not yet*. Reserving on the other three would
  leave a permanently dead *Dismiss…* on every row of a page whose log is unreachable,
  which is weight ADR 0019 refuses. `logState()` is asked, so this cannot come to disagree
  with the banner that says which failure it is.
- **A row whose finding turns out to be *decided* still changes height, and that is not
  fixed.** Before the log answers every finding derives as `open`; after it, a dismissed one
  draws an attribution with a reason under it. That is the row's *content* changing, not
  chrome appearing, and no reserved space can hold an arbitrary note. The 273 pixels were
  the control, and the control is what this closes.
- **The live region is a DOM node and not a component.** A page here is several Astro
  islands, each its own React root, so `<Announcer/>` would give a page as many regions as
  it has islands with something to say — which is precisely the trap. `announce.mjs` makes
  one node on `document.body`, and there is one per document whichever island speaks.
- **A decision's wording lives in `announce.mjs`; the four one-off sentences do not.**
  `savedMessage()` and `pressMessage()` are there because six controls write a decision and
  six controls is six chances to word one outcome differently. A failed write, a re-check
  and a log gone read-only are each one condition owned by one surface, and each says its
  own sentence where that condition is known — the split `log-read.mjs` already draws when
  it says the state is read once and *what each reader then says is still its own*. The two
  message builders are pure and tested in the node project.
- **Eight sentences are announced where the ticket names four.** The four extra are each
  the named one's complement, and leaving them out would have been the worse bug: a region
  that says *saved* must say *not saved*; one that says a re-check failed must say when one
  ran, because a successful re-check silently replaces the whole page; one that says
  read-only must say *no connection*, which is just as unwritable and which `log-read.mjs`
  insists is a different thing; and a bulk press refused for want of a name is a bulk
  write's result. All eight are outcomes, so the trap holds.
- **The `⋯` in the hit-area line has no referent.** This interface draws no `⋯` control —
  shadcn's `BreadcrumbEllipsis` ships one and nothing renders it. The four that do exist
  were widened: the `↗`, the scope chip's `×`, the *Closed* disclosure and the run marker,
  each of which was a 16-pixel line box. Tabs and checkboxes needed nothing — the ledger's
  triggers are already 38 pixels tall and `ui/checkbox.jsx` has grown its own target with
  `after:-inset-*` since it came in.
- **A second guard rode along, for the focus rule.** *An outline may be replaced but never
  deleted* turned out to be as greppable as the name rule, and three primitives were
  failing it — the tabs panel, which is focusable and had nothing, and the dialog and
  popover popups, which are unused today and would have shipped the same hole. The guard
  requires the replacement on the **same line** as the deletion.
- **`BulkControl.jsx`'s `${covers} pages` was left alone.** It is the same unconditional
  plural, and it is drawn only above a handful of pages, so it cannot say *1 pages*. The
  fix went where the bug is reachable: `Search.jsx`, in both templates, through one
  `onPages()` — two inline conditionals over the same number would have been one of them
  fixed and one forgotten.

**Parent:** ../PRD.md

- [x] A row does **not change height** when the override log resolves. Space for the per-row
  override control is reserved, so the control appears into space that was already there.
- [x] A browser test proves it: render with the log pending, measure the row, resolve the log,
  measure again, assert the height is unchanged. This test **fails today** — the shift is 273
  pixels on `nl/carport`, measured and documented in the log's own source.
- [x] The existing scroll-delay mitigation stays. It answers a different question — *when* to
  scroll — and it never prevented the shift.
- [x] One **live region** exists and announces: a saved decision, a bulk write's result, a failed
  re-check, and read-only state.
- [x] Every interactive element has a **visible keyboard focus state**. A browser outline may be
  replaced but never deleted.
- [x] Every **icon-only control** has an accessible name — the `×` says it clears the selection,
  the `⋯` says what it opens. A guard refuses an icon-only control with no name.
- [x] Small controls — `×`, `⋯`, chevrons, checkboxes, tabs — have comfortable hit areas. The
  glyph stays visually small; the target does not.
- [x] A one-page repeat reads **`on 1 page`**. It reads `on 1 pages` today.
- [x] A page note is **visible while it is being edited**, not only inside the input. The page
  currently either shows the note or lets you change it, never both.
- [x] The docstring claiming a module holds "the Dutch label an editor reads" is corrected. It
  holds no label and nothing Dutch, and has not since ADR 0014.
- [x] `npm test` passes.

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
