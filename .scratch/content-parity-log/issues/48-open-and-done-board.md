# 48 — Openstaande en afgeronde taken: the content view as a board

**What to build:** a grouping of the content view by what is done and what is not.
*Openstaande taken* holds the rows an editor still has to correct; *Afgeronde taken*
holds the rows they ticked off. The editor sees the work that is left without
reading past the work that is finished.

Ticket 36 gave each row a checkbox with three states, but it left every row in
document order whatever its state. On `terrasoverkapping` that is 168 differing rows
in one list, and a row ticked an hour ago sits between two rows that are still open.
The editor re-reads finished work to find unfinished work.

**Blocked by:** [36](36-merged-content-view.md), which owns the tick and the view
this groups. 36 is resolved.

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
