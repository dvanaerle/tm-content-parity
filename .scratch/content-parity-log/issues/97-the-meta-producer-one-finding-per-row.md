# 97 — The producer: one finding per head row

Type: build
Status: ready-for-agent
Blocked by: 91, 95, 96
Parent: 58-axis-a-meta-check.md

**What to build:** the `<head>` stops being display-only and becomes the fourth
check. A changed Meta Title, a changed Meta Description or a lost Robots directive
now produces a finding an editor can tick off, exactly like body copy. The dashboard
Meta column stops printing `—`.

**Each of the three checking rows holds at most one finding.** The three title
classes are mutually exclusive, and so are the two robots classes. The field row *is*
the finding row — that is what lets the panel stay a five-row table in ticket
[98](98-the-meta-tab-becomes-a-checklist.md).

## What makes no finding

- **`h1`.** It is a heading in `elements`, so the content view owns it. It differs on
  93 of 179 nl pages, so reading it here would report the same words twice.
- **Canonical.** It keeps the host fold it does today through `linkKey()`, and keeps
  suppressing the `added` state. Production has no canonical on 147 of 179 nl pages.
- **Keywords.** Captured and displayed, no rule, until there is evidence a value
  exists.

## Two rules that are easy to get wrong

- **Tier 2 is not folded.** A dropped trailing full stop is `meta-casing`, not
  silence. Folding it would make the head the one place in the log where a lost full
  stop is invisible.
- **No brand-suffix rule, and no `Tuinmaximaal` string anywhere in the code.** Only 3
  of 45 title differences collapse when ` | Tuinmaximaal` is stripped, and the suffix
  sits on about 45% of titles on *both* sides — so it is editor text, not a template.
  A template change would read as 0% against 100%. Those 3 pages are ordinary
  `meta-title-changed` findings.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `compare/meta.mjs` and the nine `metaRows` tests in `compare/compare.test.mjs`
- `compare/images.mjs` — the collector-as-parameter shape to copy
- `21-axis-a-meta-check.md` § Identity and normalisation
- ticket 91's table, pasted below

**Trap: the producer cannot import `findings.mjs`.** `compare/meta.mjs` is imported
by a React island, and `findings.mjs` reaches `node:crypto` through `contract.mjs`,
so the Vite island build fails. Take the collector as a parameter and type it with a
JSDoc import, as `compare/images.mjs` already does.

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- compare/meta.test.mjs` and show the red before you write the
implementation. Then the next criterion. Do not plan across all six.

- [ ] 1 `compare/meta.test.mjs` exists and the nine `metaRows` tests move into it
      **unchanged**, green, out of `compare.test.mjs`.
- [ ] 2 The producer takes the collector as a parameter, and the island build passes.
- [ ] 3 Title: the three classes fire, mutually exclusively, at most one per row.
- [ ] 4 Description: the two directions and `meta-casing`, tier 2 unfolded, at most
      one per row.
- [ ] 5 Robots: both directions off the derived boolean, mutually exclusive.
- [ ] 6 Every meta finding carries `score: null` and `anchorHeading: null`. `score`
      is a `copy`-finding field and a head row has no similarity pairing;
      `anchorHeading` is defined by document order inside the content boundary, and
      the head is outside it.

## Gate

`npm test`, then `node compare/measure.mjs nl`.

Findings appear on `check: 'meta'` at roughly ticket 91's counts. **Text, link and
image counts are unmoved** — this ticket adds a check and must not disturb the other
three. Ticket [99](99-measure-what-the-meta-check-added.md) states the number
properly.
