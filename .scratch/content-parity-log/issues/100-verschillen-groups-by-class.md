# 100 — Verschillen groups by class

Type: task
Status: resolved 2026-08-12 — built, every criterion met, and **the word "section" is
refused**: it is the mute scope already. The concept is a **class group**. See the answer.
(That reason expired on 2026-08-13 with ADR 0011; the refusal stands on other grounds. See
the answer.)
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

- [x] The repeats arrive grouped by class, each section labelled with its class and its
      repeat count.
- [x] Section order is the closed class vocabulary's order, not the counts. A section
      that moves position as work is done is a section nobody can learn.
- [x] Sections start closed, except that a lone non-empty section opens — a closed single
      section is a click that asks nothing.
- [x] Within a section, the worst-first repeat order is exactly the order of today's
      ungrouped list.
- [x] The rendering budget is per section rather than one number for the whole list, and
      the *volgende 100* control belongs to the section it pages.
- [x] A class with no repeats is present and says so, so that "nothing wrong here" is
      distinguishable from "this class does not exist".
- [x] With a class filter on, only the selected classes' sections render, and they are
      open. The filtered repeat set is identical to what the filter alone yields today.
- [x] The grouping is a pure derivation over the repeats 81 already derives. No second
      grouping of findings, and `Repeat.on` keeps exactly the keys the view tests pin.
- [x] Opening or closing a section moves no count, no bar and no denominator. The repeat
      total across all sections equals the ungrouped total, and the existing test for the
      no-count-moves rule passes unchanged.
- [x] With the noise toggle on, hidden classes appear as their own sections rather than
      mixed into the visible ones.

## Traps

- **Open state is not filter state.** It is session state in the component, not
  persisted, not in the url, and absent from the amber strip. The moment it appears in
  the strip there are two filters, which is what 36 closed.
- **Do not hide the tail.** Roughly 17% of repeats are singletons. Grouping makes them
  navigable; it does not get to decide they are not work.
- Sorting by score is not this ticket and is not possible today — a repeat carries no
  score. That is a data change, not a presentation change.

## Answer

**Built 2026-08-12.** *Verschillen* arrives as a **class group** for each class of the
closed vocabulary. `groupRepeatsByClass()` in `web/src/lib/view.mjs` is the whole
judgement, and it is a pure derivation over the repeats 81 already makes: it buckets them,
orders the buckets by `Object.keys(FINDING_CLASSES)`, and says which groups open on load.
It re-sorts nothing, so a group is a slice of today's ungrouped list — `Repeat` and
`Repeat.on` gained no field, and the existing shape tests pass unchanged.

`ClassGroups` in `web/src/components/Repeats.jsx` draws it. Which group is open is a list
of class names in `useState` and nothing else: not persisted, not in the url, absent from
the amber strip.

**The word "section" is refused.** ~~`CONTEXT.md` already spends it on the mute scope — a run
of one page under an anchor heading, `docs/adr/0008` —~~ and one word with two meanings is
what that glossary exists to stop. — **2026-08-13, [ADR
0011](../../../docs/adr/0011-the-mute-is-withdrawn.md): the reason is gone and the refusal
is kept.** `CONTEXT.md` no longer spends *section* on the mute scope, because there is no
mute scope, so the word is technically free. It stays refused anyway: **class group** is in
the code, in the glossary and in this ticket's answer, and renaming a built concept to
reclaim a word nobody needs is churn. If *section* is ever wanted, it is a new ticket
against a built screen. This ticket's own wording asked for sections; the concept
it describes is kept and the name is not. `CONTEXT.md` now carries **class group** as a
term, because the concept was in the code and in no glossary.

**Two of the ticket's rules collide, and the pills win.** *Sections open one at a time*
against *with a pill on, the selected sections are open*: two pills mean two groups open at
load. Answering a two-class filter with one class drawn open would be the queue disagreeing
with the control that narrowed it. So one-at-a-time governs the **clicks** — a click
collapses the rest — and re-toggling a pill restores the pair.

Two things the ticket did not ask for, both forced by its own rules:

- **A class outside the vocabulary is drawn last rather than nowhere.** Nothing reaches the
  function today that is not in `FINDING_CLASSES` — `loadSummaries()` filters on it — but a
  group list built from the vocabulary alone drops such a row off the screen while the
  footer keeps counting it, so the reader meets *40 verschillen* over 38 rows. The failure
  had to be loud, not silent, which is the *do not hide the tail* trap in the one form it
  can still take.
- **The search keeps the flat list.** `Repeats` is the flat reading and `ClassGroups` the
  grouped one, both over one `RowList`, one empty state and one footer. A search answers
  past the classes — the term is the grouping the editor asked for — so grouping its result
  by class would be a second grouping over one answer.

**The budget belongs to the group and not to the open episode.** It was written inside
`RowList`, which a closed group unmounts, so paging `copy` to three hundred rows and
glancing at `casing` discarded the paging. It is now held in `ClassGroups` per class, which
is what *the budget is per section* has to mean to be worth anything. Found in review.

**The noise criterion is met by construction and is not reachable yet.** Grouping is by
class, so a hidden class lands in a group of its own and can never mix into a shown one; an
empty hidden class is drawn nowhere, because it is an answer nobody behind the toggle asked
for. The dashboard has no noise toggle to switch on — `loadSummaries()` keeps the shown
classes only — so the behaviour is pinned by test and waits for the surface.

**An empty group states no number.** *Each section labelled with its class and its repeat
count* is answered by the sentence *geen verschil van deze soort in deze winkel*, and
*0 verschillen* beside it would say one thing twice. It is also not a trigger: there is
nothing behind it to open.

**Measured on the build.** 823 pages, all six dashboards among them. `dist/nl/index.html`
holds twelve closed groups in its server-rendered output, and `dist/fr/index.html` holds
eleven plus one empty class saying so — which is the distinction the sixth criterion asks
for, visible in the shipped HTML. 585 tests pass.

The build was broken for a while during this work — `/` failed to prerender with
`ERR_MODULE_NOT_FOUND` on a `.astro/.prerender` chunk. It was not this ticket's: it
reproduced with this ticket's one new import removed, and it cleared when the ticket 74
work sharing the working tree was committed.
