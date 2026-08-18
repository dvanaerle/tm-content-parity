# 138 — A wide selection answers a narrowed question

Type: task
Status: ready-for-agent
Blocked by: 139 — a wide selection makes a press long enough that the loop's silence stops being
tolerable.
Parent: ../map.md

An editor searches, gets 472 findings in 259 differences, and every one of them wants the same
sentence: `Links hebben geen ">" meer.` Today that is 259 expansions and 259 presses, because a
selection belongs to **one difference** — the checkboxes live inside an expanded row, and ticking in
a second difference silently takes the selection away from the first.

## What to build

A narrowed search result can be ticked **whole** and decided in one press. The editor ticks
individual differences from their collapsed rows without losing the ticks they already made
elsewhere, or ticks the entire result from one checkbox beside the count, and then presses once from
a single bar over the whole result.

The control that ticks everything is offered **only where the list is an answer to something** — a
term, a page scope, or a class pill — and never over the bare *Repeats* list, which is every
difference in the store and no proposition anyone made. That condition is the reason this has an ADR:
read `docs/adr/0022-a-wide-selection-answers-a-narrowed-question.md` before starting. It carries the
reasoning and the rejected alternatives.

This replaces the selection model rather than adding a control beside it. A selection stops being a
property of one difference and becomes one flat set of findings over the result.

## Criteria

- [ ] Ticking pages in one difference no longer clears a selection in another.
- [ ] A collapsed difference shows a tri-state checkbox reflecting its own pages.
- [ ] A narrowed result offers a checkbox beside its count that ticks every page of every difference
      in the result — including collapsed ones and ones below the render budget.
- [ ] An unnarrowed *Repeats* list offers no such control.
- [ ] One bar over the result carries both presses; the per-difference bar is inert while it is live.
      Two surfaces must not claim the same ticks.
- [ ] A wide dismissal writes one event per eligible ticked finding and skips one a colleague
      decided; a wide clearing revokes only dismissals. Each press states in which stores it wrote,
      off its own events.
- [ ] The wide press's confirmation names the **snapshot date**: the selection is built over the
      build-time snapshot while eligibility and the closed bar read the live log, and at this size
      that straddle is worth saying out loud once.
- [ ] The selection is session-only, never in the URL, and dropped when the term, the scope, the
      pills or *Include closed* change.
- [ ] `npm test`.

## Traps

- **Do not add a scope, a column or a key.** A repeat is a grouping the interface makes and has no
  identity to key on. This gains rows in the override table and nothing else: N ordinary events, one
  per page, `scope: 'finding'`.
- **The ticks say *these pages*.** Tick everything, decided or not; each press filters to what it can
  act on and reports what it did. `Repeats.jsx` carries the note explaining why round one's opposite
  rule was reversed — one control refused what the other allowed. Do not re-open it.
- **State the narrowed-result condition in the component.** It is nearly free, since the flat row
  list draws only under a search, but leaving it to fall out of the routing is how it gets deleted as
  an oversight later.
- **Do not auto-expand a difference when its row is ticked.** The page table inside a difference is
  unbudgeted, and 259 expanded differences is thousands of rows.
- **Do not put the selection in the amber strip.** The strip enumerates what narrows the list, a
  strip that enumerates *some* of it is worse than none, and a selection narrows nothing.
- **Do not add shift-click range selection.** Refused, with a reason: narrow with the query.
- **The block boundary holds.** This store and its sibling, and no further. There is no all-stores
  repeat view and this is not a step toward one.
- **This moves no count, no bar and no denominator.** A selection has never moved a number.

## Where it came from

A grilling session, 2026-08-18, off two screenshots: a 4-row result and a 472-row one, both wanting
one sentence applied everywhere. The original ask was "another top level checkbox" — the per-column
one already exists, and what was wanted was one level above it. The press's own silence over a long
run was split out as ticket 139, because it is a gap this feature makes acute rather than one it
creates.
