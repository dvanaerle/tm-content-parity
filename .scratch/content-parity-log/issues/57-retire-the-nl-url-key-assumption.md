# 57 — Retire the Dutch-url-key assumption

Type: task
Status: merged
Assignee: —
Blocked by: 55, 56
Parent: 50-content-page-discriminator.md

**Merged into [54](54-french-store-shows-all-its-pages.md) and
[55](55-five-stores-show-all-their-pages.md) on 2026-08-07. Do not build this
ticket.**

It was written to be the contract step of an expand-and-contract sequence, and it
carried its own merge condition: build it only if many readers treat the page value
as a Dutch url key instead of an opaque key. The count was then measured.

## The measurement that closed it

The page value is used in about 82 places. **Twelve hold an assumption about its
shape.** The rest treat it as an opaque string: the finding id, the mute key, the
override event key and the database column; everything shown to an editor; every
sort, search and lookup; and about 31 pure pass-throughs.

**The persistence risk is zero, on one condition.** Stored keys live in one place,
the override table, and that table is append-only by policy — there is no update
and no delete, so a reformatted key could never be repaired. But a page that has a
Dutch url key can keep its current string, and the 181 pages that hold stored
findings, mutes and reviews all have one. The new pages have no stored state.

So there is nothing to migrate, and a double-write period would buy nothing and
leave rows behind that cannot be removed. Ticket 54 makes the change in one edit
and keeps the anchored keys byte-identical.

## What moved where

- **Ticket 54** takes the identity change: the new key form, the safe sentinel
  character, the missing URL encoding in three link builders, and the test
  literals.
- **Ticket 55** takes the wording: the contract and `CONTEXT.md` must agree, and
  the contract must stop promising a Dutch url key. `CONTEXT.md` was corrected on
  2026-08-07 and the contract was not.
- **Ticket 54** also deletes the unused store-scoped fallback key in the old
  generator. It uses a colon, which is illegal in a Windows filename, so it would
  break the extract writer, the report writer and the static build if it ever
  fired. No current key contains a colon, so it has never fired.
