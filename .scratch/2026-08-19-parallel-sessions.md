# Parallel sessions — what can be built at the same time, 2026-08-19

**What this is.** A schedule for running several ticket sessions at once in **one checkout, no
worktrees**, so that each session's work can be committed on its own. Two tickets may share a
session's calendar slot only when they touch **no file in common** — that is the whole rule, and
everything below is derived from it.

**What it is not.** It is not a priority order. The order to work in is in
`2026-08-19-ready-for-agent-audit.md`; this file says only what may run *beside* what. Where the
two disagree, value wins and this file tells you what it costs.

**How it was derived.** Every open ticket's file footprint was read from its own criteria and
verified against the tree, then the pairwise intersection was computed. The conflict table is the
durable part: if priorities change, re-derive the waves from it rather than trusting the waves.

---

## The three rules

1. **Stage explicit paths. Never `git add -A`, never `git commit -a`.** In a shared checkout the
   real hazard is not editing the same file, it is one session sweeping another's half-finished
   work into its commit. This repo has already been bitten — `ui-polish/12` is titled *A commit
   swept two staged deletions that were not its own*.
2. **One data-writer at a time, and `95` runs alone.** File-disjointness is not enough for
   anything that writes or invalidates `data/`. See *The data window* below.
3. **`map.md` and `CONTEXT.md` will conflict anyway.** Ten tickets append to
   `content-parity-log/map.md` on landing and four amend `CONTEXT.md`. Expect a one-line
   conflict per landing, or batch those updates separately from the code commits.

---

## Precondition — cleared 2026-08-19

**Ticket 93 is committed** — `feabe7c`, *"The 404 page leaves the log, and an aborted run writes
its failures"*. Wave 1 may start.

**Half of it was then withdrawn as out of scope, the same day.** `no-route` is a CMS content
page — its body is written in CMS > Pages, and the new site has rewritten it — so keeping it out
of the parity log was never this project's call to make. The exclusion (93's slices 1–2) is
`wontfix — out of scope` and is reverted in the tree; the failure-log half (slices 3–4) is
`resolved` and stands. The ticket has moved to
`content-parity-log/.out-of-scope/93-no-route-leaves-the-log.md`, so the issue list reads as
work still to do. Nobody should re-derive the exclusion: see 93's `## Correction`.

This section is kept because the hazard it described is the one that recurs: 93 sat **built but
uncommitted** in the working tree, its four files (`crawl/21-crawl-store.mjs`,
`crawl/extract.test.mjs`, `shared/excluded-pages.mjs`, `web/src/lib/not-checked.test.mjs`) still
carrying a `ready-for-agent` status line, while tickets **85** and **94** both wanted two of
them. Before opening any wave, check that the tree is clean of a finished ticket nobody has
committed — a footprint table cannot see uncommitted work.

**What 93 leaves behind, after the withdrawal.** The `no-route` extracts and reports it deleted
have been re-crawled and re-compared on all six stores, so `data/reports/` is back to **722
comparable pages, 40,802 findings, 21,830 work** and `history/run-log.jsonl` is current. What is
still stale is **`data/snapshot.json` and `dist/search-index/`**, neither rebuilt: a one-page-per-
store crawl is not an observation, and 95 will settle them. A session reading the snapshot or the
search index before 95 is reading a corpus that disagrees with `data/reports/` by those 82
findings.

---

## Wave 1 — four sessions in parallel

The largest genuinely disjoint set available today. No data writer, so the tree stays buildable
and every session's browser tests keep passing.

| session | ticket | owns |
|---|---|---|
| A | `cpl` **85** — the comparison scope is legible | `Dashboard.jsx`, `Dashboard.browser.test.mjs`, `lib/not-checked.mjs`, `lib/not-checked.test.mjs` |
| B | `cross-store` **09** — a class on its own is a query | `lib/search.mjs`, `lib/search.test.mjs`, `Search.jsx`, `Search.browser.test.mjs` |
| C | `ui-polish` **13** — touch targets and the header wrap | `ui/button.jsx`, `ui/checkbox.jsx`, `layouts/Shell.astro`, `StoreSwitcher.astro`, `OverrideControl.jsx`, `BulkControl.jsx`, `Annotate.jsx`, `Chips.jsx`, `Diff.jsx`, `RecordLayout.jsx`, `interface-weight.test.mjs` |
| D | `cross-store` **11** — measure the flattening and the pairing | one new `crawl/probes/probe-11-*.mjs`, and its own ticket file |

