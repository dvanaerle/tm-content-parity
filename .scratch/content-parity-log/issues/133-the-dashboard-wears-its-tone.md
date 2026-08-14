# 133 — The dashboard wears its tone

Type: task
Status: ready-for-agent
Blocked by: 132 — the tones and shapes this surface asks for.
Parent: ../map.md

**What to build:** the dashboard's two views stop holding colour strings. The dashboard, the
repeats queue, the chips and the progress marks ask for a tone and a shape, and the stylesheet
decides what that prints.

This is one **migrate** batch of the palette move. It is separated from the ledger's batch by
surface rather than by module, so a moved screenshot baseline can be reviewed against one screen
and the reviewer knows what they are looking at.

**Two of the three transcriptions live here**, and this is where the move pays for itself. The
pressed tone on the view switch carries a hard-coded variant prefix because a palette token
cannot carry one. The class-group headers and the class pills assemble their tone the same way.
As selectors, both are rules over the state the control already publishes.

**The sparkline is the interesting one.** 128 already moved its geometry to `calc()` over a
number; this ticket moves its fill from a per-row class string to the tone the row's share
answers with. `severityTone()` stays in JavaScript — it is a threshold with judgement in it, and
`palette.test.mjs` pins it — but what it answers with becomes an attribute rather than a lookup.

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
- [ ] The JavaScript maps still exist and still have callers on the surfaces that have not moved.
- [ ] Screenshot baselines for the dashboard's two views are reviewed per view and unchanged in
      colour. A moved pixel is a bug in this ticket, not a new design.
- [ ] No count, bar, denominator or roll-up moves. Nothing here reaches the derivation.

## Traps

- **The filter's amber strip is not a tone-bearing surface to redesign.** It says a filter is on,
  for as long as it is on, and its colour is chrome. Do not fold it into the tone product because
  it happens to be amber.
- **A group with no repeats still says so.** *Nothing wrong here* and *this class does not exist*
  are two different answers, and the empty group is the first one. A rule that hides a group with
  no children deletes that distinction.
- The class-group order is the vocabulary's and never the counts'. Nothing in this ticket touches
  ordering, and a selector that reads a count is a selector that will be asked to sort by one.
- Do not delete a map. 135 contracts.
- The tri-state select-all answers a mixed press by clearing. Its ticked colours come from the
  accent shape, which holds two tones and no direction — that constraint moves with it.
