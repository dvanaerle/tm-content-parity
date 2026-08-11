# 99 — Measure: what the meta check added, beside what the prefactor removed

Type: measure
Status: ready-for-agent
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
