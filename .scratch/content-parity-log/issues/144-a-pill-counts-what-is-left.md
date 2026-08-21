# 144 — A pill counts what is left

Type: task
Status: resolved 2026-08-21 — the two pure functions are `repeatsWithOpenWork()` and
`classCountsByOpenWork()` in `web/src/lib/view.mjs`, taken in `useWorstFirst()` and on the
dashboard's pill strip. ADR 0029 is written, `CONTEXT.md` is amended in three places, and 141
carries the superseded-for-*Repeats* note.
Blocked by: nothing.
Parent: ../map.md

An editor works through the differences of one class on a store's *Repeats* list and
finishes them. Nothing on the screen says so.

The rows they decided are still there reading *2 of 2 closed*, sitting under the rows with
work left. The pill above still reads the number it read this morning. Pressing a pill can
open a list with **no difference found** in it, because the pill counted a snapshot and the
log has moved on since. The only thing that makes any number on the screen agree with the
work done is a recrawl.

So the screen answers *what did this crawl find* while the editor is asking *what is left*.

## What to build

A pill says how much open work of its class is left, read live from the log, and a class
with nothing left draws no pill. The *Repeats* list gains ***Include closed***, default off,
so a fully-closed difference is off the screen — and the closed pages inside an expanded
difference go with it.

Decide the last finding of a difference and the pill ticks down at once. The row itself goes
*2 of 2 closed* and **stays where it is**; it is gone the next time the list opens.
**Numbers are readings and move; membership is a position and is held.**

## The two numbers that disagree, and why it is not a refresh bug

The dashboard reports `Case or punctuation 40` over a list whose group header says *52
differences*. Neither number is stale with respect to the other: they count different things
over different corpora.

- The pill sums `summary.byClass` over **this store's** comparable pages. Unit: findings.
- The list is `repeatsInStore()` over this store's comparable pages **and the comparable
  sibling's** (ticket 03). Unit: differences, over the language block.

A second count made to agree with the first would drift again the next time either moved. The
fix is that the pill reads **the same list the rows come from**, so the agreement is by
construction: one derivation, one corpus, and the unit stated.

## The unit is the finding, and the corpus is the block

**Findings**, because that is the unit of a decision, and it is what the bar and *N of N
closed* already speak. 52 rows can hide 104 decisions, and *52* would tell an editor they
have half the work they have.

**The language block**, because the pill sits above that list and must describe it. This is a
**reading** and not a press, so ADR 0021 permits it — *reading may cross any store; pressing
may not*. The progress bar and the page chips stay the **store's**. That asymmetry is
deliberate: a pill above the repeat list describes the list, a bar describes the store, and
the ADR is where it is argued rather than left for a reader to find surprising.

## Live, and held

`useWorstFirst()` becomes the one place answering three questions off **one reading of one
bar**: whether a row is drawn, where it sits, and what its *N of N closed* says. Membership
joins position in the held reading and is re-taken when the list's identity changes — the
existing `sameRows()` comparison and the existing remount triggers, plus *Include closed*.

The **pill count is not held.** It reads the live log on every decision. That split is the
whole of the timing rule and the reason the two cannot be one memo: a held count is a stale
number, and a live membership is a row moving out from under the editor's hand.

The precedent is already written: ticket 141 holds a position for this reason, and the context
marker's collapse set is *taken when the page opens* for the same one — *a tick that collapsed
its own row would move a 168-row page under the editor at the moment they act on it*. This
ticket adds no third timing rule; it puts membership on the side position is already on.

## What ticket 141 decided, and what this overturns

141 shipped *"Nothing is removed and no number moves. A difference settled on all thirty pages
stays on the list reading 30 of 30 closed; it sinks below every difference with work left."*

That is exactly what is being overturned, for the *Repeats* list and for nothing else. Sinking
was the right first move — it is the safe direction to be wrong in, the same way ticket 79
shipped `collapses()`'s first term only — and the measurement since is that a sunk row is
still a row an editor scrolls. 141's answer takes a superseded-for-*Repeats* note in the manner
it gave one to 81, so a future reader does not find the old rule reading as current.

**141's order survives intact.** Worst-first on open findings still decides where the
surviving rows sit, and its fallbacks are untouched.

## Where this changes nothing

