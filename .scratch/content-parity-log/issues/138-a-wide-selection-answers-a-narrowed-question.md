# 138 — A wide selection answers a narrowed question

Type: task
Status: resolved 2026-08-19 — built on branch `ticket-104-search-page-scope`. See the answer.
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

- [x] Ticking pages in one difference no longer clears a selection in another.
- [x] A collapsed difference shows a tri-state checkbox reflecting its own pages.
- [x] A narrowed result offers a checkbox beside its count that ticks every page of every difference
      in the result — including collapsed ones and ones below the render budget.
- [x] An unnarrowed *Repeats* list offers no such control.
- [x] One bar over the result carries both presses; the per-difference bar is inert while it is live.
      Two surfaces must not claim the same ticks.
- [x] A wide dismissal writes one event per eligible ticked finding and skips one a colleague
      decided; a wide clearing revokes only dismissals. Each press states in which stores it wrote,
      off its own events.
- [x] The wide press's confirmation names the **snapshot date**: the selection is built over the
      build-time snapshot while eligibility and the closed bar read the live log, and at this size
      that straddle is worth saying out loud once.
- [x] The selection is session-only, never in the URL, and dropped when the term, the scope, the
      pills or *Include closed* change.
- [x] `npm test`.

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

## Answer

Built 2026-08-19. The selection is one flat `Set<findingId>` over the whole list, held by
`FlatSelection` in `Repeats.jsx`, and the presses below it no longer take a repeat at all.

### The seam moved down, not sideways

`bulkDismissal()` and `bulkClear()` took a `repeat` and a `selected` set, and read exactly
one field of the repeat — `on`. They take **`entries`** now: `RepeatEntry[]`, the
`(store, page, finding)` rows a press is aimed at, already narrowed to the ticked ones by
the caller. So a press covering 259 differences is one short list of pages to them, and
every rule they already had — skip a colleague's decision and count it, clear only a
dismissal, name the stores off the eligible entries — is the same code answering over a
longer list. The arithmetic did not gain a case. `RepeatEntry` is now a named typedef in
`view.mjs`, because it is a seam and not only a field.

The narrowing moved **up** for a reason the first cut got wrong: the presses are memoised on
the note, so filtering the selection inside them re-filtered every page on screen once per
keystroke — one difference's pages before this ticket, and the whole corpus's after it.
`FlatSelection` filters once, when a tick changes.

### One bar, two sentences

The criterion asks that one bar carry both presses and that the per-difference bar be inert
while it is live. It is one bar, always, rendered by the list: a second surface that could
claim the same ticks does not exist rather than being suppressed. What varies is its
sentence. Ticks inside one difference name that difference in the words its row states —
which is what the bar has said since ticket 110 — and ticks spanning several say *12 of 472
pages selected over 5 differences*, because there is no second text to print and printing
the first one's would claim the press is narrower than it is.

`Written in be and nl` keeps its **fact** over a wide press and loses its **reason**: *these
two stores share a language, so the same words are one decision* is true of a block-spanning
row and false of a selection over unlike string pairs. The press still reaches two stores,
and it reaches them because the ticked pages are on both.

### The tick came back to the row, as a sibling

Round one of ticket 110 put a checkbox inside the `CollapsibleTrigger` — a button inside a
button — and the fix then was to move it into the table it selects. That is what made a
collapsed difference untickable, and 259 expansions the price of one sentence. The row is
now a flex container holding two siblings: the tick, and a trigger that is everything after
it. Ticking does not open the difference, and closing one no longer puts its ticks down.

### Where the condition is written

`Repeats.jsx` draws `SelectResult` under `searched` and states in that gate why: a wide press
needs a proposition to be about, and the bare *Repeats* list is every difference in the store
and no proposition anyone made. `ClassGroups` carries the same note beside its own
`FlatSelection`. Both point at ADR 0022.

### What the snapshot line does and does not say

The wide bar names the build date because the selection is built over the snapshot while
eligibility and the closed count read the live log. **Whether it is worth saying is decided
where the selection is held and not on the bar**, and the test is the selection's *shape*
rather than its size: ticks spanning differences, or covering every page of the result, can
only have come from a wide control. That keeps the one-difference-on-472-pages result inside
the rule — a gate counting differences would have missed exactly the case the ticket opens
with — and it needs no threshold anybody would have to defend. A handful of pages ticked
inside one difference is the narrow press ticket 110 shipped, and the interface stays quiet
there (ADR 0019).

`ClassGroups` passes no `builtAt`, so a cross-group selection on the bare *Repeats* list gets
no date. That list is a build's answer too, but the dashboard does not have the stamp in
scope and no wide press is offered there; threading one in would be work this ticket did not
ask for.

### What is not here

The two things CONTEXT.md's *Bulk decision* entry adds "by the size of it" — the typed-count
confirmation on a wide clearing, and the progress-and-abort on the write loop — are
**ticket 139**, which this ticket is blocked by and which is **not built**. This shipped ahead
of its blocker, deliberately: 138 is the selection model and 139 is the write loop, they touch
different code, and 139's own header says its gap exists today and independently. So a wide
press over 472 events is still silent until it is done, and a wide clearing still asks for
nothing but a click. Both are 139's to fix, and 139 is the more urgent for this having landed.
