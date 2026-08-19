# 13 — A control is large enough to hit, and the header wraps

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../PRD.md

**What to build:** two fixes carved out of `content-parity-log` ticket
[87](../../content-parity-log/issues/.out-of-scope/87-three-widths.md), which is parked as a
responsive programme. Neither of these is about phones, and neither needs one.

## Why they are here and not in 87

87 asks the log to work at three widths for *an editor standing in a showroom with a phone* —
a reader we have no evidence for, and one of 87's criteria is unverifiable because it depends
on ticket 79's context markers, which do not exist. So the programme is parked.

But two of its criteria were never about width:

1. **Touch-target sizing is a WCAG target-size question**, and it applies to a mouse user with
   poor motor control sitting at a desktop. The measurement in 87 is that the override
   controls, the bulk buttons and the clamp control use `size="xs"`
   (`web/src/components/BulkControl.jsx:122,133`) — **smaller** than a target size, not larger.
   The override controls are the most-pressed controls in the application. `size="xs"` on them
   is wrong at any width.
2. **The header cannot wrap**, and `web/src/components/Shell.astro:35-41` says so in a comment:
   *nothing here can wrap without breaking the `h-16`*. That is a real constraint written into
   the shell, and a fixed `h-16` that forbids wrapping is a decision nobody made deliberately.

## Acceptance criteria

- [ ] Every interactive control meets a touch-target size — the override controls, the
      checkboxes and the class pills included. `size="xs"` leaves the override controls.
- [ ] The size chosen is stated once, with the WCAG success criterion it answers, so the next
      person picks the same one.
- [ ] The header wraps. The brand, the store switcher and the page title all stay reachable
      when the line runs out of room, and the `h-16` either goes or is stated as a minimum.
- [ ] The comment at `Shell.astro:35-41` is corrected or removed — it currently documents a
      constraint this ticket removes, and a comment that describes the old behaviour is worse
      than none.
- [ ] The store switcher case is tested both ways: it renders only when more than one store is
      in the log.

## Traps

- **This is not the responsive programme.** No breakpoints, no container queries, no `sm:` /
  `md:` sweep. Two fixes, and the width targets stay unnamed — naming them is 87's job and 87
  is parked.
- **A larger control must not get louder.** ADR 0019 holds: the interface is quiet by default.
  Growing the hit area is not permission to add weight, colour or a border.
- **The palette is unchanged.** This ticket resizes; it does not re-tone.
- **`table-fixed` is load-bearing** for the column alignment the side-by-side diff depends on.
  If a control's new size pushes a column, fix the control, not the table.

## Where it came from

The audit of every open `ready-for-agent` ticket, 2026-08-19
(`.scratch/2026-08-19-ready-for-agent-audit.md`), and the grilling session over it. The audit's
verdict on 87 was *split, and park the programme*: park the three widths, carve these two out,
because they are worth doing and do not need a responsive programme around them.
