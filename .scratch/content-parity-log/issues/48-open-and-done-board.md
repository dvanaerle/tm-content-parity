# 48 — Openstaande en afgeronde taken: the content view as a board

**What to build:** a grouping of the content view by what is done and what is not.
*Openstaande taken* holds the rows an editor still has to correct; *Afgeronde taken*
holds the rows they ticked off. The editor sees the work that is left without
reading past the work that is finished.

Ticket 36 gave each row a checkbox with three states, but it left every row in
document order whatever its state. On `terrasoverkapping` that is 168 differing rows
in one list, and a row ticked an hour ago sits between two rows that are still open.
The editor re-reads finished work to find unfinished work.

**Blocked by:** 37

[36](36-merged-content-view.md) owns the tick and the view this groups, and 36 is
resolved. The live edge is [37](37-leesweergave.md) — see below.

**Status:** needs-triage

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

The blocking edge moves from 36 to [37](37-leesweergave.md). 36 is resolved and
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
