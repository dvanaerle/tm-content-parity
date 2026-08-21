# Parallel sessions — what can be built at the same time

**Rewritten 2026-08-21.** The earlier version was written against a ticket set that has since
landed. Two tickets may share a slot only when they touch **no file in common** — that is the
whole rule, and everything below is derived from it.

Eight tickets are open: **02, 04, 11, 13, 94, 97, 98, 129**. (85, 09, 03, 125, 128 and 141 have
landed or been parked since the first draft; 95's re-crawl is done but predates 94.)

> **Overtaken 2026-08-21, hours later — the schedule below is spent.** Seven of the eight have
> landed: `cross-store` 02 (`ADR 0027`), 04, 11, `ui-polish` 13, and `cpl` 94 (`a3f5073`), 97
> (`1144ee0`) and 98 (`ca71025`). **Two tickets are open, and the parallelism question barely
> applies to two:**
>
> | ticket | what is left | files |
> |---|---|---|
> | `cpl` **129** | **part B only.** Part A landed as `acf1d50`; re-price B against **11** hints over 9 files, not 36. | the eight in *Reading list — B* |
> | `cross-store` **07** | the flattening half, re-triaged and unblocked once 11 reported. **It has no reading list** — write one before starting, which is this document's whole lesson. | the sibling-tab reading, `web/src/lib/blocks.mjs` and its component; 11 found that its own measurement 2 *is* `blockReading()` |
>
> **They may share a slot.** 129 part B's eight files are all findings-surface components and
> `interface-language.test.mjs`; none of them is the sibling tab. Confirm it against 07's reading
> list once that exists rather than against this line.
>
> The rule below is unchanged and is the only part worth keeping: two tickets may share a slot
> only when they touch no file in common.

---

## What can run in parallel today

**Three sessions, and no more.** Every valid combination is `02` + `11` + one of the three
interface tickets:

| | session 1 | session 2 | session 3 |
|---|---|---|---|
| **option A** | `cross-store` **02** | `cross-store` **11** | `ui-polish` **13** |
| **option B** | `cross-store` **02** | `cross-store` **11** | `cpl` **98** |
| **option C** | `cross-store` **02** | `cross-store` **11** | `cpl` **129** |

13, 98 and 129 all conflict with each other, so exactly one of them may run. **04, 94 and 97
cannot join any of these** — see *Everything else is serial*.

### What each session owns

| ticket | owns |
|---|---|
| `cross-store` **02** — a renamed image is one finding | `compare/images.mjs`, `compare/vocabulary.mjs`, `compare/findings.mjs` + compare tests, `docs/adr/0027` |
| `cross-store` **11** — measure the flattening and the pairing | one new `crawl/probes/probe-11-*.mjs`, and its own ticket file |
| `ui-polish` **13** — touch targets and the header wrap | `ui/button.jsx`, `ui/checkbox.jsx`, `layouts/Shell.astro`, `StoreSwitcher.astro`, `OverrideControl.jsx`, `BulkControl.jsx`, `Annotate.jsx`, `Chips.jsx`, `Diff.jsx`, `RecordLayout.jsx`, `interface-weight.test.mjs` |
| `cpl` **98** — the Meta tab becomes a checklist | `Ledger.jsx`, `OverrideControl.jsx`, `ContentView.jsx`, `Repeats.jsx`, `lib/classes.mjs` |
| `cpl` **129** — a hint is reachable without a mouse | `Annotate.jsx`, `BulkControl.jsx`, `Chips.jsx`, `ContentView.jsx`, `Dashboard.jsx`, `Diff.jsx`, `Ledger.jsx`, `OverrideControl.jsx`, `Repeats.jsx` |

02 is already half-built in the working tree: `compare/*` modified, `docs/adr/0027` untracked.
98 is properly part of the meta chain and belongs after 97; running it now means building it
out of order.

Run **11** before 94/97 — its numbers go stale if a re-crawl lands under it.

---

## Everything else is serial

| ticket | why it has no partner |
|---|---|
| **94** → **97** | Data writers. 94 invalidates every extract on disk; from the moment it lands until a re-crawl finishes, the log cannot be built and every UI session loses its browser tests. They also share `compare/30-compare.mjs`. |
| **04** | Conflicts with 13 (`BulkControl.jsx`), with 98 and 129 (`Repeats.jsx`), and with 02 over the next free ADR number. |

---

## Conflicts among the open eight

A pair may share a slot only if it is **absent** here.

| pair | shared files |
|---|---|
| 02 × 04 | the next free ADR number |
| 02 × 97 | `compare.test.mjs` |
| 04 × 13 | `BulkControl.jsx` |
| 04 × 98 | `Repeats.jsx` |
| 04 × 129 | `BulkControl.jsx`, `Repeats.jsx` |
| 13 × 98 | `OverrideControl.jsx` |
| 13 × 129 | `Annotate.jsx`, `BulkControl.jsx`, `Chips.jsx`, `Diff.jsx`, `OverrideControl.jsx`, `StoreSwitcher.astro` |
| 94 × 97 | `30-compare.mjs` |
| 97 × 98 | `Ledger.jsx` |
| 97 × 129 | `Ledger.jsx` |
| 98 × 129 | `ContentView.jsx`, `Ledger.jsx`, `OverrideControl.jsx`, `Repeats.jsx` |

---

## Two rules that matter more than the table

1. **Stage explicit paths. Never `git add -A`, never `git commit -a`.** In a shared checkout the
   real hazard is not editing the same file, it is one session sweeping another's half-finished
   work into its commit. This repo has already been bitten — `ui-polish/12` is titled *A commit
   swept two staged deletions that were not its own*.
2. **`content-parity-log/map.md` and `CONTEXT.md` will conflict anyway.** Expect a one-line
   conflict per landing, or batch those updates separately from the code commits.

Before opening any session, check the tree is clean of a finished ticket nobody has committed —
a footprint table cannot see uncommitted work.

---

## The ADR-number caveat

`docs/adr/README.md` forbids a ticket from reserving an ADR number — it is taken by whoever
writes the file, as the next free one at that moment. **02** and **04** both need a new ADR, so
they cannot be written in parallel without agreeing the two numbers up front.

## One ticket path that is wrong

`ui-polish` **13** cites `web/src/components/Shell.astro`; the file is
`web/src/layouts/Shell.astro`. It also cites `BulkControl.jsx:122,133` for `size="xs"`; the real
ones are at `:207,220,310,322,379,598,641,648`.
