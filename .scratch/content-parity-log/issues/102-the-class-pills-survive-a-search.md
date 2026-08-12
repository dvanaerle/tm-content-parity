# 102 — The class pills survive a search

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor filters the store to one class, types a term, and the filter
is still on. Today typing switches the class pills off entirely — the pills disappear,
the amber strip disappears, and the search answers over every class as though no filter
had ever been set. The editor's answer to *which kind of difference am I working on* is
silently discarded the moment they ask a second question.

After this, a search narrows within the filter. The pills stay visible and usable while
searching, the amber strip stays up, and the result set is what the term and the classes
agree on.

This is the bypass 36 and 12 already named. It is worth doing on its own merits, and it
is also what makes 106 cheap: a scope chip has nowhere to live until the strip survives a
search.

- [ ] The class pills remain visible and operable while a term is in the box.
- [ ] Search results are narrowed by the active classes. A term plus a class yields what
      both agree on, and never more.
- [ ] The amber strip stays up while searching and says what it says everywhere else.
- [ ] *Filter wissen* works during a search, clears the classes, and leaves the term
      alone.
- [ ] Changing the class selection while searching re-answers the same term against the
      new selection, without the editor retyping.
- [ ] With no classes selected, a search returns exactly what it returns today. This
      ticket adds a narrowing; it removes none.
- [ ] The narrowing runs through the existing class-filter derivation. No second
      implementation of what a class filter means.
- [ ] No count, bar or denominator moves — the rule 36 pinned holds for the two controls
      composed, not just for each alone.

## Traps

- **One filter, not two.** The classes are the filter; the term is a search. Composing
  them must not turn the term into a second thing that appears in the amber strip — that
  arrives deliberately in 106, for the scope, and not by accident here.
- The *inclusief afgesloten* option is search-only and stays that way. It is not a class
  filter and does not belong in the strip.
- Search results group by repeat first and then by page. Narrowing by class must not
  quietly regroup them.
