# 11 — The high-priority pill is a fourth amber

Type: task
Status: needs-info
Parent: ../PRD.md
Found in: the spec review of ticket 02, which took the amber out of the filter strip and left
this one standing.

**What is wrong:** ADR 0019 says **amber means something is wrong**, and names the three
things in this interface that are: **Needs attention**, a failed **re-check**, and
**read-only**. `PRIORITY_TONE` in `web/src/components/Chips.jsx` gives `high` the `caution`
tone, which is amber. A priority is a value an editor chose about a page, not a state the
tool is reporting as wrong — which is the same argument that took the amber off the filter
strip in ticket 02.

Ticket 02 left it alone deliberately rather than guessing, because **every way out costs
something**, and which cost to pay is not a decision a polish pass should take on its own.

## Why it was not simply fixed

The three priorities need three tones a reader can tell apart. Of the eight, `lost` and
`added` are refused outright — a human's judgement about a page must never wear a diff hue,
which is `PRIORITY_TONE`'s own recorded reason — and brand colour is chrome only. That
leaves `warning` (the loud amber, worse), `caution` (the amber in question), `closed` and
`info` (the same blue, and `medium` already has it), `neutral` (grey, and `low` already has
it), and `total`.

So the candidates are:

- **Take `total` for `high`.** It reads as a loud dark grey and it is distinguishable. But
  `total` means *a total*, and spending it on a priority puts a second meaning on a word the
  palette defines as having one.
- **Drop to two rungs**, `high` and everything else. Cheapest in tones, and it throws away a
  distinction ticket 83 deliberately made.
- **Amend ADR 0019 to name a fourth amber.** Honest, and it is the sentence the ADR spends
  its own credibility on — *amber is now scarce on purpose*.
- **Add a ninth tone.** Refused: the palette guard holds the list at eight, and ticket 02's
  traps name this explicitly.

## What to decide

Which of the four. The first and third are the real candidates; a reader who knows what the
three priorities are *for* should pick, because the question is whether *an editor said look
at this first* is close enough to *something is wrong* to share a colour.

- [ ] The decision, recorded in ADR 0019 — either as the fourth amber it now admits, or as
  the reason `high` stopped being one.
- [ ] `PRIORITY_TONE` follows, and `palette.test.mjs` stays green with no ninth tone.