**Why not a fifth.** `94` is file-disjoint from all four and would fit on paper — but it is a data
writer. The moment `extractVersion` lands, `measure.mjs` refuses every extract on disk, the log
becomes unbuildable, and sessions A, B and C lose their browser tests. Keep it out.

Session D has one caveat of its own: **11's numbers go stale if `95` re-crawls under it.** Finish
and record the answer before the data window opens.

---

## Wave 2 — two sessions in parallel

| session | ticket | owns |
|---|---|---|
| A | `cpl` **141** — a difference is ordered by what is left | `Dashboard.jsx`, `Repeats.jsx`, `lib/view.mjs`, `lib/search.mjs`, `Search.jsx` + their tests |
| B | `cpl` **128** — the carve-out reaches for primitives | `Selected.jsx`, `BulkControl.jsx`, `Annotate.jsx`, `Chips.jsx`, `Ledger.jsx`, `Marker.jsx`, `docs/adr/0007` |

141 needs 09 landed first, because both rewrite `lib/search.mjs`.

---

## Wave 3 — one session, alone

`cross-store` **03** — the search reaches every store.

03 is the second-worst neighbour in the set. It conflicts with **02, 04, 09, 97, 98, 125, 128,
129, 141 and 13** — it touches `Chips.jsx`, `ContentView.jsx`, `Ledger.jsx`, `Repeats.jsx`,
`Search.jsx` and `lib/search.mjs` all at once. Give it the tree.

---

## Wave 4 — two sessions in parallel

| session | ticket | owns |
|---|---|---|
| A | `cpl` **98** — the Meta tab becomes a checklist | `Ledger.jsx`, `OverrideControl.jsx`, `ContentView.jsx`, `Repeats.jsx`, `lib/classes.mjs` |
| B | `cross-store` **02** — a renamed image is one finding | `compare/images.mjs`, `compare/vocabulary.mjs`, `compare/findings.mjs` + compare tests |

Two conditions. **02 must have its matcher re-read first** against
`gallery-opening-links/BYTES.md` — a content digest may replace the arity-and-position design
entirely, which changes this footprint. And 98 is properly part of the meta chain, so pairing it
here means building it before 97; if that is wrong for other reasons, run 02 with `04` instead
(see the ADR caveat below).

---

## The data window — strictly serial, nothing else running

```
  94  ->  95  ->  97
```

- **94** invalidates every extract on disk. From the moment it lands until 95 finishes, the log
  cannot be built and no UI session can run its tests.
- **95** rewrites all ~816 files under `data/extract/`, then `data/reports/`, `data/snapshot.json`
  and appends to `history/run-log.jsonl`. **Nothing else may run against `data/` while it does** —
  including ticket 11's probe.
- **97** rewrites `data/reports/` for all six stores, `data/snapshot.json` and
  `data/probe-91-meta-classes.json`.

94 and 97 also both edit `compare/30-compare.mjs`, and 97 and 98 both edit `Ledger.jsx`.

**Land every extractor change inside this window.** If the byte-digest check (from
`gallery-opening-links/BYTES.md`, which currently has no ticket) lands after 95, it forces a
second six-store re-crawl.

---

## Run alone, whenever

- `cpl` **129** — a hint is reachable without a mouse. Reaches nine components; conflicts with
  **85, 97, 98, 03, 04, 125, 128, 141 and 13**. It has no safe partner in the set.
- `cpl` **125** — a content cell says which language it is in. Conflicts with **03, 04, 09, 97,
  98, 128, 129, 141 and 13**.

---

## The full conflict table

A pair may share a wave only if it is **absent** from this table.

