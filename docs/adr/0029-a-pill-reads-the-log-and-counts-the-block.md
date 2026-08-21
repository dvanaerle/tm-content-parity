# A pill reads the log and counts the block

Date: 2026-08-21

## Status

Accepted. It narrows nothing in ADR 0021, which stands: *reading may cross any store; pressing
may not.*

## Context

A reader opened `nl`'s dashboard and reported two numbers that disagreed. The class pill said
`Case or punctuation 40`. The group header under it said *52 differences*. Below that sat
fifteen rows, every one of them reading *2 of 2 closed*, under a pill that had not moved since
the morning.

Neither number was stale with respect to the other. They counted different things over
different corpora:

- The pill summed `summary.byClass` over **this store's** comparable pages. Unit: findings.
- The list is `repeatsInStore()` over this store's comparable pages **and its language-block
  sibling's**. Unit: differences.

And neither of them read the log at all, so a morning's work moved neither. The screen was
answering *what did this crawl find* to an editor asking *what is left*.

Two decisions were needed, and both of them span more than the one function they land in.

## Decision

### A pill reads the log; a bar reads the snapshot

**The class pill's number is the open work of its class, read live from the override log.** It
falls the moment a finding is dismissed or claimed fixed, with no recrawl. A class with nothing
open draws no pill at all.

**Every other number on the dashboard stays snapshot-shaped.** The progress bar, the three
bucket chips, the page chips, the roll-ups and the Ledger's own figures are counted off the
snapshot and go on being citable precisely because they do not move under a conversation.

This is not an inconsistency to be tidied away later. The two kinds of number answer two
questions, and the split is what each is for:

- A **pill is a control**. Its number exists to tell an editor whether pressing it is worth
  doing, which is a question about now. A control that recommends a queue that emptied this
  morning is a control that lies.
- A **bar is a report**. Its number exists to be quoted — in a stand-up, in a ticket, against
  a target — and a figure that moves while two people read it is a figure neither of them can
  cite.

So *live counts in general* is refused and this one count is made live.

### A pill counts the language block; a bar counts the store

**The pill counts the corpus of the list it sits above**, which since ADR 0018 is the language
block: `repeatsInStore()` groups a difference `nl` and `be` carry in the same words into one
row, and the *Repeats* list on either dashboard is that mirrored list.

**The progress bar, the page chips and the roll-ups stay the store's.** A store is the unit an
editor is responsible for, and that has not changed.

The asymmetry is deliberate: **a pill above the repeat list describes that list, and a bar
above the store describes the store.** Anything else makes one of the two lie about the thing
it is drawn over. It is a **reading** and not a press, so ADR 0021's boundary is untouched —
what crosses a store here is a number an editor looks at, never an event an editor writes.

### The agreement is by construction

The pill is counted from **the same list the rows come from**, by the same function that
decides which rows are drawn and where they sit. A second count made to agree with the first
would have drifted again the next time either moved.

### Where the rule is stated

Amended 2026-08-21. *The same list* means the same **corpus** and the same **log** — not the
same narrowing. The pill counts before the class filter and the rows come after it, because a
pill that fell to its own count when you pressed it would be a control that lies about what it
holds.

That is one sentence with two clauses in it, and for a while nothing enforced the order: the
list was six exported derivations, three callers composed them by hand, and *count before, list
after* was a comment on each of them.

**`repeatList()` in `web/src/lib/repeat-list.mjs` is the one enforcement point.** It is handed
the un-narrowed list, the pills that are on and one reading of the log, and it returns the
pill counts, the rows, the class groups, the two totals and the closed pages together. The steps
between it and `repeatsInStore()` are private to that module, so composing them in the wrong
order is not a thing a caller can do. `repeatsInStore()` stays outside it, because it is what
builds the list and a search needs its output.

The rows, the groups and the closed pages are derived **when something asks for them**, so the
one entry costs a caller nothing it does not read: the dashboard reads three numbers off a live
log on every decision, and sorting and grouping the whole list for it would be the price of the
enforcement rather than the enforcement itself.

Whether the reading it is handed is **held** or **live** stays the caller's, which is the
consequence below about timing: the queue holds it so a decision does not move a row, and the
pills read it live so a number does not go stale. One function serves both, because it is handed
the reading each of them wants.

## Consequences

- **The unit is the finding.** That is the unit of a decision, and it is what the row's *N of N
  closed* and the page bar already speak. 52 rows can hold 104 decisions, and a pill saying
  *52* would tell an editor they have half the work they have. The group header goes on saying
  how many **differences** it draws, and the two are different words for different things
  rather than two counts of one.
- **A number and a membership have different timing rules, and both are needed.** The pill's
  count is **live**: a held count is a stale number. A row's presence and position are **held**
  as the list found them: a live membership is a row moving out from under the editor's hand.
  *Numbers are readings and move; membership is a position and is held.*
- **A class that cannot be decided keeps its pill off the snapshot.** A repeat is built out of
  the `work` findings a page summary carries, so an `information` class has no row on this list
  and would silently lose its pill. Such a finding is one you can link to and cannot decide, so
  no decision can close it and the snapshot's figure **is** the live figure. Those few pills are
  therefore the exception to the paragraph above: they count the **store**, because the store's
  tally is the only one a dashboard holds. It costs nothing — a number no decision can move
  cannot come to disagree with a list — and it is named here rather than left for a reader to
  find.
- **An unread log shows every pill at its full count.** The events start as `null` and the
  derivation reports every finding open, which is the correct answer: an unread log means
  *nothing decided* and never *nothing left*. It is also the dangerous answer, because it looks
  right — so the row hiding waits on an explicit *the log has answered* flag, and a test mounts
  unread.
- **A fully decided class becomes unreachable by pill**, and that is accepted. The Ledger is
  the home for *what did we decide*; *Include closed* is for auditing a class you are already
  inside. If it bites, the fix is the Ledger filtering by class, and not a pill that exists to
  say nothing.
- **ADR 0010 gains a parameter's worth of scope and no new rule.** *Include closed* was written
  in the URL wherever there was a search to belong to; it is now written on the *Repeats* view
  as well, because that is a second list it narrows. It is still absent where nothing is
  searched and *Pages* is the view, which is the rule the sort and the priorities keep.
- **Ticket 141's sink-not-hide is superseded for this one list.** Sinking a settled difference
  was the safe direction to be wrong in, and the measurement since is that a sunk row is still
  a row an editor scrolls. 141's **order** survives intact: worst-first on open findings still
  decides where the surviving rows sit.
- **The search is untouched.** `searchStore()` has dropped an inactive finding before it groups
  since ticket 09, so a fully closed difference has always been absent from a result — and a
  result asked for with *Include closed* on is the editor asking for exactly the rows the other
  list hides.
