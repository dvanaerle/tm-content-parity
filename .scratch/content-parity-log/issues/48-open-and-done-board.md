# 48 — A row collapses when it holds no open work

> The board is refused. The title above replaces *"Openstaande en afgeronde taken:
> the content view as a board"* — see the grilling of 2026-08-13 at the bottom, which
> is the section that carries this ticket. Everything above it is the history that led
> there, kept because it records what was tried.

**What to build:** one sentence of [79](79-the-content-view-opens-on-the-differences.md).
A row of the content view collapses into a context marker when it holds **no open
work** — not when its two texts happen to match. Nothing is reordered, nothing is
grouped, nothing is counted, and no mode is added.

Status: resolved 2026-08-14 — a row collapses when it holds no open work. The predicate is
`collapses()` in `web/src/lib/view.mjs`, the set is taken when the page opens, and the
marker says which kind of run it holds. See the answer at the bottom.
Blocked by: ~~[79](79-the-content-view-opens-on-the-differences.md),
[80](80-three-buckets-and-the-third-is-closed.md)~~ — **both landed, and the edge is
cleared 2026-08-14.** 79 built the marker and narrowed the predicate as this ticket asked:
`collapses()` in `web/src/lib/view.mjs` is `row.equal && row.class === null`, and what is
left here is one expression — `equal || closed || !decidable` — plus the marker's copy,
which 79 left to this ticket and provisionally reads *N unchanged blocks*.

---

## The original want, from 2026-08-07

**What was asked for:** a grouping of the content view by what is done and what is not.
*Openstaande taken* holds the rows an editor still has to correct; *Afgeronde taken*
holds the rows they ticked off. The editor sees the work that is left without
reading past the work that is finished.

Ticket 36 gave each row a checkbox with three states, but it left every row in
document order whatever its state. On `terrasoverkapping` that is 168 differing rows
in one list, and a row ticked an hour ago sits between two rows that are still open.
The editor re-reads finished work to find unfinished work.

Blocked by: — (was 37, and that edge is void: 37 was **parked** on 2026-08-11)

[36](36-merged-content-view.md) owns the tick and the view this groups, and 36 is
resolved. The edge on [37](.out-of-scope/37-leesweergave.md) is discussed below and
then lifted at the bottom of this file.

**Status at the time:** needs-triage

**Origin:** the review of 36 on 2026-08-07. The reviewer asked about the
*Alleen verschillen* filter and the answer named a different want: not a narrower
list, a **structured** one.

## What triage has to settle

This is an idea and not yet a decision. Three questions decide whether it is one
ticket or none.

- **Does the grouping replace document order, or is it a third view mode?** The
  content view is the whole page in document order, and that order is what makes a
  difference findable by scanning (ticket 36) and what let the section label leave
  the row. A board breaks it. If the answer is a mode, note that ticket 37 already
  adds *Leesweergave* as a second mode, so this would be the third.
- **What counts as "afgerond"?** A tick is a fix claim, and a fix claim **loses** to
  re-check: a contradicted claim is open again. A dismissal ~~and a mute are~~ is a
  judgement and closes a row a different way. Does *Afgeronde taken* hold ~~all three~~
  both, or claims only? — **2026-08-13, ADR 0011: two kinds, not three.** Where does a contradicted claim sit — it is ticked and it is open.
- **Is a grouped finding one task or several?** One finding can be several rows.
  A `×6` finding ticked once moves six rows at the same time, so the board would
  count six done tasks for one act of work.

## Not this ticket

The *Alleen verschillen* filter and the class filter are narrowing, not grouping.
They stay as ticket 36 built them.

## Blocked by ticket 37, from the triage of 2026-08-07

The blocking edge moves from 36 to [37](.out-of-scope/37-leesweergave.md). 36 is resolved and
gave this ticket the tick and the view; 37 is unbuilt and decides the question
this ticket cannot answer on its own.

