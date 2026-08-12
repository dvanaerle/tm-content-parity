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
      it does today. — **overturned by round two, R5 and R2.**
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
- **The difference row is entirely a `CollapsibleTrigger`.** — **retired by round two, R1:**
  the select-all leaves the row, so the trap has nothing left to catch. It read: the
  select-all that belongs on the row is inside the control that opens it, and a plain
  checkbox there is swallowed — the click toggles the difference instead of ticking it, or
  does both.
- **A selection with no visible pages.** — **retired by round two, R1:** a selection can no
  longer be made on a closed row. It read: ticking the difference row selects pages the
  editor has not seen, which is why the bar states a count and the difference it belongs to
  rather than only a number.
- **A checkbox is not a decision.** The ledger already spends a checkbox on the tri-state
  *Opgelost* control, which **is** a decision (tickets 36 and 48). Two checkboxes, two
  meanings, one screen: the selection column needs a header word and an accessible label
  that say *select*, never *done*.
- **Existing is not trivial.** Ticket 31 shipped a `BulkControl` that referenced a
  `MuteForm` it never defined; the press threw during render and took the whole dashboard
  island down with it. 628 unit tests passed and the build was clean, because every decision
  lived in `.mjs` and nothing mounted the `.jsx`. This ticket adds a control to that same
  component, so a mounted-and-clicked test is an acceptance criterion and not a nicety.

## Round two — the build is on screen and five things are wrong with it

The first round shipped and was used. What follows is what using it found. It is the same
ticket because it is the same control: the selection is right and the surface around it is
not.

### R1 — the select-all is a checkbox in the table header, not a word and not on the row

The selection column's header cell says the word *Kies*. Put the select-all checkbox there
instead, and take it off the difference row.

Round one put it on the row so a closed difference could be ticked whole. That bought a
nested-button problem, a tri-state that had to read over pages nobody had seen, and a bar
that had to sit outside the collapsible to stay visible. None of it was worth the one
gesture it saved. **A selection is made in the list of things being selected.**

- [x] The select-all lives in the selection column's `TableHead`, and the header cell
      carries no word beside it. It keeps the tri-state of round one.
- [x] The difference row carries no checkbox. Its trigger goes back to being the whole row.
- [x] The accessible label still says *select* and never *done* — the word leaves the
      header, so the label is now the only place that trap is answered. The column keeps a
      screen-reader-only header word; a header cell with nothing in it but a checkbox
      announces nothing.
- [x] Two traps above are retired by this and marked so: *The difference row is entirely a
      `CollapsibleTrigger`* and *A selection with no visible pages*. A selection can no
      longer be made on a closed row.
- [x] The bar's copy of the search caveat goes with them. Every selection is now made with
      the list open, so the caption under it is the sentence, said once.

### R2 — a decided page can be undone, in bulk as well

`OverrideControl.jsx` offers *Ongedaan maken* on a `dismissed` or a `muted` finding. The
bulk press offers nothing at all there: round one drew the state badge and stopped. If a
press can put ten pages in a state, it has to be able to take them out of it.

- [x] A ticked page whose finding is `dismissed` or `muted` is undoable from the bar, with
      the same wording the single control uses: *Ongedaan maken*.
- [x] The undo writes the same events the single control writes, through the same rule and
      not a second copy of it: `{ scope: 'finding', action: 'cleared', findingId }` for a
      dismissal, and `{ scope: 'page-class', action: 'cleared', class, anchorHeading? }` for
      a mute — the mute undone on the key that made it, or a section mute is left standing
      and the row does not move.
- [x] **The undo takes no note**, unlike the other two presses. That is deliberate and it
      matches the single control: a `cleared` event carries no reason, and inventing a
      mandatory one here would make bulk undo harder than the undo it mirrors. This is the
      one exception to *a button, a mandatory note and a submit* above.
- [x] The undo states its count over the ticked pages it can act on, like the other two.
- [x] It is a third seam function beside `bulkDismissal()` and `bulkMute()`, tested at the
      seam and clicked in the browser project.
