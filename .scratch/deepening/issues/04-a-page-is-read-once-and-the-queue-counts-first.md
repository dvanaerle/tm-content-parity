# 04 — A page is read once, and the queue counts first

Type: spec
Status: ready-for-agent
Written: 2026-08-21
Decided in: the grilling of candidate 3, 2026-08-21
Blocked by: 03. It edits the dashboard's memos, which 03 rewrites; landing first means writing
them twice.

**What to build:** the override log hands out a **page reading** instead of a `Map`, and the
**page queue** becomes a module of its own that counts before it narrows. Nothing an editor
sees changes today. What changes is that *an unanswered page reads as all open* is stated once
instead of four times, and the priority chips cannot come to report themselves.

## Problem

`useStoreOverrides` returns twelve fields, one of which is a raw `Map` keyed
`` `${store}/${page}` ``. It has **one** consumer — the dashboard — and that screen re-spells
the key three times, each spelling carrying its own empty-log fallback:

- the open count falls back to the page's own work,
- the three bucket counts fall back to *everything open*, which is the interesting one and the
  only one with a comment explaining it,
- the annotations fall back to nothing,
- the priority falls back to null.

Four spellings of one rule — *before any override is known, nothing is decided and nothing is
contradicted* — in a 1,334-line screen. Beside them, the page queue's filter-then-sort is inline
in the same screen, and the priority counts are a second loop over the un-narrowed list, kept
correct by whoever remembers why it must not read the narrowed one.

## Solution

**A page reading, not a Map.** A pure `pageReading(page, state)` holds the key spelling and all
four fallbacks and is tested in plain Vitest. The hook returns `readingOf(page)` bound to its own
state, and `byPage` stops being part of the interface — nothing else reads it, so there is no
second way to ask the question.

**A page queue, not an inline memo.** `pageQueue({ pages, classes, priorities, sort, readingOf })`
→ `{ rows, priorityCounts, total, shown }`. It narrows by the class pills and the priority chips,
sorts worst-first on what the reading says is left or by name, and counts the priorities over the
**un-narrowed** pages. `pagesWithClasses` and `pagesWithPriorities` become its implementation and
stop being exported.

**It is the same rule as ticket 03's, said about the other list.** A priority chip has the class
pill's failure mode exactly: a count taken after the narrowing reports itself. Both lists now get
it structurally, in the same words.

## Tests

Two seams, both plain Vitest, no new browser test:

1. **`pageReading`** — an answered page reads the log; an unanswered page reads as all open with
   its work in *Open* and nothing contradicted; annotations and priority are absent rather than
   invented. The key spelling is exercised by construction and asserted nowhere, because it is no
   longer anybody's business.
2. **`pageQueue`** — the two filters are **and**, not or; the priority counts do not move when a
   chip narrows the list and the rows do; worst-first is on the work left after the log, not on
   the snapshot's; the name sort is stable.

The dashboard's existing browser test passes unedited. If it needs editing, the change went
further than this ticket.

## Out of Scope

- **Making the derivation cover every page it was given**, so no entry is ever absent and no
  fallback is needed anywhere. This is the deeper fix and it was considered and refused here: it
  changes what `derived` means for every other reader of the hook, including both presses and the
  Ledger, which is a behaviour change wearing a refactor's clothes. Worth its own ticket if the
  fallback is ever found disagreeing with itself.
- The other eleven fields of the hook's return. Only `byPage` leaves.
- The Ledger, the presses, and anything that reads `derived` or `byFinding`.
- Any change to what the queue draws, to the sort's meaning, or to the priority vocabulary.

- [ ] `pageReading(page, state)` is a pure module holding the key spelling and all four
      empty-log fallbacks, with plain-Vitest tests for each.
- [ ] The hook returns `readingOf(page)` and no longer returns `byPage`.
- [ ] `pageQueue(…)` returns rows, priority counts and both totals from one call, counting
      before it narrows.
- [ ] `pagesWithClasses` and `pagesWithPriorities` are `pageQueue`'s implementation and are no
      longer exported from `filter.mjs`.
- [ ] The dashboard spells no override key, holds no empty-log fallback, and has no inline
      filter-then-sort.
- [ ] The dashboard's browser test passes unedited.
- [ ] `oxlint` and the full test suite pass.
