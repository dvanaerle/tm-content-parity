# 99 — Measure: what the meta check added, beside what the prefactor removed

Type: measure
Status: resolved 2026-08-17 — merged into 97 as its whole-corpus measurement. Not measured; the work is unchanged and it moved.
Blocked by: 97
Parent: 58-axis-a-meta-check.md

**What to measure:** the second of the two numbers ticket 58 owes. Excluding
`no-route` removed findings; the meta classes add them. **One number would hide
both**, exactly as ticket [33](33-directional-text-classes.md) found, so the two are
measured apart and both go in the answer.

**No session.** A run of the existing measurement over the six stores, and a diff
against the baseline ticket 93 left behind.

## Deliverable

- [ ] Per store and totalled: findings added on `check: 'meta'`, and the share of
      shown they represent. 21 put that share at **0.54%** over 373 comparable pages.
      The share, not the raw count, is the figure to compare — the corpus is 722 now.
- [ ] Stated beside ticket 93's `no-route` drop, as two numbers on one line, so the
      net movement never appears without both halves.
- [ ] The four `lost`/`added` classes fire **zero** times, or the exceptions are named
      by page. Both sides always send a title and a description. They ship anyway,
      because a one-sided check needs both directions and a title that disappears
      after a later content edit is the exact defect this log exists to catch.
- [ ] `robots-index-lost` is counted by store. 21 says it fires **once**, on `be` —
      the severe direction, where the page leaves Google. This is the one claim that
      does not scale with the corpus: if it fires more often now, that is a finding
      about a head and it is named.
- [ ] **Text, link and image finding counts are unmoved** against ticket 93's
      baseline. This work adds a check; it must not disturb the other three. A moved
      count here is a defect in ticket 97, not a measurement.
- [ ] The chips move as predicted: `verschillen open` up by most of the total,
      `verborgen (ruis)` by the rest, `pagina's gelijk` down.

## Reading list

- `compare/measure.mjs`
- ticket 93's recorded baseline
- ticket 91's predicted table

Write the tables here and in the probe output, not into ticket 58.

## Answer

**Merged into [97](97-the-meta-producer-one-finding-per-row.md) as its whole-corpus
measurement, 2026-08-17.** Nothing here is withdrawn and nothing is measured yet. This was
`Type: measure` with **no session**, blocked by nothing but 97, measuring exactly what 97
produced — which makes it 97's gate rather than a ticket. 97 already carried an `nl`-only
gate table for its own red-green; the six-store number and the comparison against 93's
baseline now sit beside it under **The whole-corpus measurement**, with every deliverable
from this file copied across.

**The rule this merge keeps is the one this ticket was written to protect.** The `no-route`
removal and the meta addition are still measured apart and both still go in the answer,
because one number would hide both. What changes is that the measurement can no longer be
left behind while the build is marked done.

**One figure here was stale and is corrected in 97.** This file says `robots-index-lost`
fires **once**, on `be`, from ticket 21's 2026-08-07 measurement. Ticket 91 re-measured it
on 2026-08-14 and it fires **twice** — `be/bedrijfsinformatie` and
`de/(de)erfolg-probepaket`, the second being the severe direction. 97 carries the corrected
figure and the table.

Read 97. This file is kept as the record of where the measurement was specified.
