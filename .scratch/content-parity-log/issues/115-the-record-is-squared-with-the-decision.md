# 115 — The record is squared with the decision

Type: task
Status: resolved 2026-08-13 — docs only, no source change. One criterion could not be met
literally (`WORKLIST.md` no longer exists) and is met in substance; see the note under it.
Blocked by: 114
Parent: ../map.md

**What to build:** every place in the repo that still promises a mute says what happened to
it instead. Nothing is deleted; a refused idea that vanishes comes back in six months
without its refusal.

No source changes. This is the half of a deprecation that gets skipped.

## Acceptance criteria

- [x] **Ticket 41** (*coverage matrix bulk mute*) is parked `wontfix` in
      `issues/.out-of-scope/` — **done 2026-08-13, ahead of this ticket.** It could not
      wait: 115 is blocked by 114, and until then 41 sat in the active issues folder as
      `ready-for-agent`, describing a feature being deleted. Verify only.
- [x] The re-triage of 2026-08-13 still reads true against what shipped: `needs-triage` on
      **40**, **39**, **43** and **44**, and the `Blocked by: 114` notes on **80**, **75**
      and **32**. Anything the build settled — the class splits above all — is re-triaged
      rather than left waiting. — **verified, and three of the seven moved.** 40, 39, 43 and
      44 stay `needs-triage`: the build settled nothing there, because the class splits need
      a taxonomic argument and that is a human's. What the build did settle is the
      sequencing: **114 is resolved**, so 80 and 32 have their blocks **lifted** and their
      false sentences struck in place instead, and 75's *either order is fine* note is
      collapsed to the branch that actually happened — 114 landed first, so its mute
      criterion was void before 75 starts. All four bodies had the false criteria left
      unstruck under a dated preamble; each is struck in place now, including three unticked
      boxes an agent could otherwise have tried to satisfy.
- [x] **Ticket 110's mute criteria** are struck through in place and dated, in the style
      the ticket already uses for its own overturned lines. Its dismissal and clearing
      criteria are untouched and still describe what shipped. — **done**, plus a note at the
      top saying which halves are struck. Where a criterion covered both presses — *both
      actions state the selected count*, and R2's undo — only the mute clause is struck, so
      the shipped dismissal behaviour still reads as a criterion. Both mute traps are marked
      history: the *two eligibilities* trap has one eligibility left, and *the doubled
      figure* has no exception left.
- [x] **Ticket 88** (*the mute says what it hides*) carries a note at the top: what it built
      was measured, and the measurement is the evidence in ADR 0011. It is not struck
      through — it was built and it worked.
- [x] **`PRD.md:457`** — *Remove Class Mute | refused* — is annotated with the reversal, its
      date and the ADR. The refusal stays legible; a reader must be able to see that this
      was decided twice and why the second answer differs. — *the line number is the file as
      it stood before this ticket's own annotations moved it. The row is in the*
      Corrections to the superseded draft *table, and every live citation of the PRD by
      line was replaced with a section anchor on 2026-08-13.*
- [x] ~~**`WORKLIST.md:170`**~~ — the open step *"00b — Make the first real mute. Nobody has made
      one yet"* — is closed as *will not happen*, with the reason. It is the cleanest
      statement of the evidence in the repo and it should not simply disappear.
      — **met in substance, not literally: `WORKLIST.md` no longer exists.** It was deleted
      on 2026-08-13 in commit `926d46f`, two commits before 114 was ticked, and that commit
      says so: *"Live pointers at them remain in `RUNBOOK.md`, `map.md` and ticket 115; they
      are not repaired here."* So there was no line 170 to strike. The step is closed where
      the evidence already lived — **ADR 0011 quotes it in full** and now records the closure
      beside it: nobody ever made the first real mute, and ticket 112 removed the control, so
      there is nothing left to press. The quotation is the surviving record, and
      `git show 926d46f^:.scratch/content-parity-log/WORKLIST.md` is the file.
- [x] **`map.md`** gains an entry for ADR 0011 and this ticket sequence, in the shape its
      other entries use. — the last entry in *Decisions so far*, with the evidence, the
      judgement, the five tickets and a back-reference to the refusal it reverses.
- [x] Any remaining prose in `docs/` or `.scratch/` that describes the mute as a live
      feature is corrected or dated. `CONTEXT.md` and ADR 0008 were done on 2026-08-13 and
      need no further work. — **the surface was much larger than this ticket's list**; see
      the answer below.

## Traps

