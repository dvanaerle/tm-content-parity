# 01 — Measure finding churn

Type: research
Status: resolved 2026-08-19 — measured; see `## Answer` below and `../CHURN.md`. The corpus is 21
minutes long, so two criteria are answered as unanswerable and stated as such.
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

A number, and the page list behind it: how many findings live only a day or two before their
id expires.

A finding id is content-addressed and expires on purpose when either side's text changes. If a
store-scoped mechanism — a custom variable, a rotating promotion — sits inside the content
boundary, its findings expire on every crawl, every dismissal on them detaches, and the same
question is asked again forever. That is the same complaint this whole effort answers, arriving
from a direction neither original idea anticipated.

Nothing is built. The run log already holds `firstSeen`, `lastSeen`, `seen` and `retiredAt` per
finding id, so this is a probe over data on disk. No crawl, no new source, no production code.

Run this first. A corpus full of one-day findings would change what the rest of this effort is
worth.

## Criteria

- [x] The distribution of finding lifespans over the corpus, as a table: how many ids lived one
      run, two runs, and so on.
- [x] The pages that produce the most short-lived findings, ranked, with their store.
- [x] The classes those findings carry, so that a rule misfire can be told from a moving page.
- [~] How many **dismissals** in the override log are keyed on an id that no longer exists, and
      how many of those expired within two runs of being written. That is the cost, stated in
      the only unit an editor feels.
      **Half answered.** 132 of 829 standing dismissals key on an id that no longer exists.
      *Within two runs of being written* is not answerable: all 132 predate the run log.
- [x] The numbers written into this ticket under an `## Answer` heading, with the date and the
      corpus size, so that a later reader knows what was true when.
- [x] A one-paragraph reading: does churn outrank decision repetition, or not.

## Traps

- **This is a probe, not a feature.** Probes in this repo are explicitly throwaway. Do not add a
  screen, a class or a column.
- **A retired id is not a decision.** *No longer seen* is a fact and nobody made it. Do not
  report expiry as if an editor closed something.
- **Do not try to re-attach.** The run log holds no relation between two ids and must not gain
  one. If two ids look like the same defect with edited text, that is a hunch and it stays out
  of the answer.
- **Read the whole corpus, not one store.** Churn on `nl` says nothing about `de`.

## Where it came from

A grilling session, 2026-08-19. The custom-variable objection — that a shared record can render
different words per store, and those words can change daily — raised the question of whether
those units are churning findings today. Nobody has measured it.

## Answer

**Measured 2026-08-19.** Full working, with every source and code path cited, in
[`../CHURN.md`](../CHURN.md). Scripts: `.scratch/cross-store-reuse/churn-probe*.mjs`.

**Corpus size.** `history/run-log.jsonl`: **40,829 rows**, of which 40,824 are still seen.
816 page reports in `data/reports`, all carrying observation
`2026-08-18T12:17:11.051Z-62ec9d28`; the still-seen ids and the report ids are the same
40,824-member set. Override log: `data/overrides-backup-2026-08-18T09-46-51-393Z.json`,
1,618 events, **829 standing dismissals** after collapsing latest-per-key with `eventKey()`.

**First, a correction to this ticket's premise.** The run log holds **two** observation ids,
21 minutes apart on the same day: `…11:55:50.629Z-2fd9b259` and `…12:17:11.051Z-62ec9d28`.
`git log --follow` on the file returns one commit (`da69c7b`, 2026-08-18 14:26 +02:00) — the
index was created that day, and the 15 earlier runs the override log names (2026-08-06 to
2026-08-17) left no survival record. **The corpus is 21 minutes long, so it cannot say how
many findings live only a day or two.** Two further field corrections: `firstSeen` /
`lastSeen` / `seen` / `retiredAt` are decoded names, not stored ones — the file stores
`first`, plus `last`/`gone` only on a row no longer seen, and `seen` and a still-seen row's
`lastSeen` are derived in `decodeRunLog()`. And a **run** is an *observation*
(`observationForRun()`), so a rule change that alters `prodNorm`/`newNorm` expires an id
**without crossing a run boundary at all** — the run log is structurally blind to that
expiry, and it is the expiry that turns out to matter.

### Lifespan distribution

| lifespan | ids | share |
|---|---|---|
| 1 run | 4 | 0.010% |
| 2 runs | 40,825 | 99.990% |

The 4 one-run ids arrived *in* run 2 and are still seen — new, not short-lived. Per store,
rows / still seen / no longer seen: `nl` 7,348 / 7,348 / 0 · `uk` 7,086 / 7,086 / 0 ·
`de` 6,757 / 6,757 / 0 · `be` 6,577 / 6,573 / **4** · `be_fr` 6,573 / 6,572 / **1** ·
`fr` 6,488 / 6,488 / 0.

