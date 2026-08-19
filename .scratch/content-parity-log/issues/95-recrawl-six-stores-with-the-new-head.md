# 95 — Re-crawl all six stores with the new head

Type: measure
Status: resolved 2026-08-19 — the run happened on branch
`ticket-93-no-route-exclusion-withdrawn`, over the extractor from `a3f5073`. It writes
no code, so what it leaves behind is the corpus: 816 extracts, all
`extractVersion: 2`. The gate is met. One number came in outside the range the gate
predicted — findings and work fell 13% and 19% — and that is recorded below
unexplained, because observing the run was this ticket's job and explaining the site
is not.
Blocked by: 94. (93 was the other blocker and no longer blocks anything: its abort
half landed in `feabe7c`, its exclusion half is out of scope. This ticket is still
needed — 94, not 93, is what invalidates every extract on disk.)
Parent: 58-axis-a-meta-check.md

**What this delivers:** every extract on disk carries `extractVersion` and the new
head fields, so ticket [97](97-the-meta-producer-one-finding-per-row.md) has data to
produce findings from and `measure.mjs` stops refusing. It writes no code.

**No build session.** This is a run, not a slice. Start it in the background and
wait. It gets its own ticket because the workflow rule is that a build ticket holds
no criterion beginning with *re-run* — and because this one can abort halfway
through and needs a retry budget of its own.

**Nothing else may run against `data/` while this runs.** It rewrites every extract
in place.

## Order and the abort

- [x] `nl --force` first. Check a sample of three extracts by hand: the raw robots
      string holds a value, and each field ticket 94 added is present and not
      `undefined`.
- [x] Then the other five stores. About 5 minutes for the request volume.
- [x] `MaintenanceError` is the one thing that aborts a store. Production has served
      the maintenance page on 446 of 451 urls for a whole session. If a store aborts,
      re-run that store; ticket 93 has already made the aborted run write its failure
      log, so the log names what was missed. That half of 93 shipped and stands.
- [x] Per store, record the extract count written, and whether the run was clean or
      retried. Paste it into this ticket.
- [x] `no-route` is **present** in the new extracts on all six stores, like any other
      page. Ticket 93's exclusion was withdrawn as out of scope on 2026-08-19 — the 404
      body is a CMS page an editor writes, and the new site has rewritten it. An absent
      `no-route` means a stale checkout still carries the exclusion; fix that before
      trusting the run.

`compare/link-status.mjs` needs no care here: ticket
[59](59-link-status-overwrite.md) made it refuse a store argument on 2026-08-07, so
the overwrite that used to threaten a multi-store sitting cannot be typed.

## The run, 2026-08-19

Six stores, `--force`, sequentially in one sitting: `nl`, `be_fr`, `be`, `de`, `fr`,
`uk`, from 17:09:50 to 17:11:37 local. **No store aborted** — no `MaintenanceError`,
so no store was retried. Every store wrote its failure log in the same pass.

| store | extracts | sides | version | failures | `no-route` | run |
| --- | --- | --- | --- | --- | --- | --- |
| `nl` | 179 | 358 | all 2 | 1 | present | clean |
| `be` | 130 | 260 | all 2 | 1 | present | clean |
| `be_fr` | 122 | 244 | all 2 | 0 | present | clean |
| `de` | 134 | 268 | all 2 | 0 | present | clean |
| `fr` | 123 | 246 | all 2 | 0 | present | clean |
| `uk` | 128 | 256 | all 2 | 1 | present | clean |
| **all** | **816** | **1,632** | **all 2** | **3** | six of six | no retry |

**The version column is the criterion that mattered and it is unanimous.** Every one of
the 1,632 page-sides on disk declares `extractVersion: 2`. No v1 file survived in a
corner the seed list no longer reaches — which was the way this run could have looked
done and left a silently-green head panel behind.

The three failures are page failures, not run failures, and each is recorded in
`data/extract-failures-<store>.json`:

- `nl/faq/offerte` and `be/faq/offerte` — `fetch failed`.
- `uk/(uk)measuring-tool` — no text, image or link inside the content boundary on an
  HTTP 200 page.

`data/` also holds a leftover `extract-failures-be-fr.json` from before the log was
named per store with an underscore. Nothing writes it now; it is not this run's record
and should not be read as one.

## What the run measured

`node compare/30-compare.mjs` ran to completion with no `ExtractTooOldError`, and
`node compare/measure.mjs nl` no longer refuses. **The gate is met.**

| | comparable | findings | work | clean pages |
| --- | --- | --- | --- | --- |
| `nl` | 125 | 6,387 | 3,069 | 4 |
| `be` | 123 | 5,902 | 2,781 | 9 |
| `be_fr` | 115 | 5,675 | 2,940 | 10 |
| `de` | 123 | 5,756 | 3,031 | 8 |
| `fr` | 117 | 5,570 | 2,853 | 10 |
| `uk` | 121 | 6,096 | 2,958 | 6 |
| **all** | **724** | **35,386** | **17,632** | **47** |

Against the gate's reference of 722 / ~40,802 / ~21,830: **comparable is +2**, and that
is the shape expected of a fresh crawl. **Findings are down 5,416 (-13.3%) and work is
down 4,198 (-19.2%)**, which is more movement than "expect movement" comfortably covers.
The head classes exist in the vocabulary and nothing emits them, so this run added no
class — the drop is the new site having changed under the corpus, or something narrowing
what is compared. This ticket observes it and does not explain it. **Whoever takes
[97](97-the-meta-producer-one-finding-per-row.md) inherits a corpus whose totals moved a
fifth, and should not read the 17,632 as continuous with the 21,830.**

**The drop is logged, not silent.** This compare run closed **5,704 observations** in
`history/run-log.jsonl` — `"gone":"2026-08-19T15:15..."` — against a findings fall of
5,416. So the findings did not vanish from the tally without the run log noticing them
go: each one is a named observation on a named page, and `git diff` on that file is the
list. That says the compare stage saw them disappear; it does not yet say why they did.

One observation on the run itself, recorded because the next person will size a crawl
from this ticket: each store took **8 to 11 seconds**, not the two minutes the runbook
predicts or the five this ticket did. `crawl/fetch-page.mjs` holds no cache, so these
were real fetches at concurrency 6 against hosts that answered fast.

## Reading list

- `crawl/21-crawl-store.mjs` — the CLI and `--force`
- `RUNBOOK.md` § the crawl order
- ticket 94's field list

## Gate

`node compare/measure.mjs nl` runs again and no longer refuses. The head classes exist
in the vocabulary but nothing emits them yet, so the counts should sit near where this
run finds them: **722 comparable, ~40,802 findings, ~21,830 work** over all six stores
as of 2026-08-19, `no-route` included. Expect movement beyond that — this is a fresh
crawl of a site that changes, and the point of the run is to observe it.