**The first triage question is "is this a third view mode?", and 37 owns the
second one.** Ticket 37 adds *Leesweergave* — the page as a reader sees it. That
makes the content view a thing with modes rather than a thing with one order, and
it settles how a mode is chosen, how it is remembered and what a mode may do to
document order. A board designed before that is a guess at an affordance ticket
37 is about to define, and two mode mechanisms in one view is the drift the review
of 36 already caught once with the class pills.

The other two questions are unaffected and stay open: what counts as *afgerond*
when a fix claim can be contradicted, and whether a `×6` finding is one task or
six.

Re-triage after 37 lands. This may still be no ticket at all — it is a want, not
a defect.

## The first question is answered, from the grilling of 2026-08-10

[ADR 0006](../../../docs/adr/0006-the-content-view-is-the-spine.md) and
[ticket 79](79-the-content-view-opens-on-the-differences.md) settle
**"does the grouping replace document order, or is it a third view mode?"** — for
collapsing, at least. The content view stays **one** order. 79 opens on the
differences and folds each run of equal rows into a **context marker** that expands.
No row moves, so collapsing is not a mode and 37 keeps the mode question to itself.

That narrows this ticket rather than closing it. **A board still reorders**, and a
fold is not a reorder, so the question stays live for grouping by done and not-done.

**The other two questions are untouched.** What counts as *afgerond* when a fix claim
can be contradicted, and whether a `×6` finding is one task or six.

One thing did move in this ticket's favour. [80](80-three-buckets-and-the-third-is-closed.md)
names the three buckets — Open, Needs attention, Closed — and puts a contradicted claim
in **Needs attention**, which answers the sub-question this ticket asked as "where does
a contradicted claim sit — it is ticked and it is open". So *afgerond* has a candidate
definition now: the Closed bucket. Whether the content view should group by it is still
the open want.

**This ticket is not superseded by [81](81-the-repeat-is-the-queue.md).** 81 groups
findings **across pages** by identical text. This ticket groups rows **within one page**
by what is done. Different problems, and 81 does not deliver this one.

## The block on 37 is lifted — 2026-08-11

> *This was generated by AI during triage.*

[37](.out-of-scope/37-leesweergave.md) was **parked**, not scheduled: it is
`wontfix` in `.out-of-scope/`, awaiting a brainstorm on whether the feature is
wanted at all. So "re-triage after 37 lands" would freeze this ticket indefinitely,
which is not what the block was for. `Blocked by:` is cleared.

**What that costs this ticket: it inherits the mode question.** The block existed
because 37 would have been the first view mode and would therefore have settled how
a mode is chosen, how it is remembered, and what a mode may do to document order. No
ticket owns that now. If the answer here is that a board *is* a mode, this ticket
defines the mechanism rather than adopting one — a bigger scope than it was written
for, and the drift the review of 36 caught once already.

**The cheaper answer is available.** ADR 0006 and ticket
[79](79-the-content-view-opens-on-the-differences.md) hold the content view to one
order, and ticket [80](80-three-buckets-and-the-third-is-closed.md) gives *afgerond*
a candidate definition — the Closed bucket. A grouping expressed as a **filter or a
fold** rather than a reorder needs no mode mechanism at all, and would leave this
ticket the size it was written at.

Still `needs-triage`, still possibly no ticket at all. What changed is that the wait
is over: the two remaining questions — what counts as *afgerond* when a fix claim can
be contradicted, and whether a `×6` finding is one task or six — can be grilled now.

---

## The grilling of 2026-08-13 — the board is refused and the ticket survives as a predicate

> *This was generated by AI during a grilling session.*

**The board is refused.** All three triage questions are answered, the ticket keeps its
number, and what is left of it is one sentence: **a row collapses when it holds no open
work.**

### Why not a board

Three things moved under this ticket after it was written.

