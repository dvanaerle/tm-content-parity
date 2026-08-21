# 13 — A control is large enough to hit, and the header wraps

Type: task
Status: resolved — 2026-08-21, branch `ticket-13-target-floor-and-header-wrap`
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

- [x] Every interactive control meets a touch-target size — the override controls, the
      checkboxes and the class pills included. `size="xs"` leaves the override controls.
- [x] The size chosen is stated once, with the WCAG success criterion it answers, so the next
      person picks the same one.
- [x] The header wraps. The brand, the store switcher and the page title all stay reachable
      when the line runs out of room, and the `h-16` either goes or is stated as a minimum.
- [x] The comment at `Shell.astro:35-41` is corrected or removed — it currently documents a
      constraint this ticket removes, and a comment that describes the old behaviour is worse
      than none.
- [x] The store switcher case is tested both ways: it renders only when more than one store is
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

## What was built

**The floor is 24 × 24 CSS pixels, WCAG 2.2 SC 2.5.8 *Target Size (Minimum)*, Level AA**, and
it is stated in ADR 0019 under *The target floor*, which the button primitive and both pill
sites point at. SC 2.5.5's 44 was considered and refused in the ADR: a content view carries up
to 168 rows of controls.

- `xs` and `icon-xs` are **deleted from `ui/button.jsx`** rather than left unused, because the
  next person picks from that list. `xs` was `h-6` — the floor exactly — and under it on width
  around a glyph. All 20 call sites moved to `sm` / `icon-sm`, 28 pixels in both directions.
- The **class filter pill** was `h-auto`, which collapsed the toggle item onto the 20-pixel
  pill inside it. It is `min-h-6`, which is space and not weight: the toggle draws no ground
  until it is pressed. The priority filter got the same fix off the same edit.
- The **class pill as a link** grows its *target* and not its ink — a pseudo-element four
  pixels above and below the words, `ui/checkbox.jsx`'s device, because a taller tinted pill on
  168 rows is the weight ADR 0019 spent a pass removing. Vertical only: an overlapping target
  is worse than a small one.
- The **checkbox** already cleared the floor at 32 × 40 through the same device. Unchanged, and
  now it says so.
- The **header wraps**. `h-16` became `min-h-16` on both the bar and the row, with `flex-wrap`,
  `gap-y-2` and `py-2`; the switcher's own pills wrap too. At any width that fits the row on
  one line the bar still draws the same 64 pixels. The **page title is not in the header** —
  `Shell` takes `title` for the document title and the page draws its own heading in the banner
  or the main column, so it was already outside the line that runs out of room.
- The comment at `Shell.astro:35-41` said *nothing here can wrap without breaking the `h-16`*.
  Rewritten to say what the row does now and why the floor is a floor.

**Tests.** A third Vitest project, `astro`, renders a `.astro` component's own HTML through
Astro's container — the seam a pure function and a browser both miss. It carries the switcher
both ways and the header's wrap. `interface-reach.test.mjs` gains the greppable half of the
floor: no call site names a size below it, and `ui/button.jsx` offers none back, each with a
can-fail case.

**What is not tested**, and it is in the ADR: no test here measures a *rendered* pixel. The
browser project runs components without the stylesheet, and ADR 0019 refuses the screenshot
suite that would. A halo with the wrong inset is caught by a reader.
