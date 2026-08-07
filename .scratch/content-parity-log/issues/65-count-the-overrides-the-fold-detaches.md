# 65 — Count the overrides that the fold will detach

**What to build:** the number that ticket 67 is not allowed to ship without.

A finding id is content-addressed. Ticket 67 folds an inline link into its
paragraph, so the text of every affected unit changes, so the id changes. Every
dismissal and every fix claim on such a unit **detaches**, and the page's finding-set
hash flips, so every page review on those pages goes stale at the same time.

This is correct behaviour and not a defect: a dismissal is a judgement about two
exact strings, and the judgement is stale when a string changes. Migration is not
possible, because the old id keys text that is no longer a unit.

But the size of the loss decides how the change is announced, and nobody knows it.

**Blocked by:** None — can start immediately. Needs Supabase access.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, question 9. Required by
`docs/adr/0001-content-unit-is-the-editable-block.md`.

- [ ] The count of live overrides, by kind, that sit on a unit which the fold will
      change. A unit is affected when it is an anchor inside a text block, or a text
      block that holds one.
- [ ] The count of page reviews that will go stale.
- [ ] Both numbers per store, because a store is the unit an editor owns.
- [ ] The numbers are written into ticket 67 and into the dated note that goes out
      with the fold.
- [ ] If Supabase is not reachable, say so in this ticket and stop. Do not estimate.
      A wrong number here is worse than none: it would be quoted later as measured.
