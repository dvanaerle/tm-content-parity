# 141 — A difference is ordered by what is left

Type: task
Status: ready-for-agent
Blocked by: nothing.
Parent: ../map.md

The repeat list leads with the **largest** difference, whether or not anything on it is
still open. A footer line settled on thirty pages sits above a price sentence open on five,
so an editor reading top-down scrolls past finished work to reach the work. The row already
says both numbers side by side — `on 30 pages` and `30 of 30 closed` — and only the left one
decides the order.

## What ticket 81 decided, and what it did not

[81](81-the-repeat-is-the-queue.md) owns this order and shipped with one acceptance criterion
refused. Its answer records:

> **They are the same number, always, and not by accident.** … Measured over the whole
> corpus: 25,657 repeats, zero exceptions. … The list is worst-first **by pages**, which is
> worst-first by findings.

That proof is correct and it is **about total findings**: `page` is a term of the finding id,
so one page carries one finding of a given repeat, and the two counts cannot diverge. The
equivalence holds at derivation time and stops holding the moment the log closes some of
them — twenty closed pages and two open is still twenty-two.

So this ticket does not overturn 81. It is the case 81's proof does not reach, and its answer
should say that in those words rather than reading as a reversal.

The principle is already written down in [29](29-actionable-log.md), user story 33 — *sort
the dashboard by open findings after overrides are applied, so that the worst page is the
worst remaining page and not the worst page of last week* — carried into its Implementation
Decisions as *the dashboard sorts and counts on the derived state*. It says **page** because
it predates the repeat list; 81 added that list afterwards and the story never followed it
across. This ticket is story 33 applied to the list 81 built.

## What to build

An editor reading a store's differences meets the ones with the most work left in them
first. A difference with nothing left sinks below every difference with work left, whatever
its size. Nothing is removed and no number moves.

## Where this changes anything, and where it cannot

A closed difference is **not** removed from the repeat list. It is derived from the run's
page summaries and the log is layered on per row, so a difference settled on all thirty pages
stays on screen reading *30 of 30 closed*. That is deliberate — the backlog is not drained,
which is 81's own progress-language criterion — and it is the whole case for this ticket:
those rows are large, so today they lead.

A **search** is the other way. `searchStore()` drops any entry that is not active unless
*Include closed* is on, and *active* is exactly *not in the bar's closed set*. A fully-closed
difference is already absent from a result; a partly-closed one arrives smaller.

Which means **in the searched default this reorder is a no-op**: every surviving row has a
closed count of zero, open equals the page count, and the new order agrees with the old one
row for row. Test that rather than working around it. The two places this ticket bites are
the unsearched repeat list and a search with *Include closed* on.

## What makes it more than a comparator swap

- **`repeatsInStore()` cannot do it.** It is a pure derivation over the page summaries and
  never sees the override log; the closed count is `barOf()` over the log, read in the row.
  So the order has to be taken where the log is in scope — the same layer, and the same memo,
  in which the page list already sorts on its derived state.
- **There is a standing argument against count-based order in that file.**
  `groupRepeatsByClass()` refuses it outright: *a group that changes position as the work is
  done is a group nobody can learn where to look for*. It is about **groups**, and this
  ticket is about **rows** — the page list has moved rows as work closes since it had a sort
  at all. Say which of the two this is, in the code, so the next reader does not read the
  refusal as covering both.

## Criteria

- [ ] The flat repeat list leads with the difference holding the **most open findings**, not
  the most pages.
- [ ] A difference with **nothing left** sinks below every difference with work left,
  whatever its size.
- [ ] The order is **stable**: equal open counts fall back to page count and then to the key,
  so two renders of one list never disagree.
- [ ] The rows inside a **class group** are ordered the same way. The **groups themselves keep
  the vocabulary order** they have — that refusal stands and is not what this ticket touches.
- [ ] A search result is ordered by the same rule, and a test states that in the **searched
  default** this leaves the order exactly as it was, because every row there is open.
- [ ] **A row does not move under the editor working in it.** The order is taken when the
  list arrives and held; closing findings inside an expanded difference re-counts the row's
  closed number without re-seating the row. It is re-taken when the list's identity changes —
  the term, the scope, the pills or *Include closed* — which is the remount the flat list
  already does.
- [ ] The comment on the old comparator no longer calls page count worst-first, and 81's
  answer is not left as the last word on an order it no longer describes.
- [ ] **No second sort control.** The dashboard states, where the existing sort is drawn, that
  it belongs to the page list because it narrows pages; a second one over the repeat list
  argues with that sentence. If this ticket concludes an editor genuinely needs both orders
  here, that is a separate decision.
- [ ] `npm test` passes, including the existing repeat and search browser suites.

## Traps

- **Do not re-key the row.** The selection is one flat set of finding ids over the whole list;
  reordering must not disturb which ticks are held, and a `key` taken from the position would
  do exactly that.
- **Nothing leaves the denominator.** The closed count obeys the page bar's rules — a
  dismissal enters the numerator, a contradicted claim reads as open — and the order is taken
  off that same bar rather than off a second count of its own.
- **A held order is not a stale count.** The row's own *N of N closed* stays live as decisions
  land; only its position is held. The two must not be taken from one frozen reading, or a row
  would say yesterday's number.
- **The lookup into the log is left to throw.** Skipping a missing id would quietly lower a
  denominator, and now it would also quietly move a row.
- **`occurrences` is not the number.** The same difference twice on one page is one finding's
  worth of open work, and the row already says the two apart. This is 81's third trap, one
  step over.

## Where it came from

A reader's question about ticket 04 of the `ui-polish` pass, which turned the pages table
worst-first on open work and left the repeat list ordering on corpus size. Drafted there as
issue 12 and moved here: that pass is visual and copy work, and its Out of Scope refuses any
change to what the log counts. An ordering rule keyed on derived state belongs with 81 and 29.
