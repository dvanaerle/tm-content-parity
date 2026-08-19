# 143 — Six presentational behaviours move to CSS

Type: task
Status: wontfix — **parked 2026-08-19** by the audit of every open `ready-for-agent` ticket.
Split out of ticket [128](../128-the-carve-out-reaches-for-css-and-primitives-first.md), whose
drift-prevention half — the ADR clause, the three primitive dedups and the two comments — is
still open and is the durable one. Not disproven: refused on yield per hour, and as
retroactive work. A sparkline width and a 1200 ms flash duration are not costing us anything
today; 128 itself admits the copy-flash move is not JavaScript being deleted at all. This is
also the only work on the audit's list with no external reader — every other ticket serves an
editor, a screen-reader user, or us in CI.
**Re-open trigger: none, as retroactive work.** The clause going into ADR 0007 — *primitive
first, CSS second, JavaScript last; a tone that depends on a state is a selector, not a token*
— makes the next component do it the new way, which is the whole point. Convert one of these
six when a component next needs that behaviour anyway, not because it is on this list.
Blocked by: 127 — the policy that says which CSS is allowed. 128 — the ADR clause lands first,
because it is the rule these six would be obeying.
Parent: ../../map.md

**What to build:** six places where JavaScript decides something a selector can decide.

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

## Acceptance criteria

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
- [ ] Every feature used is Widely Available per 127. Attribute selectors, custom properties,
      `calc()` and `animationend` are the whole toolkit, and none of them is new.
- [ ] Screens are unchanged, checked by eye. There are no screenshot baselines — ADR 0019
      refuses a screenshot suite and no matcher exists in the tree.

## Traps

- **`:has()` is not wanted here.** It is the most tempting Widely Available feature and the
  obvious use — tinting a row from what it contains — is the row tint `CONTEXT.md` deliberately
  removed: *in this state every visible row is work, so the row tint carries no signal and it
  goes*. Reaching for it means reinstating something the log argued its way out of.
- **Do not turn the floating bars into a `Dialog` or a `Popover`.** A modal would trap focus
  over the list the editor must keep reading, and the bar is anchorless and persistent.
- **The sparkline stays hand-rolled.** Only its width computation moves. Its warrant is weaker
  than it was but still true, and this is not the ticket that argues with it.
- **Keep every comment that explains a constraint.** The sticky outline works because an
  ancestor's `overflow` is `visible`; the truncation works because a flex box was given a
  width. Both are load-bearing and neither is obvious from the code.

## Where it came from

Ticket 128, and the audit of every open `ready-for-agent` ticket, 2026-08-19
(`.scratch/2026-08-19-ready-for-agent-audit.md`), whose verdict on 128 was *split*: keep the
ADR amendment and the three primitive dedups plus the two comments — that is the
drift-prevention, and it is cheap — and move the six CSS conversions out, with no re-open
trigger as retroactive work.
