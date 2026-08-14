# 135 — The tone maps are gone

Type: task
Status: ready-for-agent
Blocked by: 132, 133, 134 — every surface that reads a map.
Parent: ../map.md

**What to build:** the old form is deleted and the decision is written down. This is the
**contract** half of the palette move: with no caller left anywhere, the eight tone maps go,
`palette.mjs` keeps the two things that are logic, and an ADR records what changed and what it
overrules.

`palette.mjs` is left holding `severityTone()` — a threshold with judgement in it, tested — the
`Tone` type, and `CHROME`, which was never part of the tone layer. The file stops being a colour
map and becomes what remains after the colours moved: the rule for reading a share as a tone.

**The ADR has to overrule two sentences, and it has to do it visibly.** This repo strikes text
rather than quietly rewriting it — ticket 80 struck its own consequence in ADR 0007 when the world
changed under it, and that is the pattern:

- **ADR 0007's amendment** says *every colour that carries meaning is still a token from
  `palette.mjs`, handed to the primitive through `className`*. Half of that survives — meaning
  still belongs to us and not to the library — and the mechanism does not.
- **`app.css`'s own comment** says *`palette.mjs` is where that mapping is written*. After this
  ticket the mapping is written in `app.css`, and two files must not disagree about where tone
  lives.

**And it has to answer the obvious objection**, which is that this partly undoes ticket 74. That
ticket's achievement was getting tool vocabulary *out* of the stylesheet so that the name is the
answer. The reply is that a tone expressed as a selector over a styleguide variable is a different
object from a second set of `--color-*` names: the styleguide names stay the only colour names, and
the tones are rules that reach them. If the ADR does not make that distinction, the next reader is
entitled to read this as a regression.

- [ ] The eight tone maps are deleted and no import of them remains.
- [ ] `palette.mjs` holds `severityTone()`, the `Tone` type and `CHROME`, and its docblock says what
      the file is now for.
- [ ] An ADR records the move: what it buys — the literals constraint stops existing, and a
      state-dependent tone becomes an ordinary selector — and what it costs.
- [ ] The ADR strikes ADR 0007's amendment sentence about `className` carrying meaning, in the
      house style, dated, with the ticket number.
- [ ] `app.css`'s sentence about where the mapping is written is struck the same way.
- [ ] The ADR answers ticket 74 directly: why a selector over a styleguide variable is not a second
      colour vocabulary.
- [ ] `palette.test.mjs` is the one guard, and it pins the vocabulary and the two rules with
      judgement in them — direction is never spent on status, and a cell tint is `lost` or `added`.
- [ ] Every screenshot baseline in the repo is unchanged from before 131. The whole sequence moves
      no pixel, and this is the ticket that can prove it end to end.
- [ ] The full suite passes and no count, bar, denominator or roll-up has moved.

## Traps

- **Do not delete `CHROME`.** Its values are not tone-keyed and it is not part of this move. The
  landed row's outline left it in 128; the header, the link colour and the store switcher's two
  states stay, and the brand colours are in that object and nowhere else.
- **Do not delete `severityTone()` because it looks like a lookup.** It is the threshold rule, its
  tests are the reason the bar is never red however bad a page is, and a share read as a direction
  is the failure those tests exist to catch.
- The ADR is not a summary of the four tickets. It records the decision and the two overrulings; the
  tickets record the work.
- If any surface still reads a map when this ticket starts, **stop and finish that migration
  first**. A partial contract leaves a component with no colour and a build that succeeds.
