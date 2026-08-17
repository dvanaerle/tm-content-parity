# 133 — Every surface wears its tone, and the maps are gone

Type: task
Status: ready-for-agent
Blocked by: 132 — the tones and shapes every surface here asks for.
Parent: ../map.md

> **Merged 2026-08-17.** This ticket absorbed **134 and 135**. The palette move is one
> expand-migrate-contract, and 133 and 134 were the same mechanical migration of the same
> mechanism split by surface, with 135 deleting the maps afterwards. **135 could never be
> verified on its own** — its own last trap says *if any surface still reads a map when this
> ticket starts, stop and finish that migration first*, which is a ticket admitting it is a
> phase. No count, bar, denominator or roll-up moves anywhere in the sequence, so there is no
> measurement gate between the three to batch across.
>
> **132 stays a separate ticket.** It defines the CSS tone contract and carries the design
> decision, and it is the one part of the move that is reviewable as a decision rather than as
> a transcription.
>
> The filename keeps 133's slug so every inbound link in `map.md`, in 132 and in 128 still
> resolves. The three parts are **A** (the dashboard), **B** (the ledger) and **C** (the
> contract); each is one commit, in that order, and C cannot start until A and B are both in.

**What to build:** every surface stops holding colour strings and asks for a tone and a shape,
then the eight JavaScript tone maps are deleted and an ADR records what changed.

The batches are separated **by surface rather than by module**, so a moved screenshot baseline
can be reviewed against one screen and the reviewer knows what they are looking at. That
reason survives the merge — it is why this is three commits and not one.

---

## A — The dashboard wears its tone

The dashboard's two views stop holding colour strings. The dashboard, the repeats queue, the
chips and the progress marks ask for a tone and a shape, and the stylesheet decides what that
prints.

**Two of the three transcriptions live here**, and this is where the move pays for itself. The
pressed tone on the view switch carries a hard-coded variant prefix because a palette token
cannot carry one. The class-group headers and the class pills assemble their tone the same way.
As selectors, both are rules over the state the control already publishes.

**The sparkline is the interesting one.** 128 already moved its geometry to `calc()` over a
number; this part moves its fill from a per-row class string to the tone the row's share
answers with. `severityTone()` stays in JavaScript — it is a threshold with judgement in it,
and `palette.test.mjs` pins it — but what it answers with becomes an attribute rather than a
lookup.

- [ ] The dashboard, the repeats queue, the chips and the progress marks emit a tone and a shape
      and hold no colour string.
- [ ] The pressed state of the view switch and the pills is a selector over the state the control
      already publishes, and no variant prefix is transcribed by hand.
- [ ] The parity sparkline takes its fill from the tone the share answers with.
- [ ] The amber pair keeps its inversion: in a bar fill the loud tone runs darker and the quiet
      one lighter, which is the opposite of every other shape and is the one place the ramp is
      read from the far end.
- [ ] A class pill's tone still comes from the class vocabulary, and a page's tone still comes
      from its share. The two must not converge on one rule — a class says what kind of
      difference, a share says how much of a page.
- [ ] `severityTone()` is untouched, and its tests with it.
- [ ] **At this commit** the JavaScript maps still exist and still have callers on the surfaces
      part B has not moved yet. A is not allowed to leave a surface with no colour.
- [ ] Screenshot baselines for the dashboard's two views are reviewed per view and unchanged in
      colour. A moved pixel is a bug in this part, not a new design.
- [ ] No count, bar, denominator or roll-up moves. Nothing here reaches the derivation.

## B — The ledger wears its tone

The page's ledger and the controls beside it stop holding colour strings. The ledger, the
override control, the annotate bar, the bulk control, the search result and the page island ask
for a tone and a shape.

This is the last **migrate** batch. It is the widest by file count and the most varied by shape:
the bucket strip and the tab badges wear pills, the banners wear the banner shape, the fix
checkbox wears the accent, and the history notes wear ink.

**The third transcription lives here.** The fix checkbox's tick map writes `data-checked:`
prefixes by hand because a palette token cannot carry a variant. It has three visual states and
two of them are ticked — a claim that stands, and a claim a later observation contradicted — and
as selectors over the state the control publishes, the third transcription goes the way of the
other two.

**The accent shape holds status tones only, and that rule has to survive the move.** A checkbox
reports work, and a work state never wears the diff hues: an editor who saw a tick in the diff's
red would read it as a claim about content rather than about their own decision.