- **The search screen.** `searchStore()` already drops an inactive entry unless *Include
  closed* is on. A fully-closed difference is already absent from a result. Do not write this
  as if search were broken; the ticket closes the gap on the **third** surface.
- **The content view.** The context marker already collapses a row whose finding is Closed.
- **The progress bar, the page chips, the roll-ups, the Ledger.** Snapshot-shaped and
  store-scoped, and they stay that way. The Ledger remains the home for *what did we decide*.
- **What the log counts.** No finding changes state differently, no class moves, no finding id
  changes, no press writes anything new, and no denominator moves.

## Criteria

- [ ] A class pill counts the **open findings** of its class, read from the log, over the
  **language block's** repeat list — the same list the rows below it come from.
- [ ] The pill's number falls the moment a finding is dismissed or claimed fixed, with no
  recrawl. A **contradicted** claim still counts as open, because the bar reads it as open.
- [ ] A class with no open work **draws no pill**. Pressing a pill can no longer answer *No
  difference found*.
- [ ] An `information` class keeps its pill whatever the log says: a finding you can link to
  and cannot decide is not work that can close.
- [ ] The pill row is drawn from a **pure** function over the repeat list, taking the open
  count as an argument in the manner `repeatsByOpenWork()` established — `view.mjs` never
  reaches for the override log.
- [ ] It returns `classCounts()`'s existing `{ class, count }[]` shape and sort, so
  `ClassFilterPills` takes no new prop and a zero-open class is **absent** rather than
  special-cased in the component.
- [ ] A difference with **nothing open** is off the *Repeats* list.
- [ ] **A row does not leave under the editor working in it.** Closing a difference's last
  finding re-counts the row to *2 of 2 closed* and re-seats and removes nothing; it is gone on
  the next open of the list. Membership and position come off **one** held reading.
- [ ] A **partly**-closed difference stays, and still says how many of it are closed.
- [ ] The **closed pages inside an expanded difference** are hidden under the same control.
- [ ] ***Include closed*** is on the *Repeats* view, default off, and brings every hidden row
  and hidden page back.
- [ ] With it on, a class holding only closed work draws a pill reading `0` — the only way
  into a fully-decided class's rows. The pill's **number** never depends on the control; only
  a zero pill's presence does.
- [ ] The pill says the **open** count whatever the control says. A filter still moves no
  count: what moved this one is the log.
- [ ] *Include closed* is part of the dashboard **screen** — in the URL, restored by Back,
  carried by a copied link — in the manner the sort and the priorities belong to *Pages*.
- [ ] It joins the term, the scope and the classes in the **remount key** of the flat
  selection: it can take a ticked row off the screen, and ADR 0022's rule is that a selection
  never outlives the question it was made in.
- [ ] A class **group** with nothing open is not drawn, and a group header's *N differences*
  counts the differences **drawn**. Expect this to fall out of the row rule, since
  `groupRepeatsByClass()` already draws only the classes that hold something — assert it
  rather than build it.
- [ ] 141's worst-first order still holds over what is left on screen, fallbacks unchanged.
- [ ] On an **unread log** every pill shows its full count and nothing is hidden: an unread
  log means *nothing decided*, never *nothing left*.
- [ ] The pill hint no longer says *"The counts above do not change"*, on either the repeats
  branch or the pages branch. The pill's number is a property of the store's work and not of
  the view under it, so it reads the same on both views and the hint says so on both.
- [ ] **ADR 0029** argues the two decisions that span this change: a pill reads the log while a
  bar reads the snapshot, and a pill counts the block while the bar counts the store.
- [ ] `CONTEXT.md`'s *Filter* entry keeps its rule and gains the distinction that what moves a
  pill's count is the **log** and never the filter.
- [ ] `CONTEXT.md`'s *Class group* entry loses the stale sentence claiming a `work` class with
  no repeats draws a group that says so — `groupRepeatsByClass()` stopped doing that, and a
  second false statement about empty classes is not wanted beside a new true one.
- [ ] 141 carries the superseded-for-*Repeats* note.
- [ ] `npm test` passes, including the repeat, dashboard, search and screen-url suites.

## Tests

A good test here asserts what an editor sees, in the editor's own words, and never how the
number was reached. Ticket 141 is the model: a pure test for each rule that can be stated
without a log, and a mounted test for every rule that is about the log arriving.

