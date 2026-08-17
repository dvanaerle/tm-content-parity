# 106 — The scope is a filter and says so

Type: task
Status: resolved 2026-08-17 — merged into 104 as part C. Not built; the work is unchanged and it moved.
Blocked by: 103, 102
Parent: ../map.md

**What to build:** a page scope stops being invisible punctuation inside a text box and
becomes a chip beside the class pills, named in the amber strip like every other
narrowing, cleared by *filter wissen*.

`CONTEXT.md` defines a filter as a narrowing of what is on screen that moves no bar, no
denominator and no count, and says so with an amber strip for as long as it is on. A page
scope is precisely that. Leaving it as raw text means the strip enumerates the small
narrowings and omits the largest one — a strip that is wrong about what is filtering the
screen is worse than no strip.

The price is that clearing the chip rewrites the search box, because the chip owns a
fragment of an input. That is accepted: an editor who presses *filter wissen* is asking
for the whole store back, and a scope silently surviving that is the more surprising
outcome.

This ticket also amends the **Filter** entry in `CONTEXT.md`, which today reads as though
narrowing by class is the only kind there is.

- [ ] An active page scope appears as a chip beside the class pills.
- [ ] The amber strip names the scope while it is on, alongside any classes.
- [ ] *Filter wissen* clears the scope and the classes together, and the search box loses
      the scope while keeping any remaining term.
- [ ] Dismissing the scope chip alone clears the scope and leaves the classes and the term
      alone.
- [ ] Editing the scope in the box updates the chip, and the two never disagree. The box is
      the source of truth; the chip is a reading of it.
- [ ] A scope and a class filter compose — the result is what both agree on — building on
      what 102 established for the term.
- [ ] The scope moves no count, no bar and no denominator, and the existing test for that
      rule passes unchanged.
- [ ] `CONTEXT.md`'s **Filter** entry admits page scope as a kind of filter, with the same
      session-only life and the same amber strip.

## Traps

- **The noise toggle is not the precedent here.** It survives *filter wissen* because it
  changes what counts as a finding. A scope only changes what is on screen, so it is a
  filter and it clears.
- Two sources of truth for the scope is the failure mode. The chip must derive from the
  parsed term rather than hold its own copy.
- *Inclusief afgesloten* is still not a filter and still does not belong in the strip.

## Answer

**Merged into [104](104-a-scoped-search-says-which-kind-of-nothing.md) as part C, 2026-08-17.**
Nothing here is withdrawn and nothing is built. This ticket and four others were five
tickets over one search box — one scope value, one load-time page list, one component
tree — and not one of them moves a count, a bar or a denominator. The runbook's rule is
*batch freely inside a gate*, and there was no gate between them to batch across. 104 now
carries the filter chip as part C, with every criterion and every trap from this file
copied across, and lands as its own commit on 104's branch.

Read 104. This file is kept as the record of where the work was written.