**79 does not solve it, and the ticket was right about that.** A ticked row is a fix
claim; the snapshot still differs, so the row is still a differing row. 79's marker
collapses runs of **equal** rows, and a fixed row is not equal. The 168-row list is
still 168 rows after 79 lands. So the want survives 79.

**But [81](81-the-repeat-is-the-queue.md) took the queue off this view.** *Verschillen*
on the dashboard is now "what do I decide next", grouped across pages where the
repetition actually is. What is left for the content view, by
[ADR 0006](../../../docs/adr/0006-the-content-view-is-the-spine.md), is *where does this
text belong* — the question only document order answers, and the one a board destroys.
That is a stronger argument against a board than the one this ticket was written
against, and it did not exist in August 7.

**The pain is also smaller than the ticket assumes.** A real fix, once re-crawled,
deletes the finding: the row becomes equal and 79 collapses it with no help from here.
So the noise exists only between the tick and the next crawl, and re-check is on demand
per store-page pair. That window is the working session — which is exactly when it
hurts, so the want is real — but it caps what this ticket may cost. It buys a predicate
change. It does not buy a second reading of the page.

### The three triage questions, answered

- **Does the grouping replace document order, or is it a third view mode?** Neither. It
  is not a grouping at all. The content view stays one order with a fold in it, exactly
  as 79's own criterion says, so the mode question this ticket inherited when 37 was
  parked is not answered here — it is **not asked**. Nothing in this ticket is a mode.
- **What counts as *afgerond*?** The **Closed** bucket, as
  [80](80-three-buckets-and-the-third-is-closed.md) defines it: absent from the
  snapshot, or dismissed, or claimed fixed and not contradicted. A contradicted claim is
  **Needs attention** and stays visible, which is right — it is open work wearing a
  tick. Claims-only was refused: it would leave a dismissed row in the open list
  forever, which is the same defect this ticket exists to fix. Note that ADR 0011 left
  four derived states, not five, so the question is now simply *Closed or not*.
- **Is a grouped finding one task or several?** The question dissolves. It only had
  teeth for a thing that **counts tasks**, and a fold counts nothing — `CONTEXT.md`
  already holds that a clamp "hides no finding and moves no count", and this is the same
  rule. For the record: one finding drawn at six positions is one decision, and all six
  positions collapse together, because there is nothing left to read at any of them.

### What this ticket found: 79 and 68 disagree about what *equal* means

This is the reason the ticket survives rather than closing, and it was not known before
the grilling.

**79 never defines its predicate.** It says "runs of agreeing blocks" and stops. The
operational rule was set by [68](68-the-content-view-clamps-a-tall-row.md), as a tested
field on `ContentRow`: `equal` is `prod.norm === next.norm`, and 68 says plainly that a
row *"can carry `heading-level` or `tag-changed` and agree about every word"* and is
still equal.

That contradicts 79's first acceptance criterion — *"opens with the differing rows
visible"*. A `heading-level` finding is an **open finding**, and under 68's predicate 79
would collapse it out of sight.

**Both tickets had a reason.** 68 was talking about a clamp: a two-column text table
shows nothing useful for a row whose words agree, so there is nothing to read. True. But
a marker does not compact the row, it **removes** it, and removing an open finding is a
different act from compacting it. Neither ticket is wrong about its own control; the
predicate was carried from one to the other without being re-asked.

**"No open work" resolves it from one rule.** The `heading-level` row stays visible
because it is open. The ticked row collapses because it is closed. That is why this
ticket is now a correctness fix and not a convenience: 79 has a latent defect until the
predicate is widened, and widening it is this ticket.

### The handoff to 79

79 ships first and must **narrow** its predicate rather than inherit 68's. A row that
carries a class is not equal, even when the words agree. Narrowing is the safe
direction — it collapses less — and it leaves this ticket the single job of widening
the predicate deliberately, once 80 has defined Closed.

### Acceptance criteria

- [x] A row collapses into a context marker when it holds **no open work**, and not when
      its two texts match. The predicate is one tested rule in `web/src/lib/view.mjs`,
      beside the `equal` field 68 put on `ContentRow`, and not a condition in a
      component.
