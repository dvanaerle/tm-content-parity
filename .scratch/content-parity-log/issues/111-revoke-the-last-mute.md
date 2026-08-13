# 111 — The last mute is revoked, and the log says what came back

Type: build
Status: ready-for-agent
Blocked by: none
Parent: ../map.md

**What to build:** the one live mute is taken back, and `nl`'s open count moves by a number
this ticket records. Nothing else changes.

This is first **because the mute still works**, and it is the only ticket in the sequence
that depends on that. Once ticket 114 has taken `page-class` out of the derivation there is
no longer anything that can answer *what was this hiding* — the findings simply reappear,
uncounted and unexplained. Measure while the feature is alive.

## The row

`nl` · `downloads` · `text-missing` · the content before the first heading. Written
2026-08-10 11:07, never cleared. Its note reads `"Negeren"`.

It is the only live mute in the table. Ten others were written and revoked by their own
author, most within twenty seconds; six of those carry the note `Test` or a typo of it. The
eleven rows stay on disk — the table is append-only and this ticket adds to it.

## Acceptance criteria

- [ ] The findings the mute covers are counted **before** the revocation, per class and in
      total, and the number is recorded in this ticket's answer.
- [ ] `nl`'s open count and its denominator are recorded before and after.
- [ ] One `cleared` event is written on that key — store, page, class and the heading slot
      it was made under. A `cleared` event carries no note; the reason lives in this ticket
      and in ADR 0011.
- [ ] The event is written through the same path an editor's clearing takes, not by a hand
      -written insert that could disagree with `clearedEventFor()` about the key.
- [ ] After it: no `muted` row anywhere in the table is the latest event on its key. State
      that as a query result, not as an assumption.
- [ ] The dashboard no longer draws *N gedempt (buiten de teller)* for any store.
- [ ] No source file changes.

## Traps

- **The heading slot is part of the key.** This mute has `names_section: true` and a null
  `anchor_heading`, which is the content before the first heading — a real section, not the
  page-wide form. A clearing aimed at the page-wide key leaves it standing and the number
  will not move.
- **The count is not the repeat's size.** A mute covers every finding of its class in its
  section, including ones nobody has looked at. That gap is the whole reason ADR 0011 exists
  and it is the number worth recording.
- **Do not delete the row.** The append-only rule is the one this override model is built
  on. A revocation is a new event.