- **Ticket 86's trap line already anticipated this.** It reads: *"A mute on `heading-level`
  for a page took findings out of the denominator. After this ticket the class is out of the
  denominator anyway, so the mute now records a judgement with no effect."* That sentence is
  now history and should say so, but 86 itself is **not** blocked by this sequence and must
  land in its own commit — two denominator movements in one number is the thing it exists to
  avoid.
- **Do not close or rewrite ADR 0008.** It is superseded, not wrong. Its argument is the
  reasoning that led here.

## Answer

**Resolved 2026-08-13.** No source file changed. **38 markdown files** carry the withdrawal
now, in one commit. Ticket 86 is a 39th and is deliberately not in it; see the note at the end.

**The list in this ticket was a floor, not the scope.** A sweep of `docs/` and `.scratch/`
found the mute promised as a live feature in far more places than the seven named above, and
two of them were worse than anything on the list:

- **`PRD.md` had 18 live statements and 5 live user stories with no annotation at all.** Only
  line 457 was named here. Stories 18 to 22, the five derived states, the `Closed` bucket
  definition, the mute key section, the action vocabulary, both seam-table rows and the
  sequencing risk are all annotated or struck now, under a banner at the top. The stories are
  kept numbered so `RUNBOOK.md`'s story mapping does not shift under a reader.
- **`RUNBOOK.md` held a runnable `/implement` instruction for ticket 88**, in session 10A,
  told to read a superseded ADR — *do this before anything else in the whole runbook*. This
  ticket exists to stop exactly that, and nothing in its criteria pointed at it. The session
  is struck and marked spent, the order starts at 1, and the five withdrawal tickets are in
  the full list.

Also corrected: **`map.md`** — the *class mute is not removed* refusal now carries its
reversal, the ADR 0008 decision bullet is marked superseded, the working order no longer
sequences 88 first, and *Resolved tickets* carries a standing note that the mute passages in
those entries are records rather than the model. **ADR 0005** — two assertions of *the mute
key is the class* outside the existing amendment's scope. **Ticket 11** — the axis-B rules
that 39, 40, 43 and 44 all cite, including *an editor mutes the pages that are absent on
purpose*, which is the open question axis B now owes an answer to. **Tickets 01 and 09** —
the two origins every later *the class is the mute key* comes from, including the sentence
quoted most often in the repo: *a mute removes findings from the denominator*. **Tickets 29
and 31** — the two build records, by banner rather than line by line, because what they
describe is what shipped. And passing clauses in **02, 05, 06, 08, 21, 23, 25, 33, 36, 42,
48, 54, 57, 76, 82, 86, 98, 122, 105**. *(122 was numbered 100 when this was written;
renumbered 2026-08-13.)*

**Two things found on the way, both recorded rather than fixed here.**

- **`WORKLIST.md` is gone**, so its criterion could not be met literally. See that criterion
  above. Its dead pointers survive in `RUNBOOK.md` and `map.md`; both files now say the file
  was deleted and how to recover it, and the individual pointers are left as the record of
  where a step was booked. Repairing them is not this ticket's business.
- **Three links pointed at ticket 41 in its old location** — `map.md`, `RUNBOOK.md` session
  8, and ticket 23, which is *folded into* 41 and therefore folded into a parked ticket. All
  three now resolve and say what happened.

**ADR 0011 needed squaring against its own sequel.** Two of its passages were written before
tickets 111 to 114 ran and had gone stale by the time this ticket read them: *"One mute is
live"*, in the present tense, after 111 revoked it; and the consequence *"`nl`'s numbers move
once … the count must be measured and stated before the change lands"*, when 111 measured the
movement as **zero**. Both are dated in place now rather than rewritten. The second is not a
correction so much as a result: the count *was* measured before the change landed, and the
answer was zero because the mute had drifted off the section its key names. A judgement whose
reach silently shrinks when the page changes is the over-reach argument seen from the other
side, and the ADR now says so.

**Ticket 86 is annotated but deliberately not in this commit.** Its trap line — the one this
ticket's own Traps section quotes — is marked history, and its *existing dismissals and mutes*
criterion has the mute half struck. Both edits are in the working tree and **left unstaged**:
86 is being written by another stream at the same time (it gained `Blocked by: 75, 118`, a
`Spec: 119` line, a new acceptance criterion and a measured `## Comments` block while this
ticket was in flight), so committing the file here would have pulled 86's planning into the
withdrawal commit and broken the trap it warns about. The two annotations travel with 86.
No criterion of 86 was built and no denominator moved. Worth recording for whoever takes it:
ADR 0011 expected the revocation to move `nl`'s numbers and ticket 111 measured **none**,
because the last mute had drifted off its section. 86 therefore starts from a denominator
that nothing has moved.
