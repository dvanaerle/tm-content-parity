# 114 — The mute leaves the derivation and the port

Type: build
Status: resolved 2026-08-13 in 36dcd89 — the symbols are gone. Criterion 1 could not be met
literally and is met in substance; see the note under it.
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

**All seven are met, and the first is met in substance rather than literally — it is
unsatisfiable as written.** One judgement call inside it is flagged for overrule: the
filename `supabase/mute-anchor-heading.sql`, which the ticket never names either way.

- [x] No source file outside `docs/` and `.scratch/` contains the word `mute` in any
      casing. **Met in substance, not literally — the criterion is unsatisfiable as
      written**, and two of its own siblings are why. shadcn ships design tokens named
      `muted` (`text-muted-foreground`, `bg-muted`, `--muted-foreground`) throughout
      `web/src/components/ui/` and `web/src/styles/app.css`; renaming them would fork the
      library against ADR 0007, which takes shadcn for behaviour. And criterion 6 *requires*
      `supabase/schema.sql` to keep `'muted'` in its check constraint. So it was read as
      *the app's own vocabulary*, and every domain reference went. What survives, in full:
      - the `'muted'` / `'page-class'` **data literals** in the fixtures criterion 7 and its
        trap ask for, in `schema.sql`, and in `crawl/probes/probe-fold-detachment.mjs`. The
        probe keeps its `page-class` branch on purpose: dropping it would send those rows to
        the review branch, which dereferences a report, and throw — the same rule as the
        port's, in a script that reads the real table.
      - `supabase/mute-anchor-heading.sql`, whose **filename** carries the word. Kept, not
        deleted: it is the record of a change applied to a live table, and `schema.sql`
        line 19 points at it. Annotated `SUPERSEDED` instead. **This is the one item the
        ticket never named — overrule it if the filename was meant to go.**
      - Where the class was called *the mute key* as the reason the class vocabulary is
        closed, the reason is now **class visibility** (ADR 0005) — one enum, triaged once
        in git. That is the honest replacement: ADR 0011 says that job belongs there. The
        **actor** is the trap in that rewrite and it took a review round to get right —
        visibility is triaged in git by a rule author, so "an editor who turns casing off"
        was wrong twice over (`casing` is `work`, so no editor can), and it now reads "the
        unit visibility is decided on".

      **One line is not yet committed.** `web/src/components/Chips.jsx:23` still reads *"as
      soon as an editor mutes a class"* in the committed tree. The fix is written but sits
      unstaged, because that file was being edited by hand during this work and committing it
      would have taken an unrelated in-flight layout change with it. Criterion 1 is met once
      that line lands.
- [x] `clearedEventFor()` still exists and still has one caller shape. It was made one
      function on purpose in ticket 110 R2, so the next change to a key cannot land in one
      of two callers only — narrowing it must not re-split it. One body, returning one
      shape; `OverrideControl.jsx` and `bulkClear()` both still call it and nothing was
      inlined. Its doc no longer claims to read a key back off the finding, because
      `decided()` no longer attaches one — the honest justification is that **two callers
      must write the same event**.
- [x] The tests that asserted mute precedence, section-versus-page-wide, the fall-through,
      the coverage semantics and the refusals are **deleted, not skipped**. The tests that
      assert dismissal, fix, review and clearing behaviour are unchanged and still pass.
      No `.skip` or `.todo` anywhere. Surviving tests changed only where a fixture used the
      state `'muted'` and had to name another one; `overrides/supabase.test.mjs` was
      rewritten because its whole subject — the three anchor states crossing the port — left
      with the key.
- [x] `shared/mute-key.test.mjs` goes with its module. Its own assertion — that the key
      module imports nothing — has nothing left to protect. `web/src/lib/mute.mjs` and
      `mute.test.mjs` went the same way.
- [x] The whole suite is green, and the browser project mounts and clicks both remaining
      presses. 648 tests, 30 files. `Repeats.browser.test.mjs` clicks the dismissal and the
      clearing; the clearing's second page was decided by a mute and is now a dismissal.
      `npm run build` builds 823 pages clean. (No typecheck was run: TypeScript is not a
      dependency of this repo and there is no tsconfig, so the Astro build is the only
      compile gate there is.)
- [x] **`supabase/schema.sql` is not changed**, beyond a comment above the retired columns
      and constraints naming ADR 0011 and the date. The eleven historical rows contradict
      any constraint saying a mute is impossible, so it could only be added `NOT VALID` — a
      schema asserting a shape the table demonstrably held eleven times. The app stops being
      able to write a mute because the code to write one is gone. Verified mechanically:
      every added and removed line in the file starts with `--`. No DDL moved.
- [x] Reading a row with `scope = 'page-class'` does not throw. Eleven of them are on disk
      for ever, and the port must skip what it no longer understands rather than fail on it.
      `toEvent()` maps every row the same way and asks nothing about its scope — a mapper
      that switched on it is where those rows would start to throw.

## Traps

- **The historical rows still load.** This is the criterion most likely to be missed,
  because the derivation will simply never match them and nothing will look wrong until a
  parse or a switch statement hits one. Test it with a fixture built from a real row.
  **Answered.** Two fixtures, both from the live row — `nl` · `downloads` · `text-missing` ·
  the content before the first heading, 2026-08-10 11:07, note `"Negeren"`. The port's
  fixture keeps `anchor_heading` and `names_section`, because the columns are still on the
  table and a fixture that dropped them would be testing a row Postgres does not hold; a
  second test strips them for the four rows that predate ticket 88. The derivation's fixture
  re-points store and page at the report on purpose and says so — the derivation filters
  events on the report's store and page, so a row for another page is dropped before
  reaching anything and the test would pass without having asked its question.
- **`anchorHeading` is still a field on a finding.** It is how a difference says where it
  is, it is rendered on a page, and it is not part of this deletion. Only the mute key and
  the index entry go. **Held.** It survives on the finding, is still carried through the
  derivation, is still searchable, and is still rendered. A test now pins both halves: it is
  on the finding, and it is *not* on an override — because no override is keyed on it.
- **A dismissal must keep skipping a colleague's decision**, and keep counting it as
  skipped. That rule belonged to the dismissal, not to the comparison with the mute, and
  the sentence explaining the two eligibilities left with 112. **Held.** `OFFERED` and
  `offersDismissal()` are untouched, and the missing sentence is written back beside them.

## What this ticket found that it did not ask for

- **`eventKey()` and `overrides_current` no longer agree**, and the divergence is accepted
  rather than fixed. The view keys on four columns including `anchor_heading_slot`; the
  derivation now keys on three, because the slot left with `muteKey()`. On everything the
  app writes they still agree — nothing sets `names_section`, so the slot is the constant
  `*page` and cannot separate two rows. On the eleven retired rows the view can split what
  the derivation merges. Nothing looks their key up, so nothing can observe it, and adding
  the column back would mean carrying it for eleven rows. Recorded in both files, because
  the old comment asserted *the two must agree* and that sentence has lapsed.
- **Two stale references in the SQL comments** were repaired in passing: both named
  `compare/contract.mjs` as the home of `anchorHeadingSlot()`, which had lived in
  `shared/mute-key.mjs` since ticket 88.
