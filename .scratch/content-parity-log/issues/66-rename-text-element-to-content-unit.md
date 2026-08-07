# 66 — Rename `TextElement` to `ContentUnit`, and change no behaviour

**What to build:** the contract, the code and the tests speak of a **content unit**.
No number moves.

The word is changing because the thing is changing. Ticket 67 makes a unit fold the
links inside it, so it stops being one HTML element and becomes the block an editor
edits. `CONTEXT.md` already calls the concept a content unit in two places, and the
committed exclusion list for pages has used the phrase since ticket 19.

This ticket goes first and alone, so that ticket 67 is a change of behaviour and
nothing else. A rename mixed into a behavioural change hides the behavioural change
in the diff, and this one rebuilds every report.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, question 1.

- [ ] The contract names `ContentUnit`. The field names inside it do not change.
- [ ] The crawl, the comparison, the web build, the tests and the probes use the new
      name. No module keeps a local synonym.
- [ ] `CONTEXT.md` and the ADRs are already written; check the code agrees with them.
- [ ] **Every count and every finding id is identical before and after.** This is a
      move, not a change. If a number moves, something behavioural came in with the
      rename and must come out.
- [ ] The tests pass without a fixture changing meaning.
