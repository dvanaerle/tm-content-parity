# 115 — The record is squared with the decision

Type: task
Status: ready-for-agent
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
- [ ] The re-triage of 2026-08-13 still reads true against what shipped: `needs-triage` on
      **40**, **39**, **43** and **44**, and the `Blocked by: 114` notes on **80**, **75**
      and **32**. Anything the build settled — the class splits above all — is re-triaged
      rather than left waiting.
- [ ] **Ticket 110's mute criteria** are struck through in place and dated, in the style
      the ticket already uses for its own overturned lines. Its dismissal and clearing
      criteria are untouched and still describe what shipped.
- [ ] **Ticket 88** (*the mute says what it hides*) carries a note at the top: what it built
      was measured, and the measurement is the evidence in ADR 0011. It is not struck
      through — it was built and it worked.
- [ ] **`PRD.md:457`** — *Remove Class Mute | refused* — is annotated with the reversal, its
      date and the ADR. The refusal stays legible; a reader must be able to see that this
      was decided twice and why the second answer differs.
- [ ] **`WORKLIST.md:170`** — the open step *"00b — Make the first real mute. Nobody has made
      one yet"* — is closed as *will not happen*, with the reason. It is the cleanest
      statement of the evidence in the repo and it should not simply disappear.
- [ ] **`map.md`** gains an entry for ADR 0011 and this ticket sequence, in the shape its
      other entries use.
- [ ] Any remaining prose in `docs/` or `.scratch/` that describes the mute as a live
      feature is corrected or dated. `CONTEXT.md` and ADR 0008 were done on 2026-08-13 and
      need no further work.

## Traps

- **Ticket 86's trap line already anticipated this.** It reads: *"A mute on `heading-level`
  for a page took findings out of the denominator. After this ticket the class is out of the
  denominator anyway, so the mute now records a judgement with no effect."* That sentence is
  now history and should say so, but 86 itself is **not** blocked by this sequence and must
  land in its own commit — two denominator movements in one number is the thing it exists to
  avoid.
- **Do not close or rewrite ADR 0008.** It is superseded, not wrong. Its argument is the
  reasoning that led here.