| pair | shared files |
|---|---|
| 02 × 03 | `search.test.mjs` |
| 02 × 04 | the next free ADR number |
| 02 × 09 | `search.test.mjs` |
| 02 × 97 | `compare.test.mjs` |
| 02 × 141 | `search.test.mjs` |
| 03 × 04 | `Repeats.jsx` |
| 03 × 09 | `search.mjs`, `search.test.mjs`, `Search.jsx`, `Search.browser.test.mjs` |
| 03 × 13 | `Chips.jsx` |
| 03 × 97 | `Ledger.jsx` |
| 03 × 98 | `ContentView.jsx`, `Ledger.jsx`, `Repeats.jsx` |
| 03 × 125 | `ContentView.jsx`, `Ledger.jsx`, `Repeats.jsx`, `Search.jsx` |
| 03 × 128 | `Chips.jsx`, `Ledger.jsx` |
| 03 × 129 | `Chips.jsx`, `ContentView.jsx`, `Ledger.jsx`, `Repeats.jsx` |
| 03 × 141 | `Repeats.jsx`, `search.mjs`, `search.test.mjs`, `Search.jsx`, `Search.browser.test.mjs` |
| 04 × 13 | `BulkControl.jsx` |
| 04 × 98 | `Repeats.jsx` |
| 04 × 125 | `Repeats.jsx` |
| 04 × 128 | `BulkControl.jsx` |
| 04 × 129 | `BulkControl.jsx`, `Repeats.jsx` |
| 04 × 141 | `Repeats.jsx`, `view.mjs`, `view.test.mjs` |
| 09 × 125 | `Search.jsx` |
| 09 × 141 | `search.mjs`, `search.test.mjs`, `Search.jsx`, `Search.browser.test.mjs` |
| 13 × 98 | `OverrideControl.jsx` |
| 13 × 125 | `Diff.jsx` |
| 13 × 128 | `Annotate.jsx`, `BulkControl.jsx`, `Chips.jsx`, `interface-weight.test.mjs` |
| 13 × 129 | `Annotate.jsx`, `BulkControl.jsx`, `Chips.jsx`, `Diff.jsx`, `OverrideControl.jsx`, `StoreSwitcher.astro` |
| ~~85 × 93~~ | ~~`not-checked.test.mjs`~~ — gone: 93's edit to that file was withdrawn |
| 85 × 129 | `Dashboard.jsx`, `Dashboard.browser.test.mjs` |
| 85 × 141 | `Dashboard.jsx` |
| 93 × 94 | `extract.test.mjs` — 93 has landed, so this is history; 94 owns the file |
| 94 × 97 | `30-compare.mjs` |
| 97 × 98 | `Ledger.jsx` |
| 97 × 125 | `Ledger.jsx` |
| 97 × 128 | `Ledger.jsx` |
| 97 × 129 | `Ledger.jsx` |
| 98 × 125 | `ContentView.jsx`, `ContentView.browser.test.mjs`, `Ledger.jsx`, `Repeats.jsx` |
| 98 × 128 | `Ledger.jsx`, `Ledger.browser.test.mjs` |
| 98 × 129 | `ContentView.jsx`, `Ledger.jsx`, `OverrideControl.jsx`, `Repeats.jsx` |
| 98 × 141 | `Repeats.jsx` |
| 125 × 128 | `Ledger.jsx` |
| 125 × 129 | `Annotations.jsx`, `ContentView.jsx`, `Diff.jsx`, `Ledger.jsx`, `Repeats.jsx`, `Repeats.browser.test.mjs` |
| 125 × 141 | `Repeats.jsx`, `Search.jsx`, `Repeats.browser.test.mjs` |
| 128 × 129 | `Annotate.jsx`, `BulkControl.jsx`, `Chips.jsx`, `Ledger.jsx` |
| 129 × 141 | `Dashboard.jsx`, `Repeats.jsx`, `Repeats.browser.test.mjs` |

### The hub files

Five files carry most of the contention. If a ticket touches one of these, assume it has no
partner until you have checked:

| file | tickets |
|---|---|
| `web/src/components/Ledger.jsx` | 03, 97, 98, 125, 128, 129 |
| `web/src/components/Repeats.jsx` | 03, 04, 98, 125, 129, 141 |
| `web/src/components/Chips.jsx` | 03, 13, 128, 129 |
| `web/src/components/Dashboard.jsx` | 85, 129, 141 |
| `web/src/lib/search.mjs` | 03, 09, 141 |

### Blocking, which is separate from conflict

```
  09  ->  03  ->  04
  93  ->  94  ->  95  ->  97
```

`cross-store` **04** is not startable at all today: it is blocked by 03, which is blocked by 09.

---

## The ADR-number caveat

`docs/adr/README.md` now forbids a ticket from reserving an ADR number — the number is taken by
whoever writes the file, as the next free one at that moment. Tickets **02** and **04** both need
a new ADR, so **they cannot be written in parallel without agreeing the two numbers up front**.
That is the cost of the rule, and it is worth paying: the alternative is what produced a vacant
0024 and two tickets naming numbers that belong to other decisions.

---

## Two ticket paths that are wrong

Fix these before a session wastes time on them:

- `ui-polish` **13** cites `web/src/components/Shell.astro`; the file is
  `web/src/layouts/Shell.astro`. It also cites `BulkControl.jsx:122,133` for `size="xs"`; the real
  ones are at `:207,220,310,322,379,598,641,648`.
- `cpl` **129**'s per-file line numbers are stale throughout, though its re-counted figure — 11
  attributes over 9 files — matches the tree.