- [x] A **contradicted** row does not collapse. It is Needs attention, not Closed.
- [x] A row carrying ~~`heading-level` or~~ `tag-changed` with an open finding does not
      collapse, even though its words agree. This is the 68/79 disagreement above, and
      the answer states which rule won and why.
      **`heading-level` is struck 2026-08-13, ticket 86**, which moved it to
      `information`. It is not a counter-example any more — it is an instance of the
      *third* collapse rule, not an exception to the first, because a finding you can
      link to and cannot decide holds no open work whatever its words do. The example
      this criterion needs is `tag-changed`, which is `diagnostic` and therefore still
      decidable, and 86 left it alone deliberately. **86 also built the predicate this
      ticket specifies**: `canDecide()` in `web/src/lib/classes.mjs`, applied to the row
      as `ContentRow.decidable` in `view.mjs` beside 68's `equal` field, tested. So the
      rule here is `collapse = equal || closed || !decidable`, and what is left to build
      is the marker and the third term's place in it.
- [x] **Say in words whether an `information` finding is *open*.** This ticket's predicate
      is *"no open work"* and it never defined the case, because when it was written every
      shown class was work. Ticket 86 answered it in code — not work, therefore not open
      work — and asked that this ticket answer it in its own words rather than inherit it
      silently. Added 2026-08-13 by 86.
- [x] All positions of one finding collapse together. Occurrence count is not part of
      the finding id, so one decision closes every place it is drawn.
- [x] **The collapse set is computed when the page opens**, and a tick does not move
      anything under the reader. On a 168-row page an editor working top-down would
      otherwise lose their place at every tick, which is worse than the defect being
      fixed. The fold answers *what did I arrive with*, not *what am I doing now*, and
      the row an editor just ticked stays where they can check it.
- [x] **No new control.** 79's own criterion turns `Alleen verschillen` into the
      expand-all control; an editor who wants their closed rows back presses that. A
      recompute button was considered and refused for want of any evidence it is needed.
- [x] **No count moves and nothing is reordered.** The test that pins "a filter never
      moves a count" still passes unchanged, and the heading outline still jumps to the
      same places.
- [x] The marker's label says which kind of run it holds: a run with no findings says
      its blocks agree, a run of closed findings says they are done. One marker, one
      count, `blokken` as the noun — the run is a unit of skipping, not of reading, so
      a mixed run does not split into two markers. **79 proposes no copy at all**, so
      this ticket decides the strings.
- [x] **A page whose findings are all closed gets a sentence, not an empty table.** 79
      carries this as a trap for the equal-page case; this ticket makes the state common
      and desirable, because it is what finishing a page looks like.
- [x] Checked on `terrasoverkapping`, the page this ticket was written about, with rows
      ticked and dismissed and one contradicted.

### What did not change

`CONTEXT.md` gains **no new term**. One existing entry becomes wrong and is corrected:
**Context marker** said *"one row that stands for a run of equal rows"*, and it is now a
run of rows with no open work. **No ADR.** ADR 0006 already holds that the content view
stays one order; this ticket agrees with it rather than testing it, and a predicate on
one tested field is not hard to reverse.

The filename keeps `open-and-done-board`. The number is the identity and six files link
it; renaming for a title is churn.

---

## Resolved 2026-08-14

> *This was built by AI, test-first, at two seams agreed before any test was written:
> `web/src/lib/view.mjs` for the rule and `ContentView.jsx` for what a browser can
> answer that a pure function cannot.*

**The rule.** `collapses()` in `web/src/lib/view.mjs`:

```js
export const collapses = (row) =>
  (row.equal && row.class === null) ||
  (Boolean(row.finding) && (!row.decidable || bucketOf(row.finding.state) === 'closed'));
```

