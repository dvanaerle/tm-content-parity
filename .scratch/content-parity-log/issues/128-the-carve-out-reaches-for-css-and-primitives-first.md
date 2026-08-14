# 128 — The carve-out reaches for CSS and primitives first

Type: task
Status: ready-for-agent
Blocked by: 127 — the policy that says which CSS is allowed.
Parent: ../map.md

**What to build:** the presentation the interface draws by hand is drawn by the platform
instead — CSS where no primitive fits, a primitive where one does — and the rule that
decides which is written down, so the next component does not have to guess.

ADR 0007 already says what the library owns and what the palette owns, and it already
carves out the content-parity concepts as permanently custom: the diff, the page group, the
repeat, the history note, the bulk selection. What it has never said is **what to reach for
inside that carve-out**. That silence is what produced two disclosures that hand-write
`aria-expanded` beside a third that credits the primitive for writing it, and a count badge
copied byte-for-byte into two files while six other components import `Badge`.

The rule is: **primitive first, CSS second, JavaScript last.** It is one clause and it
belongs in ADR 0007, next to the carve-out it governs, because a reader who has just learned
that the diff stays custom is the reader who needs it.

**Six presentational behaviours move to CSS.** Each is a place where no primitive fits and
JavaScript is deciding something a selector can decide:

- The disclosure glyphs. Two components render `▾` or `▸` from a ternary; the state is
  already on the element as `aria-expanded`, so the glyph comes from it.
- The heading outline's indent, computed per row as a pixel `style`. Heading level is a
  closed set of six, so it is an attribute and six rules.
- The landed row's outline, handed down as a class string beside the `aria-current` that
  already says the same thing. The selector reads the attribute; the props shrink to the
  two things CSS cannot do — take focus and set `tabIndex`.
- The floating bar's `fixed` class string, duplicated verbatim in the bulk control and the
  annotate bar. One rule, two wearers.
- The parity sparkline's fill width, formatted into a percentage string in JavaScript. The
  share is a number and `calc()` is arithmetic; JavaScript hands over the number.
- The copy button's 1200 ms flash, held in a `setTimeout` while the animation it belongs to
  is described in CSS. The duration lives once, and the end of the animation is an event.

**The last one is not JavaScript being deleted, and the ticket should not claim it is.** The
state stays; what changes is that a number stops being written in two places that can
disagree. That is the same principle as the other five — the platform holds the fact — and
it is worth saying plainly rather than counting it as a `useState` removed.

**Three hand-rolled shapes become the primitives they already shadow**, per ADR 0007's
amendment, which names badge, divider and panel in the list of shapes shadcn owns:

- The count badge in the bulk bar and the annotate bar. This is not a palette carve-out:
  the hand-rolled span paints `bg-primary`, a shadcn variable, so the amendment's "className
  carries colour" clause has nothing to do with it.
- The vertical rule in both bars.
- The annotate bar's panel shape, which is a silent copy of the bulk bar's — the same
  border, corner and shadow, free to drift, with no comment saying it was copied.

**Two hand-rolled disclosures get a comment and not a refactor.** They cannot be
`Collapsible`: the trigger sits in a table cell and the content is a set of sibling table
rows, so a `CollapsibleContent` wrapper would break the table. That is almost certainly why
they were written by hand — but nothing says so, and this repo documents every choice of
this kind. The missing sentence *is* the defect.

- [ ] ADR 0007 carries a second amendment with two sentences: inside the custom carve-out,
      reach for Widely Available CSS before JavaScript; and a tone that depends on a state
      is a selector and not a token.
- [ ] The disclosure glyphs are drawn from `aria-expanded` and no component renders a
      chevron character from state.
- [ ] The outline's indent comes from the heading level as an attribute, not from a computed
      pixel value.
- [ ] The landed row's outline is a selector on the attribute that already marks it. The
      shared props keep only focus and `tabIndex`.
- [ ] The floating bar's shape is one rule that both bars wear, and neither file holds the
      class string.
- [ ] The sparkline receives the share as a number and CSS computes the width.
- [ ] The copy flash's duration is stated once, in CSS, and the reset is driven by the
      animation ending.
- [ ] The count badge, the vertical rule and the annotate bar's panel are primitives.
- [ ] Both table-bound disclosures carry a comment saying why `Collapsible` cannot wrap
      sibling rows, in the voice the rest of the file uses.
- [ ] `Chips.jsx`'s docblock no longer claims that no prop reaches the progress indicator.
      Ticket 80 made that false and struck it in the ADR; the code comment was never
      updated, and it is the stated justification for hand-rolling the sparkline. The
      surviving reason — a 24-pixel bar in a table cell is not a progress bar — stays.
- [ ] Every feature used is Widely Available per 127. Attribute selectors, custom
      properties, `calc()` and `animationend` are the whole toolkit, and none of them is new.
- [ ] Screens are pixel-identical apart from the primitive swaps, and the screenshot
      baselines that move are reviewed one surface at a time.

## Traps

- **`:has()` is not wanted here.** It is the most tempting Widely Available feature and the
  obvious use — tinting a row from what it contains — is the row tint `CONTEXT.md`
  deliberately removed: *in this state every visible row is work, so the row tint carries no
  signal and it goes*. Reaching for it means reinstating something the log argued its way
  out of.
- **Do not delete the unused primitives.** `Dialog`, `Popover` and `Tooltip` have no
  importer, and three of them are in ADR 0007's original seven. `Tooltip` is 129's whole
  subject.
- Do not turn the floating bars into a `Dialog` or a `Popover`. A modal would trap focus
  over the list the editor must keep reading, and the bar is anchorless and persistent. The
  bulk control's own comment explains why it floats; that reasoning stands.
- The sparkline stays hand-rolled. Its warrant is weaker than it was but it is still true,
  and the ADR says a later ticket wanting it as `Progress` is not arguing with the decision.
  This is not that ticket.
- Keep every comment that explains a constraint. The sticky outline works because an
  ancestor's `overflow` is `visible`, and the truncation works because a flex box was given
  a width. Both are recorded, both are load-bearing, and neither is obvious from the code.