- **`view.test.mjs`** — the two new pure functions. A repeat with zero open is dropped and one
  with any open survives; the tally is per class over **findings** and not rows; a class wholly
  closed has no entry; the sort matches `classCounts()`'s, so the pill row does not resequence.
  Prior art: the `repeatsByOpenWork` block, the same shape over the same argument-passed count.
- **`Repeats.browser.test.mjs`** — the row that **stays**: hand the log in again with a
  difference's last finding closed, and the row is still in place while its own words go to
  *2 of 2 closed*. The row that **goes**: remount with that log and it is absent. *Include
  closed* brings it back. A partly-closed difference is present in both states. The closed
  pages inside an expanded difference are absent by default and present with the control on.
  Prior art: the *order of the list* block, which already mounts on an unread log and hands the
  log over afterwards — the exact manoeuvre these need.
- **`Dashboard.browser.test.mjs`** — the pill number falls as the log arrives holding closed
  findings; a class with nothing open draws no pill; with *Include closed* on it is back
  reading `0`; the pill counts the **block** while the progress bar still counts the **store**,
  asserted in one test because their disagreement is the point; on an unread log every pill
  shows its full count.
- **`Search.browser.test.mjs`** — a regression asserting **no change**. Its value is that a
  reader sees the surface was considered and deliberately left alone.
- **`screen-url.test.mjs`** — *Include closed* is written on the *Repeats* view with no query
  and no classes, is still not written where nothing is searched and *Pages* is the view, and
  round-trips through a parse. Prior art: the cases for the sort and the priorities belonging
  to *Pages*.

**Do not pin the figure.** A test asserting `32` teaches nothing about the rule and breaks
when a fixture gains a page. Assert relationally: the pill fell by the number of findings
closed; the pill and the group header count one corpus.

## Traps

- **The first paint is the whole risk, and here it fails *loudly wrong* rather than silently.**
  141 was nearly lost to it: the dashboard paints before the events arrive, `events` is `null`,
  `byFinding` reports every finding open, and a reading taken then is an all-open reading held
  for the life of the list. In this ticket a pill showing the full count on an unread log is
  the **correct** answer — so the pills would look right while the row hiding never engaged.
  `logRead` is the guard and it wants an explicit test that mounts unread.
- **Do not hold the count.** Position and membership are held; the number is live. Taking all
  three from one frozen reading would make a row say yesterday's figure, which is 141's own
  trap one step over.
- **Do not re-key the row.** The selection is one flat set of finding ids over the whole list;
  rows leaving must not disturb which ticks are held, and a `key` taken from a position would.
- **Nothing leaves the denominator.** The open count obeys the page bar's rules — a dismissal
  enters the numerator, a contradicted claim reads as open — and presence, position and the
  printed count are taken off that one bar and never off a second count of its own.
- **The lookup into the log is left to throw.** Skipping a missing id would quietly lower a
  denominator; now it would also quietly remove a row.
- **`occurrences` is not the number.** The same difference twice on one page is one finding's
  worth of open work.
- **"Check-off" does not enter the vocabulary.** The tick on a repeat row is the **bulk
  selection** tick; the two things that close a finding are a **dismissal** and a **claimed
  fix**, both in the **Closed** bucket. A third word, spelled like the control that does
  something else, is what `CONTEXT.md` exists to prevent.

## What is refused

- **A fourth surface for closed work.** A fully-decided class is deliberately unreachable *by
  pill*. The Ledger is the home for *what did we decide*; *Include closed* is for auditing a
  class you are already inside. If that bites, the fix is the Ledger filtering by class, not a
  pill that exists to say nothing.
- **Live counts in general.** The snapshot's numbers are citable precisely because they do not
  move. Only the class pill's number becomes live.
- **Hiding pages with no open work on the page list.** The same idea one axis over, with a
  different denominator argument. Its own ticket.
- **A second sort control on *Repeats*.** Refused by 141 and still refused.

## Where it came from

A reader's report on 2026-08-21, with a screenshot of the dashboard's *Repeats* view: fifteen
`Case or punctuation` rows, every one *2 of 2 closed*, under a pill that had not moved. Two of
the four things reported turned out to be deliberate and written down — 141's sink-not-hide,
and the pill reading a snapshot — and one, *"the differences are the findings"*, is the
page-count-is-finding-count equivalence read one step too far.

