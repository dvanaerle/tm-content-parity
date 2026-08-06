# 41 — The coverage matrix, and bulk muting

Type: task
Status: ready-for-agent
Blocked by: 40
Parent: ../map.md

## What to build

Ticket 33 makes the findings. This ticket makes them readable at full size.

181 NL pages against 6 stores is 1086 cells. Only 20 rows hold all six stores,
and 53 rows are NL only. The de store opens with about 136 missing pages. An
editor must be able to clear that in a few clicks, not 136.

**This ticket replaces ticket 23.** Ticket 23 asked for a prototype of the
matrix. The data is already on disk, so a prototype and the real view would be
almost the same thing. Build the simplest matrix, then judge the real thing.
Ticket 23's questions are the acceptance criteria below.

## Rules

- **Muted cells stay visible.** A mute is a scope decision. If the matrix hides
  it, the view looks complete when it is not.
- **Bulk is N events, never a new key.** Ticket 09 is explicit. A row action
  writes one event per store. A column action writes one event per page. The
  table has no update and no delete policy, so every event is a new row.
- **A partial failure is loud.** 136 inserts can stop at the fortieth. "94 of 136
  saved" is the honest report. The log never drops a click in silence.
- A cell that is not null goes to that store page's ledger.
- Ticket 12 owns the per-page ledger and its tabs. Do not change them here.

## Acceptance criteria

- [ ] The matrix shows 181 rows and 6 columns and stays readable.
- [ ] A muted cell is visibly muted. It is not hidden.
- [ ] One action mutes a whole row (one page, every store) or a whole column
      (one store, every page it lacks).
- [ ] A bulk action that fails part way says how many were saved.
- [ ] A live cell opens that store page.
- [ ] The de store can be cleared to zero open coverage findings in under ten
      clicks.

## Notes

`orphan-page` is a finding against the **NL** store, so it has no row in a matrix
that is keyed on NL pages. Ticket 32 declares the class and builds no producer,
so there is nothing to render yet. Leave the space for it and say so.
