# 86 — Heading level becomes information

Type: task
Status: ready-for-agent
Blocked by: 75
Parent: ../map.md

**What to build:** a demoted heading stops being counted as migration work and becomes a
difference an editor can read. `h2 → h3` on a migrated page is a heading-hierarchy
question, and heading hierarchy is SEO work that the log has always said is somebody
else's phase.

## Why it is its own ticket

[75](75-class-visibility-replaces-shown.md) is deliberately count-neutral: every shown
class becomes `work`, so the denominator does not move on the day the enum lands. This
ticket is the first move that **does** move it, and it is separated for exactly that
reason — ticket 33 found that one number hiding two opposite movements is how a
measurement stops meaning anything.

`heading-level` carried **1,215 shown findings, 5.3% of shown**, in the measurement of
2026-08-10: 469 on `nl`, 442 on `be`, 143 on `de`, 59 on `fr`, 57 on `be_fr`, 45 on `uk`.
**That measurement is over 448 reports and the disk now holds 816**, so those numbers are
history. Ticket 76 was to have restated them and closed without doing so — the pre-64
corpus it needed is gone. **This ticket measures its own before-value**: count
`heading-level` shown findings over `data/reports/` as it stands, per store and as a
share of shown, and record it here before the enum change lands. That number is the one
to move.

## What must stay true

- **The class does not go.** It becomes `information`: rendered, not counted. Deleting it
  would throw away a real difference nobody has decided about.
- **`detail` stays in the finding id.** The `h2 → h3` string joins the id because without
  it two different demotions of the same words are one finding. Ticket 33 decided that and
  this ticket does not touch it.
- **The bar is not re-based.** Ticket 29 fixed it to the current snapshot, so the
  denominator simply becomes smaller and the percentage jumps. Absolute counts beside the
  percentage are what stop that reading as progress.

## Acceptance criteria

- [ ] `heading-level` carries `visibility: 'information'`.
- [ ] The per-store totals are recorded before and after, in this ticket's answer,
      **and nothing else moves.** Any other class that changes count is a defect in this
      diff.
- [ ] The percentage jump is stated in the answer per store, so the next reader of the
      dashboard is not surprised by it.
- [ ] A `heading-level` difference is still visible to an editor, still carries its
      `detail`, and no longer carries an override control that implies it is work.
- [ ] Existing dismissals and mutes on `heading-level` findings are left alone. The events
      are append-only, they stay on disk, and the answer says what the interface does with
      a dismissal on a class that is no longer counted.
- [ ] The answer says where heading hierarchy is handled instead, or states plainly that
      it is not handled anywhere yet. An unowned hand-off is worse than a stated gap.

## Traps

- **This is a scope decision dressed as a one-line change.** The line is one word in the
  vocabulary. The consequence is that 1,215 differences leave the work everybody is
  measured on, and that belongs in the answer in words, not only in a table.
- **`tag-changed` is the neighbouring class** and it is hidden today. It also carries a
  `detail`. Check whether the argument here applies to it before somebody notices the
  inconsistency later.
- A mute on `heading-level` for a page took findings out of the denominator. After this
  ticket the class is out of the denominator anyway, so the mute now records a judgement
  with no effect. That is harmless and it should not be silently deleted.
