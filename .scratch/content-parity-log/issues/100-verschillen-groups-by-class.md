# 100 — Verschillen groups by class

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor opens a store, lands on *Verschillen* as they do today, and
sees the store's repeats collapsed into sections by class — one section a class, each
carrying its count — instead of one undifferentiated column. Sections open one at a
time. The list is already sorted worst-first, so this changes nothing about which work
is on top; it changes how much of it arrives at once. Six or so numbers, and the editor
chooses which kind of difference to work through.

The class pills stay the one filter. Opening a section is not a filter: it never enters
the amber strip and *filter wissen* does not touch it, because it changes what is drawn
and never what is included. When a pill is on, its section is open and the unselected
sections are not drawn at all, so the two controls cannot tell different stories.

The default view does **not** change. *Verschillen* is the queue 81 established, and
landing on *Pagina's* instead would swap a budgeted wall for the page table's unbudgeted
one.

- [ ] The repeats arrive grouped by class, each section labelled with its class and its
      repeat count.
- [ ] Section order is the closed class vocabulary's order, not the counts. A section
      that moves position as work is done is a section nobody can learn.
- [ ] Sections start closed, except that a lone non-empty section opens — a closed single
      section is a click that asks nothing.
- [ ] Within a section, the worst-first repeat order is exactly the order of today's
      ungrouped list.
- [ ] The rendering budget is per section rather than one number for the whole list, and
      the *volgende 100* control belongs to the section it pages.
- [ ] A class with no repeats is present and says so, so that "nothing wrong here" is
      distinguishable from "this class does not exist".
- [ ] With a class filter on, only the selected classes' sections render, and they are
      open. The filtered repeat set is identical to what the filter alone yields today.
- [ ] The grouping is a pure derivation over the repeats 81 already derives. No second
      grouping of findings, and `Repeat.on` keeps exactly the keys the view tests pin.
- [ ] Opening or closing a section moves no count, no bar and no denominator. The repeat
      total across all sections equals the ungrouped total, and the existing test for the
      no-count-moves rule passes unchanged.
- [ ] With the noise toggle on, hidden classes appear as their own sections rather than
      mixed into the visible ones.

## Traps

- **Open state is not filter state.** It is session state in the component, not
  persisted, not in the url, and absent from the amber strip. The moment it appears in
  the strip there are two filters, which is what 36 closed.
- **Do not hide the tail.** Roughly 17% of repeats are singletons. Grouping makes them
  navigable; it does not get to decide they are not work.
- Sorting by score is not this ticket and is not possible today — a repeat carries no
  score. That is a data change, not a presentation change.