- [ ] The ledger, the override control, the annotate bar, the bulk control, the search result and
      the page island emit a tone and a shape and hold no colour string.
- [ ] The fix checkbox's two ticked states are selectors over the state it publishes, and no
      variant prefix is transcribed by hand.
- [ ] The accent shape still holds status tones and no direction.
- [ ] The banner shape still gives its two ambers different pixels. A banner reporting a failure
      and a banner reporting a condition must not print the same shape, or a reader cannot tell
      which one they have.
- [ ] The bucket strip's three buckets keep their tones, and **Needs attention** keeps meaning
      *contradicted and nothing else* — 131 freed the word `attention` for exactly this reason, so
      the bucket and the tone must not be wired to each other by name.
- [ ] The history note's ink and the override state badges move with the rest.
- [ ] No JavaScript map has a caller left after this commit. This is the gate on part C.
- [ ] Screenshot baselines for the page's four tabs are reviewed per tab and unchanged in colour.
- [ ] No count, bar, denominator or roll-up moves.

## C — The tone maps are gone

The old form is deleted and the decision is written down. This is the **contract** part of the
palette move: with no caller left anywhere, the eight tone maps go, `palette.mjs` keeps the two
things that are logic, and an ADR records what changed and what it overrules.

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
  part the mapping is written in `app.css`, and two files must not disagree about where tone
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
      no pixel, and this is the part that can prove it end to end.
- [ ] The full suite passes and no count, bar, denominator or roll-up has moved.

---

## Traps

**On the dashboard (A)**

- **The filter's amber strip is not a tone-bearing surface to redesign.** It says a filter is on,
  for as long as it is on, and its colour is chrome. Do not fold it into the tone product because
  it happens to be amber.
- **A group with no repeats still says so.** *Nothing wrong here* and *this class does not exist*
  are two different answers, and the empty group is the first one. A rule that hides a group with
  no children deletes that distinction.
- The class-group order is the vocabulary's and never the counts'. Nothing in this part touches
  ordering, and a selector that reads a count is a selector that will be asked to sort by one.
- The tri-state select-all answers a mixed press by clearing. Its ticked colours come from the
  accent shape, which holds two tones and no direction — that constraint moves with it.
- Do not delete a map in A or B. **C contracts**, and it is last so that the deletion happens once,
  with no caller left anywhere.

**On the ledger (B)**

- **The bucket and the tone are two vocabularies that now share a word.** `closed` is a tone and
  **Closed** is a bucket; `caution` is a tone and **Needs attention** is a bucket. They agree
  today and they are free to disagree tomorrow, so the mapping is written once where the bucket is
  drawn, and never inferred from the name matching.
- **Do not merge the log banner's states while moving them.** Whose fault a failure is belongs at
  the top of the screen, and one reading of the log already answers for the three readers. A tone
  change is not the moment to re-collapse them.
- The re-check button is hidden when the local service is absent, and the hosted build senses
  this. A tone on a control that is not there is not a bug to chase.
- The uncompared row is not coloured, deliberately: the log is saying the comparison did not run,
  not that somebody rewrote the text. A shape that gives it a tone makes the log assert something
  it refuses to assert.

**On the contract (C)**

- **Do not delete `CHROME`.** Its values are not tone-keyed and it is not part of this move. The
  landed row's outline left it in 128; the header, the link colour and the store switcher's two
  states stay, and the brand colours are in that object and nowhere else.
- **Do not delete `severityTone()` because it looks like a lookup.** It is the threshold rule, its
  tests are the reason the bar is never red however bad a page is, and a share read as a direction
  is the failure those tests exist to catch.
- The ADR is not a summary of the sequence. It records the decision and the two overrulings; 132
  and this ticket record the work.
- If any surface still reads a map when C starts, **stop and finish B first**. A partial contract
  leaves a component with no colour and a build that succeeds.

**On the merge itself**

- **Three commits, and the branch is reviewable at each.** The reason this is one ticket is that no
  number moves, not that the work is one lump. The per-surface split exists so a screenshot
  baseline is reviewed against one screen; a single commit moving every baseline at once throws
  that away and is the failure mode the merge is meant to avoid.
- **C is a gate, not a step.** B's *no caller left* criterion is what lets C start. If A and B are
  landed and any map still has a caller, the sequence is not ready to contract, whatever the
  checkboxes say.
