# 09 — A class on its own is a query

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

A class an editor can name is a list they can open.

Today the term decides what matched and the class pills narrow that result afterwards. So a pill
with an empty box matches nothing: an entry whose matched fields are empty is skipped, and with
nothing typed and no page scope, every entry's are. An editor who is looking straight at a
*Broken link* row and wants the rest of them has to type a word to get started, and there is no
word — the class is the thing they mean.

After this ticket the class is a **selector** as well as a filter. With the box empty and the
*Broken link* pill on, the search returns that class's repeats.

This is the per-store search. It changes what a pill alone does on the screen an editor already
uses, and it is the change ticket 03's all-stores screen then inherits for free.

## Criteria

- [ ] **Three things can open a result**: words, a page scope, a class. Any one of them on its own
      returns what it selects.
- [ ] **None of them on still draws nothing.** The empty box keeps meaning the empty box. The
      refusal that ships today is narrowed and never removed.
- [ ] A term and a class together narrow exactly as they do now. The term decides what matched,
      the classes decide which of it is on screen.
- [ ] A row selected by its class alone **reports no matched fields**. It matched no field, and
      what it matched on is the pill, which is on screen.
- [ ] The narrowing derivation is untouched: the pills still apply after the grouping, through the
      derivation the two views share. Only which entries reach the grouping changes.
- [ ] An `information` class opens exactly as a `work` one does. Its rows are read and never
      decided, as they are everywhere else.
- [ ] The result says how many findings on how many pages, counted off the list that is drawn.
      No bar, no denominator, no closed count.
- [ ] The comment on the empty-box guard is **rewritten and not deleted**, so the next reader
      learns what the guard still refuses rather than that it was once there.
- [ ] `npm test`.

## Traps

- **The guard is load-bearing.** It is what makes a bare page scope a hit on the page name. Read
  what it says before narrowing it: the case it protects is not the case this ticket opens.
- **Do not invent a matched field.** A class-selected row has none. Filling one in so the row
  looks like the others is a lie about why it is on screen, and the search's own tests are the
  place that lie will not show up.
- **A class query can be long.** A hidden class runs to hundreds on one store. Draw it and count
  it as any other result. It is not paged, not capped and not a queue the tool remembers.
- **A class query is not a saved queue.** The tool does not record that it was drawn, does not
  count it down and does not assign it. A screen is what is drawn and never a plan.
- **No new URL parameter.** `classes` is already in the contract and already survives a copy. A
  class query is that screen with `classes` set and `query` empty, which the contract can write
  and read today. Only what it draws changes.
- **Search narrows; it moves no count.** The rule holds here as everywhere.

## Where it came from

The user, 2026-08-19, on the all-stores search: *"If I press on 'Broken link', does it search every
store for broken links?"* The PRD did not say so. Class pills were written as a narrowing of a
result and never as a thing that produces one, and the search function refuses an empty box on
purpose. This ticket is the first half of the answer; the press itself is ticket 03.