## Answer — 2026-08-21

Built.

**Two pure functions, both taking the open count as an argument** in the manner
`repeatsByOpenWork()` established, in `web/src/lib/view.mjs`:

- `repeatsWithOpenWork(repeats, openOf, { includeClosed })` — a difference with nothing open is
  off the list. It needed no `information` case: a repeat is built out of the `work` findings a
  summary carries, so a class that cannot be decided is not in the list to be removed from it.
- `classCountsByOpenWork(repeats, openOf, { tally, includeClosed })` — the pill row. It returns
  `classCounts()`'s own `{ class, count }[]` and order, so `ClassFilterPills` took no new prop
  and a zero-open class is **absent** rather than special-cased in the component.

`tally` is the one thing the ticket did not anticipate, and it is the `information` criterion's
answer. The pill strip counted `summary.byClass`, which holds **every** class, while the repeat
list holds `work` only — `loadSummaries()` filters on `isWork()`. So a pill row derived purely
from the list would have silently dropped `text-added`, `price` and the other eleven. The
function therefore takes the snapshot tally and uses **only its non-`work` entries**: those are
the classes this list cannot hold, no decision can close them, and the snapshot's figure is the
live figure. Its `work` entries are ignored on purpose — the list is the answer for those, and
taking the larger of two numbers is how the pill and the rows would come apart again.

**`useWorstFirst()` answers three questions off one reading.** It returns
`{ rows, closedPages }`: which rows are drawn, where they sit, and which pages inside them are.
The count is **not** held — the row's *N of N closed* and the pill's number are both live — and
`byFinding` stays out of the memo's dependencies, which is 141's rule unchanged. `closedPages`
is a set of finding ids off the **held** reading, so a page does not leave an open table under
the editor who just decided it: the same timing rule as the row, one step in.

**The pill is live and the bar is not.** The dashboard recomputes the strip on every decision —
`log.byFinding` is in the dependencies deliberately — over `repeats` and not `shownRepeats`, so
narrowing to one class does not empty the other pills. It reads `openWorkIn()`, exported from
`Repeats.jsx`, which is `barFor()` and therefore the **same bar** the row prints from.

### Where the ticket's shape had to change

- **The flat list a search draws hides nothing**, and takes no `includeClosed`. `searchStore()`
  has dropped an inactive finding before it groups since ticket 09, so a fully closed difference
  is already absent — and with *Include closed* on there, the settled rows are what the editor
  asked for. Hiding them again would have been a third rule on a surface the ticket says to
  leave alone. `hidesClosed` is therefore an option on `useWorstFirst()`, and only `ClassGroups`
  passes it.
- **The selection's denominator follows the drawn pages.** A select-all on a partly settled
  difference reported *2 of 3 pages* — a page off the screen inside the number a press is
  about, which is ADR 0022's own trap. `FlatSelection` now narrows the differences it hands its
  controls once, and the bar, the one-difference sentence and the *is this a wide press* test
  all read that. The **row's** bar still counts the whole difference: nothing leaves a
  denominator.
- **`SelectAll` takes pages and no longer a repeat**, for the same reason and in one place: the
  tick reaches the drawn pages and its label counts the same ones.
- **An empty queue says so in its own words.** With everything decided, *Repeats* drew an empty
  table under a footer reading *0 differences over 0 findings*. It now says *Every difference
  here is closed. Include closed to read them.* — a different sentence from *No difference
  found*: nothing **left** and nothing **there** are two answers, and this is the one the log
  earned.
- **The pill hint's second sentence is the same on all three branches**, searching included. The
  ticket names the repeats and pages branches; the search branch drew the same strip with the
  same number, and leaving one of the three saying *the counts above do not change* would have
  been the drift the shared constant exists to stop.
- **`Dashboard` takes an optional `port`.** The whole of this ticket is *what happens when the
  log arrives*, and `useStoreOverrides()` built its own port from the environment, so the screen
  could not be handed a log at all. Module mocking is refused by the lint rules
  (`anti-slop(no-module-mocking)`) and rightly so; the seam is dependency injection through the
  real interface, which `createOverridesPort()` already opens one layer down for its own paging
  test. It is `null` in the application.

