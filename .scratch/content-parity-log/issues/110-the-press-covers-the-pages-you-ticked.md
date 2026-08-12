# 110 — The press covers the pages you ticked

Type: build
Status: ready-for-human
Blocked by: 31 — resolved
Parent: ../map.md

**What to build:** an editor opens a difference, unticks the two pages they are not sure
about, and the press covers the other eight. The buttons, the counts and the events all
follow the ticks.

Ticket 31 built the press as all-or-nothing, because its own opening line says *they select
the repeat* and its table gives the dismissal's unit as **a repeat**. That is what shipped:
open `missing-link · max.svg`, and the only offer is *Negeren op 10 pagina's*. There is no
way to say *these eight*. An editor who disagrees about one page has to abandon the bulk
press and decide all ten one at a time, on ten pages, which is the work ticket 31 exists to
remove.

The unit was too coarse for the mute as well. 31's own table gives that one as **pages ×
class × section** — pages, plural and chosen — and the build collapsed it to every page of
the repeat. The cost is visible today: a twelve-page `text-missing` repeat is refused
outright because **one** of the twelve carries the difference before the first heading. The
refusal is correct and the granularity is not. Ticked selection turns that wall into
*not this page*.

## What it delivers

The difference row gains a checkbox that selects every page it is on, and the page list
already inside it becomes a small table with a checkbox per row. Ticking anything raises a
bar reporting how many of how many are selected and carrying the two presses. Every count
already on screen is then counted over the ticked pages instead of over all of them.

**This replaces the whole-repeat press rather than sitting beside it.** Today the buttons
are always there and always mean *all of them*; after this they are on the bar and mean
*these*. Two ways to press one thing, differing only in whether you ticked first, is the
doubling this project keeps deleting.

**Built from `ui/table.jsx` and `ui/checkbox.jsx`, which are already installed** — two of
ticket 74's seven primitives. No `@tanstack/react-table` and no shadcn `data-table` recipe:
74 recorded the dependency count as a bound and named the seven as the limit, and the
sorting, pagination and column visibility that TanStack exists for have nothing to do on a
list whose largest instance in the whole corpus is 22 rows (ticket 81).

The seam does not move. `bulkDismissal()` and `bulkMute()` read `repeat.on` and nothing
else, so a narrowed list of pages is the entire change below the component line, and the
thirteen tests in `web/src/lib/bulk.test.mjs` keep their meaning.

- [x] The **difference row** carries a checkbox, and pressing it selects every page that
      difference is on. Each page in the opened list carries its own.
- [x] That checkbox is **tri-state**: ticked when all its pages are, unticked when none
      are, and indeterminate in between. It is a control and never a summary — it says what
      is selected, and it is the same control that changes it.
- [x] **Nothing is selected until an editor selects it.** A difference opens with no ticks,
      and the actions are not on screen until there is something for them to act on.
- [x] **Ticking writes nothing.** Selection changes only what a later press would cover.
      The press still costs a button, a mandatory note and a submit, and no path from a
      checkbox to the log exists without all three.
- [x] A **bar** appears once anything is ticked, reporting the count and carrying the two
      actions and a way to clear the selection. Its actions are **worded**: an icon alone
      cannot carry the difference between a decision that expires with the text and one
      that never does, and offering the wrong one of those two is the failure ticket 31
      names as its own.
- [x] The bar names the difference its selection belongs to, or selection is one difference
      at a time. Two open differences with ticks in both must never produce one count that
      does not say what it counts.
- [x] Both actions state the selected count, not the repeat's size: *Negeren op 4
      pagina's…*, *Dempen op 4 pagina's…*.
- [x] The dismissal writes one event per **ticked** page, and the sentence above it counts
      the same pages the events do.
- [x] The mute's coverage, its page count and the sections it names are all counted over
      the ticked pages. Unticking a page removes its section from the sentence.
- [x] A mute that is refused says **which pages** refuse it, and marks them in the table.
      Unticking exactly those pages offers the press.
- [x] An empty selection shows no bar, rather than a bar carrying buttons that would write
      nothing.
- [x] A selection made with no editor name still gets a bar, and the bar says a name is
      needed. Today that sentence stands where the buttons would be; it must not be lost
      with them, because a control that vanishes without a reason reads as a missing
      feature.
- [x] A page whose finding is already decided is drawn with its state, is not ticked by the
      select-all, and is not written for. The list says how many were left alone, the way
      it does today.
- [x] Under a **search**, the list says its pages are the ones the search found — because
      they are, and a difference may be on more.
- [x] The selection is forgotten when the difference is closed. It is a question about one
      press, not a state of the queue.
- [x] Both presses are covered by a test that **mounts the component and clicks it**, in
      the `browser` vitest project. See the trap below.
- [x] No new dependency. `web/package.json` is unchanged.

## Traps

- **Select-all under a search selects what the search found.** `searchStore()` builds its
  repeats out of matched findings only, and a term can be in one page's key and not
  another's — the union of matched fields on a repeat exists for exactly that reason. So a
  searched row saying *op 10 pagina's* is ten **matching** pages, and ticking all of them
  dismisses ten while leaving any unmatched page of the same difference open. That is the
  right behaviour and the wrong sentence if the sentence is silent.
- **One selection, two presses, two eligibilities.** A dismissal may not touch a finding a
  colleague decided; a mute's coverage deliberately **includes** decided findings, because
  `muteCoverage()` counts what a key covers and not what it changes (ADR 0008). So the same
  ticked row can be skipped by one press and counted by the other. Say it; do not resolve it
  by making the two agree, because they are not measuring the same thing.
- **The doubled figure still applies to the dismissal.** `CONTEXT.md`'s *Repeat* entry: the
  page is a term of the finding id, so pages and findings are one number and only one of
  them is printed. The mute is the exception and states two on purpose — it hides more than
  the difference pressed on, and that gap is the warning.
- **The difference row is entirely a `CollapsibleTrigger`.** So the select-all checkbox
  that belongs on it is inside the control that opens the row, and a plain checkbox there
  is swallowed: the click toggles the difference instead of ticking it, or does both. The
  checkbox has to stop the click from reaching the trigger, and it has to keep working from
  the keyboard, where Space and Enter on the row mean *open* and Space on the checkbox means
  *tick*. This is the one place in the ticket where the obvious markup is wrong.
- **A selection with no visible pages.** Ticking the difference row selects pages the editor
  has not seen — the row can be closed. That is the point of it, and it is also why the bar
  states a count and the difference it belongs to rather than only a number.
- **A checkbox is not a decision.** The ledger already spends a checkbox on the tri-state
  *Opgelost* control, which **is** a decision (tickets 36 and 48). Two checkboxes, two
  meanings, one screen: the selection column needs a header word and an accessible label
  that say *select*, never *done*.
- **Existing is not trivial.** Ticket 31 shipped a `BulkControl` that referenced a
  `MuteForm` it never defined; the press threw during render and took the whole dashboard
  island down with it. 628 unit tests passed and the build was clean, because every decision
  lived in `.mjs` and nothing mounted the `.jsx`. This ticket adds a control to that same
  component, so a mounted-and-clicked test is an acceptance criterion and not a nicety.
