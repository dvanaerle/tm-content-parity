# 114 — The mute leaves the derivation and the port

Type: build
Status: ready-for-agent
Blocked by: 113
Parent: ../map.md

**What to build:** the `muted` action and the `page-class` scope stop existing in the code.
An override is now keyed on a finding or on a page, and it is a fix claim, a dismissal, a
review or a clearing.

Last in the sequence, and by then it deletes symbols nothing calls: 112 took the writers,
113 took the readers.

## What goes

- `page-class` from the scope union, `muted` from the action union and from the derived
  finding states.
- The mute lookup in the derivation — the section key, the page-wide fall-through, and the
  `anchorHeading` attached to an override so a clearing could aim at it.
- The coverage function, the mute-key module entire, `web/src/lib/mute.mjs` entire, and the
  bulk mute seam beside `bulkDismissal()` and `bulkClear()`.
- The `names_section` / `anchor_heading` mapping across the Supabase port.
- `CLEARABLE` narrows to the dismissal, so a clearing now only ever revokes one thing.

## Acceptance criteria

- [ ] No source file outside `docs/` and `.scratch/` contains the word `mute` in any
      casing.
- [ ] `clearedEventFor()` still exists and still has one caller shape. It was made one
      function on purpose in ticket 110 R2, so the next change to a key cannot land in one
      of two callers only — narrowing it must not re-split it.
- [ ] The tests that asserted mute precedence, section-versus-page-wide, the fall-through,
      the coverage semantics and the refusals are **deleted, not skipped**. The tests that
      assert dismissal, fix, review and clearing behaviour are unchanged and still pass.
- [ ] `shared/mute-key.test.mjs` goes with its module. Its own assertion — that the key
      module imports nothing — has nothing left to protect.
- [ ] The whole suite is green, and the browser project mounts and clicks both remaining
      presses.
- [ ] **`supabase/schema.sql` is not changed**, beyond a comment above the retired columns
      and constraints naming ADR 0011 and the date. The eleven historical rows contradict
      any constraint saying a mute is impossible, so it could only be added `NOT VALID` — a
      schema asserting a shape the table demonstrably held eleven times. The app stops being
      able to write a mute because the code to write one is gone.
- [ ] Reading a row with `scope = 'page-class'` does not throw. Eleven of them are on disk
      for ever, and the port must skip what it no longer understands rather than fail on it.

## Traps

- **The historical rows still load.** This is the criterion most likely to be missed,
  because the derivation will simply never match them and nothing will look wrong until a
  parse or a switch statement hits one. Test it with a fixture built from a real row.
- **`anchorHeading` is still a field on a finding.** It is how a difference says where it
  is, it is rendered on a page, and it is not part of this deletion. Only the mute key and
  the index entry go.
- **A dismissal must keep skipping a colleague's decision**, and keep counting it as
  skipped. That rule belonged to the dismissal, not to the comparison with the mute, and
  the sentence explaining the two eligibilities left with 112.
