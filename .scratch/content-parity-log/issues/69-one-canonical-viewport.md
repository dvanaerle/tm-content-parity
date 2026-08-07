# 69 — One canonical viewport, and the duplicate versions go

**What to build:** production sends the desktop and the mobile version of a block in
the same HTML. The log reads a page at one width and stops comparing the other
version.

The extraction has no computed style, so it cannot see that a block is hidden. It
reads both. Measured inside `<main>` on production: `/downloads` holds 40 duplicated
strings, 28 of them under a class that hides one copy; each category page holds four,
three of them in the banner. So the duplication is mostly the banner, and ticket 64
removes that part. What is left is small and real — a layered-navigation label
duplicates on every category page — and it is the part this ticket is for.

`CONTEXT.md` now states the canonical viewport. This ticket makes the statement true
in the code.

**Blocked by:** 64.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, question 20.

- [ ] The canonical viewport is desktop, and one place in the code says so.
- [ ] A unit that is hidden at the canonical viewport is not extracted.
- [ ] The rule is by class convention, and the conventions it covers are listed with
      the pages they were measured on.
- [ ] Measure the residual duplication **after** ticket 64. If the banner removal
      leaves almost nothing, say so and close this ticket rather than build a rule for
      one label.
- [ ] The consequence is stated where a reader will meet it: the log does not check
      the mobile version of a page.
