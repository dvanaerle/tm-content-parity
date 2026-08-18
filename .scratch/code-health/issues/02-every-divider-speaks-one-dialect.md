# 02 — Every divider speaks one dialect

**What to build:** an agent reading a long file meets section dividers written one way. The
tree has 27 of them in three dialects, and two of those pad a rule out to a fixed column, so
renaming a section leaves a broken alignment behind that no formatter repairs:

```
// --- Absolute checks on the new site -----------------------------------
// ------------------------------------------------------------------ the reading
// ---- match strategies (multiset intersection per page)
```

Only the third is permitted. `docs/standards/CODING_STANDARDS.md` says so under *What goes*,
and says why the other two are refused. This repo refuses two words for one thing throughout
`CONTEXT.md`; three punctuation styles for one job is the same defect.

**Blocked by:** none — can start immediately.

**Status:** ready-for-agent

**What this ticket is not.** A divider says the file has become two files, and the real remedy
is the split. That is not this ticket. The dividers cluster in `crawl/probes/` — 21 files,
3,484 lines of code, no test coverage — so splitting there needs its own decision and its own
risk assessment. This ticket makes the dialect consistent so it stops spreading while that
decision waits.

- [ ] Every section divider in the tree reads `// ---- lowercase label`.
- [ ] No divider pads a rule to the right of its label.
- [ ] Labels are sentence case, never capitals, per `CONTEXT.md`.
- [ ] No file modified on `ticket-104-search-page-scope` is touched.
- [ ] `vitest run` is green. A test file appears in the diff only where the divider itself is
      in a test file, and no assertion in it changes.
- [ ] No code moves — this ticket rewrites comment lines and nothing else.
