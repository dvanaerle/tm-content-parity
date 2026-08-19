# 95 — Re-crawl all six stores with the new head

Type: measure
Status: resolved 2026-08-19 — the run happened on branch
`ticket-93-no-route-exclusion-withdrawn`, over the extractor from `a3f5073`. It writes
no code, so what it leaves behind is the corpus: 816 extracts, all
`extractVersion: 2`. The gate is met. Findings and work fell 13% and 19%, outside the
range the gate predicted, and the cause is identified below: four fifths of it is
`71a6cea` taking effect, not the site changing.
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

**Four fifths of the drop is `71a6cea`, not the site.** "An opening link is not a link,
and the gallery goes quiet" stopped a gallery's opening anchors becoming link records.
It edits `crawl/extract.mjs`, so it changes nothing until a re-crawl — and this is the
re-crawl. Of the 5,704 observations this run closed, **4,568 are `missing-link` or
`extra-link`, and 4,089 of those sit on a gallery page**. That is the rule landing, and
it landed in every store at once because every store has galleries.

The first reading of this number in this ticket said the drop could not be this build's,
on the grounds that no class was added. **That reasoning was wrong and is corrected
here:** a class being added is not the only way a build moves a count. Removing a
*record* moves it too, and the extractor is where the removal lives, so a rule merged
five days ago shows up in the tally on the day someone re-crawls. A gate that predicts
findings has to be read against every extractor commit since the number was set, not
only against the vocabulary.

**The rest is small and looks like content work.** 837 `text-missing` closures over 132
pages, led by `shading-panel` at 32 to 39 closures in five stores and
`downloads`/`telechargements` at 26 — one shared block fixed once, showing up in every
store that derives it. That is what an editor resolving a page looks like here, and it
is about 15% of the movement rather than the cause of it.

**Whoever takes [97](97-the-meta-producer-one-finding-per-row.md) inherits a corpus
whose totals moved a fifth for a reason that is now known**, and should set a fresh
reference from the 724 / 35,386 / 17,632 above rather than reconciling against 21,830.

**The drop is logged, not silent, and the log is what identified it.** This compare run
closed **5,704 observations** in `history/run-log.jsonl` — `"gone":"2026-08-19T15:15..."`
— and opened 288. Each closure carries its store, page and class, so the run log is not
just a record that the number moved: it is the evidence of *what* moved, and tallying it
by class and page is what found `71a6cea` above. `git diff 27b7d26^ history/run-log.jsonl`
is the list.

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