### The pages producing them, ranked, with their store

Five ids in the whole corpus stopped being seen, on five pages, one each — so the ranking is
a five-way tie and not a ranking:

| ids | store | page | class |
|---|---|---|---|
| 1 | `be` | `zonwering/prijzen` | `broken-link` |
| 1 | `be` | `tuinhuis-met-overkapping` | `broken-link` |
| 1 | `be` | `zonwering/buiten` | `broken-link` |
| 1 | `be` | `glazen-schuifdeur` | `broken-link` |
| 1 | `be_fr` | `(be_fr)fr/retractation/recu/retourner` | `broken-link` |

The mirror image, 4 ids first seen in run 2, are all `missing-link`:
`be terrasoverkapping/productinformatie`, `uk reviews`,
`nl glazen-schuifwand/productinformatie`, `be glazen-schuifwand/productinformatie`.

### The classes those findings carry

**5 of 5 `broken-link`; 4 of 4 arriving `missing-link`.** These are the only two classes in
the corpus whose input is a live HTTP status rather than page text
(`compare/link-status.mjs`, `data/link-status.json`), so this reads as a transient server
answer — not a moving page, and not a rule misfire. The other 20 classes did not move.
Census over the 40,824 still-seen ids, by `visibilityOf()`: 21,833 work, 16,332 information,
2,659 diagnostic.

### Dismissal orphans

| | count | share |
|---|---|---|
| standing dismissals | 829 | — |
| keyed on an id absent from the current snapshot | **132** | **15.9%** |
| …whose page has left the corpus | 0 | 0% |
| …the run log holds as no longer seen | 0 | 0% |
| …that expired within two runs of being written | **0 recorded** | not measurable |

Per store: `nl` 86 of 560 (15.4%) · `uk` 34 of 197 (17.3%) · `be` 12 of 72 (16.7%) ·
`be_fr`, `de`, `fr` 0 of 0. Concentrated: `nl glazen-schuifwand` alone carries 21 of the 132,
then `nl downloads` 5, `nl steel-look-glazen-schuifwand/productinformatie` 4,
`uk (uk)veranda/sidewall` 4.

**Two criteria are unanswerable from the data on disk.** (1) *Within two runs of being
written*: all 132 predate the run log, so nothing recorded which observation stopped seeing
them; the 0 is an absence of record, and because a rule change expires an id with no new
crawl, most of these never crossed a run boundary to be counted at. (2) *The classes the 132
carry*: a finding-scope override row has `class: null` by design (`overrides/state.mjs`) —
0 of 132 carry one — and the class is a term inside a truncated sha256, so it cannot be read
back either.

**What the 132 are, on the evidence.** Orphan share by day written collapses with recency:
08-11 39.4% (56/142), 08-12 13.4%, 08-13 17.4%, 08-14 4.6%, **08-17 and 08-18 0% (0 of 23)**.
Content churn would decay smoothly with age; this does not. `git log` names the alternative
in its own subject lines, all landed 2026-08-18 before run 1: `6bb6854` "…and **18
dismissals detach**", `e36eb05` "…and **52 dismissals detach**", plus `0954488` "The log
reads one width, and the second copy of a block goes". **70 of the 132 are claimed outright
by two commits that changed the comparison rules.** The 15.9% is rule-change detachment, not
content churn, and it stops when the rules settle.

### The reading

**Churn does not outrank decision repetition — not on this corpus, and not by an order of
magnitude.** Repetition is the standing shape of the work: 21,833 work findings are live now,
and `CONTEXT.md` records that 11,162 of 22,048 sit in a block-spanning repeat with the
distinct decisions an editor owes falling 16,881 → 12,722 once one grouping rule applies —
roughly 4,159 decisions removed by a single rule, against twelve thousand still outstanding.
Churn over the same twelve days costs 132 detached dismissals, 15.9% of the 829 decisions
ever made, and 70 of those are accounted for by two commits that changed the extraction rules
on a day when the rules were being changed hourly. Nothing in the run log shows text-driven
expiry at all: over 21 minutes and six stores, 5 ids of 40,829 stopped being seen and 4
arrived, all nine in the two classes fed by an HTTP status rather than by page text. So the
premise of this effort survives, with one honest caveat — the number that would settle it
either way does not exist yet, because the index is one day old, and the cheapest response is
to let it accumulate and re-run this probe in a fortnight. The one thing here worth acting on
is not churn: dismissals exist in three of six stores and 21 of the 132 orphans sit on one
page, `nl glazen-schuifwand`, so the cost of expiry today is concentrated in a handful of
pages an editor has actually worked, and not spread over the corpus.
