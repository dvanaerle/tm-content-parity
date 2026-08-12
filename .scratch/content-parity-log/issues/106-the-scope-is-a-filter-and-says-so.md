# 106 — The scope is a filter and says so

Type: task
Status: ready-for-agent
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