**The two numbers now agree by construction.** The pill and the rows below it are one derivation
over one corpus, and ADR 0029 argues the two decisions that span the change: a pill reads the
log while a bar reads the snapshot, and a pill counts the block while the bar counts the store.

### Tests

- **`view.test.mjs`** — `repeatsWithOpenWork` and `classCountsByOpenWork`: a zero-open
  difference is dropped and a partly closed one survives, *Include closed* returns the list
  whole, the tally is per class over **findings** and not rows, a wholly closed class has no
  entry, a zero pill appears only with the control on, a class the list cannot hold keeps the
  snapshot's figure, and the order is `classCounts()`'s.
- **`Repeats.browser.test.mjs`**, *a difference with nothing left in it* — the row that
  **stays** and re-counts itself to *3 of 3 closed*; the row that is **gone** on the next open;
  *Include closed* bringing it back; a partly closed one still saying *1 of 3 closed*; the
  unread log, asserted by watching the hiding **start** when the log arrives, because a full
  count on an unread log is the correct answer and the failure would otherwise be silent; and
  the empty-queue sentence.
- **`Repeats.browser.test.mjs`**, *the pages inside a difference that is partly closed* — only
  the pages with work left are drawn, all of them with the control on, and the select-all ticks
  and counts the drawn ones.
- **`Dashboard.browser.test.mjs`** — the pill falling as the log arrives, at its full count on
  the paint before it; a class with nothing open drawing **no** pill; that class reading `0`
  with *Include closed* on; the pill counting the **block** while the strip counts the
  **store**, asserted in one test because their disagreement is the point; and the control
  offered over *Repeats* and not over *Pages*.
- **`Search.browser.test.mjs`**, *closed work in a search result* — a regression asserting **no
  change**, so a reader sees the surface was considered.
- **`screen-url.test.mjs`** — *Include closed* written on *Repeats* with nothing typed and no
  pill on, still not written where nothing is searched and *Pages* is the view, and a round trip
  through a parse.

No figure is pinned to a fixture anywhere: every claim is relational.

`npm test`: 1,449 passing, 66 files. Typecheck, lint and `npm run build` clean.

### What the review changed

Both axes were reviewed before this landed, and five things moved:

- **The empty-queue sentence is the glossary's.** It read *Every difference here is closed*,
  which is a third wording for a concept `CONTEXT.md` already owns: **no open work**, which a
  scoped search says about a page holding differences it has closed every one of. It now says
  that, over a list instead of over a page, and the Dashboard entry records it.
- **One name and one polarity for the control.** `useWorstFirst()` took `hidesClosed` and
  inverted it into `includeClosed` one line down — two names for one bit. It takes
  `includeClosed`, required rather than defaulted, so a caller has to say which screen it is
  drawing.
- **`repeatsWithOpenWork` became `repeatsWithWorkLeft`.** One preposition from
  `repeatsByOpenWork`, called on the adjacent line, and one of them narrows while the other
  orders.
- **One spelling of the drawn-pages filter.** `drawnPagesOf()`, read by the row that draws the
  table and by the selection that says how many pages a press is about — said twice, a
  select-all could come to tick a page the row did not draw.
- **The group rule is asserted.** The criterion asks for an assertion rather than a build, and
  the first pass left it to fall out unwatched: a class the log has emptied now has a test
  saying it draws no group, and that the header counts the differences drawn.

Two review findings were **declined**. `CONTEXT.md`'s stale *Class group* sentence is struck
through with an amendment rather than deleted, which is the device the *Filter*, *Dashboard* and
141 amendments all use — a struck sentence is not a second statement, and the record of what
changed is worth keeping. And `openWorkIn()` stays exported from `Repeats.jsx` rather than
moving to `view.mjs`: it reads the log's index, and *the open count is asked for and never
derived in `view.mjs`* is the rule this ticket inherits from 141.

### What was not built

- **A fourth surface for closed work.** A fully decided class stays unreachable by pill.
- **Live counts in general.** Only the class pill's number is live.
- **Hiding pages with no open work on the page list**, and **a second sort control on
  *Repeats***. Both still refused.
- The amber filter strip's *n of m differences* still counts the class filter's effect and not
  the hiding, because that is what the strip is about: it says a **filter** is on, and *Include
  closed* is not one.