- [x] **The rule is one function and not two.** *"Through the same rule and not a second
      copy of it"* was written as a copy first, and the review caught it. The event now
      comes from `clearedEventFor()` in `overrides/state.mjs`, beside the `decided()` that
      attaches the key precisely so a clearing can aim at it — and `OverrideControl.jsx`
      asks the same function, so the next change to the mute key cannot land in one of the
      two callers only.
- [x] **The code says `clear`, the button says *Ongedaan maken*.** `CONTEXT.md` gives
      `cleared` the job of revoking the last override on a key and states there are no
      `un-` words, so the seam is `bulkClear()`/`offersClear()`. The Dutch label is the one
      the single control has worn since ticket 29; the vocabulary and the label are two
      different things.
- [x] **`fixed` is not undoable here**, and that is not an omission. A claim of fact has
      its own checkbox on the page (tickets 36 and 48), and a second control for one event
      would let the two disagree about what is on screen. The bar counts a ticked `fixed`
      page as one it cannot act on, exactly as the other two presses count theirs.

### R3 — the actions sit in a toolbar

The bar works and does not read as a place where things happen. Give the selection a
minimal toolbar — one strip, the count on one side and the presses on the other — so what
can be done is visible without reading a paragraph.

- [x] The actions are grouped as a toolbar rather than a run of sentences and buttons: one
      strip, the selection on the left and the presses on the right.
- [x] The actions stay **worded**. An icon-only toolbar is refused for the reason round one
      gives: an icon cannot carry the difference between a decision that expires with the
      text and one that never does.
- [x] It is in flow, under the difference, so it covers nothing and does not push the page
      list about as the selection grows. It carries **no** `role="toolbar"`: that role
      promises arrow-key navigation between its controls, and these are ordinary tab stops
      in the order the selection was made in. Claiming the role without the keyboard would
      be the worse of the two.

### R4 — the copy is far too long

Sentences like *Negeren geldt voor deze twee teksten en vervalt zodra een van de twee
verandert. Dempen geldt voor de soort in die sectie en vervalt nooit. Geen van beide dekt
een pagina die bij een volgende crawl bijkomt. Ter maat: het grootste verschil in de
grootste winkel staat op 22 pagina's, en 79 tot 91 procent van de verschillen per winkel
staat op één pagina.* are an essay above a button.

- [x] Cut the explanatory prose in `BulkControl.jsx` to what the press needs: what it does,
      to how many, and any refusal. The corpus statistics go; they were argument for the
      design, not information for the editor.
- [x] Keep the counts, the refusal sentences and the *no editor name* sentence. Those are
      the ones that change what an editor presses.
- [x] The *two eligibilities* difference between the mute and the dismissal stays said,
      but short. Round one is right that it must not be resolved by making the two agree;
      it does not need three sentences to say so.
- [x] Anything that survives as background rather than as instruction moves to a `title`,
      or to `CONTEXT.md` where the vocabulary lives. The denominator rule was already in
      the glossary, so it moved to the mute button's `title` and nowhere else.
- [x] `CONTEXT.md`'s **Bulk decision** entry is brought level with what shipped: the ticked
      selection, three presses instead of two, and eligibility rather than selection unit
      as the thing that differs between them. A glossary that contradicts the code is worse
      than one that says nothing.

### R5 — the select-all skipping decided pages is a bug

Today the select-all ticks only the pages a dismissal can act on, and a decided page can
still be ticked by hand. One control refuses what the other allows, on the same rows, for
no reason the editor can see.

- [x] The select-all ticks **every** page of the difference, decided or not. The tri-state
      then reads over the same set, which it already does.
- [x] `selectableOf()` and its all-decided special case go: with R2 there is a press for a
      decided page, so nothing is left that the exception was protecting.
- [x] A decided page stays drawn with its state, and each press still filters to what it
      can act on — the ticks say *these pages*, and each press says what it did with them.
      The dismissal keeps skipping a colleague's decision and keeps counting it as skipped.
- [x] `offersDismissal()` stops being exported with the select-all that needed it. The rule
      has one reader again — the press — and the states it lets through are pinned through
      `bulkDismissal()` rather than through a second entry point.
