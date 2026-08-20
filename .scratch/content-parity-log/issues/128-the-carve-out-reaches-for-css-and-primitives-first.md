# 128 — The carve-out reaches for CSS and primitives first

Type: task
Status: resolved 2026-08-20 — **the rule is written down and the three shapes are
primitives**. ADR 0007 carries a second amendment (*primitive first, CSS second, JavaScript
last*, plus ADR 0023's clause) and a record of what it settled first time out. The count
mark is a `Badge`, the rule before each dismissal is a `Separator`, and the two bars share
one `Card` panel in `Floating.jsx` — which acts on ADR 0007's "second hand-rolled panel"
clause and leaves the suggestion list as the only exemption. `Ledger.jsx` and `Marker.jsx`
say why `Collapsible` cannot wrap sibling rows, and `Chips.jsx` no longer claims a prop that
ticket 80 added. No new CSS feature was used, and the six CSS conversions were never in
scope — they left for 143 on 2026-08-19.

Two things beyond the checkboxes: the **bulk** bar's panel moved too, because a silent copy
cannot be deduped from one side; and the rule-plus-cross pair went with it, so the
`Separator` rationale is written once rather than twice. 1351 tests pass. The badge sweep is
**stricter** than before, not widened: it now asserts the exact list of sites that wear a
badge without being one, where it used to skip a whole file.

Checked by eye at 1440×900 on the store dashboard, a page and the repeat list. One pixel
budget spent and it is the primitive's: `Card`'s corner is 5.6px where the hand-rolled one
was 4px, and its hairline is a `ring-1` outside the box where the old one was a border
inside. Nothing else moved — every text-bearing element in both bars sets its own size, so
`Card`'s inherited `text-sm` reaches nothing, and `Card`'s `overflow-hidden` is turned off
rather than inherited, because a clip that earns nothing over a focus ring is how the sticky
outline got caught the first time.
Blocked by: 127 — the policy that says which CSS is allowed.
Parent: ../map.md
Narrowed: 2026-08-19. The six CSS conversions left this ticket and are now
[143](.out-of-scope/143-six-presentational-behaviours-move-to-css.md), parked. What is left
here is the drift prevention: the ADR clause, the three primitive dedups, the two comments and
the stale docblock. That half is cheap and it is the durable one.

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

- [x] ADR 0007 carries a second amendment with two sentences: inside the custom carve-out,
      reach for Widely Available CSS before JavaScript; and a tone that depends on a state
      is a selector and not a token.
- [x] The count badge, the vertical rule and the annotate bar's panel are primitives.
- [x] Both table-bound disclosures carry a comment saying why `Collapsible` cannot wrap
      sibling rows, in the voice the rest of the file uses.
- [x] `Chips.jsx`'s docblock no longer claims that no prop reaches the progress indicator.
      Ticket 80 made that false and struck it in the ADR; the code comment was never
      updated, and it is the stated justification for hand-rolling the sparkline. The
      surviving reason — a 24-pixel bar in a table cell is not a progress bar — stays.
- [x] Every feature used is Widely Available per 127. Attribute selectors, custom
      properties, `calc()` and `animationend` are the whole toolkit, and none of them is new.
- [x] Screens are unchanged apart from the primitive swaps, checked by eye on the store
      dashboard, a page and the repeat list. **There are no screenshot baselines** — ADR 0019
      refuses a screenshot suite, and no matcher exists anywhere in the tree. The three
      source-text tests (`web/src/interface-reach.test.mjs`, `interface-weight.test.mjs`,
      `interface-words.test.mjs`) are what stands in for one, and they must still pass.

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