Three terms, and the ticket's `equal || closed || !decidable` is written this way for two
reasons the tests pin. The first term keeps 79's narrowing — **`equal` alone would
collapse an open `copy` or `tag-changed` finding whose words agree**, which is the defect
this ticket was written to stop, so agreement only collapses a row nothing was found on.
The third term is read off the **finding** and not off the row, because `decidable` is
also false for a row carrying a class the derivation never reached: that is noise an
editor asked to see, nobody decided it, and it stays on screen.

**Closed is `bucketOf()` and never a second list.** Ticket 80's grouping is the only place
that says which of the four states are closed, and the content view reads it. A
contradicted claim is Needs attention and does not collapse.

**An `information` finding is not open work**, said in words as 86 asked: `CONTEXT.md`
defines it as a finding you can link to and cannot decide, so nobody is waiting on it and
its two sides may differ as much as they like.

**The set is taken when the page opens.** `collapsedKeys(all)` answers once and
`collapseRuns()` takes the keys instead of asking the rule again; `runKeyHolding()` takes
the same keys, so the jump cannot seed a run the document does not hold. It is taken from
the **whole page** and not from the filtered rows — a filter decides what is drawn and
never what holds open work — and it is keyed on `store/page/showNoise` and not on the
report object, which a parent may rebuild on any render. A different document counts its
anchors from zero and a set carried into it would collapse rows by coincidence; the noise
toggle is in the key for the other half of that, because it changes which rows the page
has. A tick therefore leaves every row where the editor left it, which the browser test
asserts by re-rendering with the finding `fixed`.

**What re-takes the set is opening the view**, and a tab is opening the view: only one tab
panel is mounted, so leaving the content view for Links and coming back takes the set
again. That is the intended reading of *when the page opens* — the criterion is about a
tick moving rows on its own — but it is worth knowing that the noise you left behind comes
back folded rather than as you left it.

**The copy, which 79 left here.** Two sentences, chosen by `marker.agrees`: *3 agreeing
blocks* for a run nobody found anything in, *4 blocks with no open work* for a run holding
work somebody closed. A mixed run says the second and does not split into two markers. The
ticket proposed *N unchanged blocks*; **that word is refused** — 79's own review spent
*unchanged* on a finding id that survives a re-measure, and the interface word is *agree*.
`blokken` is likewise refused: ADR 0014 says the interface speaks English. *They are done*
is refused too, in favour of *no open work*: a run can hold an `information` finding that
nobody decided and calling that done would be a claim about work nobody did.

**A finished page gets its own sentence.** *Nothing left to do on this page. Every
difference on it is closed*, against *Nothing differs on this page* for a page nobody found
anything on. `collapseState().everythingAgrees` is the difference, in `view.mjs` with the
rest of what-is-on-screen.

### The criteria, one by one

Every box is ticked. Three are worth saying how:

- **All positions of one finding collapse together** — the rule reads the finding, so six
  rows drawn from one id cannot come apart. Tested.
- **No new control and no count moves** — nothing was added. *Show agreeing blocks* is
  still the expand-all, the marker's new `agrees` is a **kind and not a number** (the shape
  test that pins the marker's keys was updated to say so), and the filter tests are
  untouched.
- **Checked on `terrasoverkapping`** — **not against the real page.** Nobody opened it.
  What stands in for it is a browser fixture of that page's shape — a run of agreeing
  blocks with a differing row above it and below it — mounted four times: with the finding
  ticked, with it dismissed, with one dismissed beside one **contradicted**, and with a
  tick arriving mid-session. The contradicted case is the one that was missing until the
  review of this ticket asked for it; the rule had been tested, but nothing had watched a
  contradicted row stay drawn while its neighbours collapsed. Anyone who wants the box
  ticked as written should open the page.

### What did not move

`ContentFilter` stays a **one-field wrapper**. 79's review left it in place expecting this
ticket to put a second field back; it did not, because this ticket adds no filter and no
control. Whoever revisits that suggestion should know the reprieve has expired.
