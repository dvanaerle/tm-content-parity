# 77 — A finding says when it was first seen

Type: task
Status: resolved 2026-08-18 — built on `ticket-104-search-page-scope`. Every criterion
met, with **two deviations**, both recorded below. The labels are English, not Dutch:
ADR 0014 landed after this ticket was written and the interface speaks one language on
all six stores, so *eerst gezien* is **first seen** and the stopword guard in
`interface-language.test.mjs` would have refused the Dutch. And **no rendered finding
says *no longer seen***: a finding drawn on a page is in the snapshot being drawn, by
construction, and the index is routinely older than the reports beside it — so the mark
would have been a lie on the one case that can reach a row. The fact lives where it is
true, on the index row and in the run's own output. Third: the writer is
`compare/run-log.mjs` and **not `crawl/`** — a finding id does not exist until the
comparison has run, so a module under `crawl/` that `compare/` and `web/` both import is
the back-arrow ADR 0001 refuses. ADR 0004 is amended to say so, along with the grain of
*seen*, which is the store and not the page.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor opens a page and each finding says how long it has been
there. A finding first seen this morning reads differently from one that has been
there since the first crawl, and today the log cannot tell them apart.

Every rule is in
[ADR 0004](../../../docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md).
**Read it first.**

## The decision this ticket carries

A **run log**: a committed index keyed on the finding id alone. It holds three facts
for each id — first seen, whether the current snapshot holds it, and last seen. It
holds no text, no decision and no relation between two ids.

The index is rewritten at each run and **git history is the archive**. That is the
whole storage decision. A per-run file grows without bound; a Supabase table would
make the crawl an author in the table that holds editors' judgements, which is the
distinction ticket 09 rests on.

**It never re-attaches.** It cannot say that a new finding is an old finding with
edited text, and no threshold, score or heuristic may be added to make it try. Ticket
01 refused that pass by name, and the reason is the direction of failure: a wrong
match carries a dismissal onto text nobody dismissed, and it fails silently.

## What it delivers

- The crawl writes the index. `crawl/` writes, `compare/` and `web/` read, so the
  arrow still points one way and nothing imports back up it.
- The contract types the index, because `compare/contract.mjs` is the contract and it
  changes before the code that reads it.
- A finding in the content view and in the ledger says **eerst gezien** with a date.
- A finding whose id the current snapshot does not hold is **niet meer gezien**. It is
  not a decision and nobody made it, so it must not read as one.

## Acceptance criteria

- [x] The index is one committed file per corpus, keyed on the finding id, holding the
      store, the page, the class, the first observation id and the last observation id.
      No text and no decision.
- [x] The crawl writes it after the comparison, and a run that aborts leaves the
      previous index intact rather than half-written.
- [x] A second run of the same corpus with no site change moves **no** first-seen date.
      This is the regression gate: an index that churns on an unchanged site is broken.
- [x] A finding new in the second run has that run's date, and a finding absent from it
      is marked and keeps its last-seen date.
- [x] The page view shows the date on every finding. A finding with no row in the index
      says nothing rather than guessing, because an index older than the report is the
      normal case on a fresh clone.
- [x] The index is in git and `data/` is not, so the file goes where a committed
      artefact goes and the answer says why that location was chosen.
- [x] Nothing in the pipeline compares two texts to decide whether two ids are related.
      A test asserts the index derivation is a pure function of the finding ids in the
      snapshot and the previous index — nothing else.
- [x] `npm test` passes and the corpus totals are unmoved. This ticket adds a record;
      it must not disturb a count.

## Traps

- **A dismissal still detaches when the text changes.** That is ticket 01 and this
  ticket does not amend it. The run log makes the *history* visible; it does not make
  the *judgement* survive. Do not let the interface imply otherwise.
- **The index grows monotonically.** About 33,500 rows today, near 60,000 after ticket
  50 takes the corpus to about 800 store-pages, then growing with text churn. It needs
  no pruning at that size. If a rule seems needed, that is a new decision in the ADR
  and not a smaller file.
- **Ticket 54 changes page keys.** A page with a Dutch url key keeps its key byte for
  byte, so existing ids survive; pages that gain a new key produce new ids and new
  rows. Expect a step in the index size when 54 lands, and do not read it as churn.
- Observation ids sort chronologically by construction, so the comparison is a string
  comparison. Do not parse a date.
