# 48 — A row collapses when it holds no open work

> The board is refused. The title above replaces *"Openstaande en afgeronde taken:
> the content view as a board"* — see the grilling of 2026-08-13 at the bottom, which
> is the section that carries this ticket. Everything above it is the history that led
> there, kept because it records what was tried.

**What to build:** one sentence of [79](79-the-content-view-opens-on-the-differences.md).
A row of the content view collapses into a context marker when it holds **no open
work** — not when its two texts happen to match. Nothing is reordered, nothing is
grouped, nothing is counted, and no mode is added.

**Status:** ready-for-agent
**Blocked by:** [79](79-the-content-view-opens-on-the-differences.md),
[80](80-three-buckets-and-the-third-is-closed.md)

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

**Blocked by:** — (was 37, and that edge is void: 37 was **parked** on 2026-08-11)

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
  re-check: a contradicted claim is open again. A dismissal and a mute are
  judgements and close a row a different way. Does *Afgeronde taken* hold all three,
  or claims only? Where does a contradicted claim sit — it is ticked and it is open.
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

- [ ] A row collapses into a context marker when it holds **no open work**, and not when
      its two texts match. The predicate is one tested rule in `web/src/lib/view.mjs`,
      beside the `equal` field 68 put on `ContentRow`, and not a condition in a
      component.
- [ ] A **contradicted** row does not collapse. It is Needs attention, not Closed.
- [ ] A row carrying `heading-level` or `tag-changed` with an open finding does not
      collapse, even though its words agree. This is the 68/79 disagreement above, and
      the answer states which rule won and why.
- [ ] All positions of one finding collapse together. Occurrence count is not part of
      the finding id, so one decision closes every place it is drawn.
- [ ] **The collapse set is computed when the page opens**, and a tick does not move
      anything under the reader. On a 168-row page an editor working top-down would
      otherwise lose their place at every tick, which is worse than the defect being
      fixed. The fold answers *what did I arrive with*, not *what am I doing now*, and
      the row an editor just ticked stays where they can check it.
- [ ] **No new control.** 79's own criterion turns `Alleen verschillen` into the
      expand-all control; an editor who wants their closed rows back presses that. A
      recompute button was considered and refused for want of any evidence it is needed.
- [ ] **No count moves and nothing is reordered.** The test that pins "a filter never
      moves a count" still passes unchanged, and the heading outline still jumps to the
      same places.
- [ ] The marker's label says which kind of run it holds: a run with no findings says
      its blocks agree, a run of closed findings says they are done. One marker, one
      count, `blokken` as the noun — the run is a unit of skipping, not of reading, so
      a mixed run does not split into two markers. **79 proposes no copy at all**, so
      this ticket decides the strings.
- [ ] **A page whose findings are all closed gets a sentence, not an empty table.** 79
      carries this as a trap for the equal-page case; this ticket makes the state common
      and desirable, because it is what finishing a page looks like.
- [ ] Checked on `terrasoverkapping`, the page this ticket was written about, with rows
      ticked and dismissed and one contradicted.

### What did not change

`CONTEXT.md` gains **no new term**. One existing entry becomes wrong and is corrected:
**Context marker** said *"one row that stands for a run of equal rows"*, and it is now a
run of rows with no open work. **No ADR.** ADR 0006 already holds that the content view
stays one order; this ticket agrees with it rather than testing it, and a predicate on
one tested field is not hard to reverse.

The filename keeps `open-and-done-board`. The number is the identity and six files link
it; renaming for a title is churn.
