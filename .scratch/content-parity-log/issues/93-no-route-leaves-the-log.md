# 93 — `no-route` leaves the log, and an aborted run writes its failures

Type: build
Status: resolved 2026-08-19 — built on branch `ticket-104-search-page-scope`. See the answer.
Blocked by: 91
Parent: 58-axis-a-meta-check.md

**What to build:** `no-route` is production's 404 page compared against the new
site's 404 page. Both sides answer 200, so the status gate never sees it, and it
emits about 25 findings in every one of the six stores. After this ticket it is
excluded with a stated reason, and an editor opening a store dashboard finds it
named under **Niet gecontroleerd** rather than silently gone.

The second half is a data defect found beside it: `21-crawl-store.mjs` writes the
failure log **after** the early return on `MaintenanceError`, so an aborted run
leaves the previous run's failures on disk and the file lies about the run that
just happened.

This is the prefactor. It removes findings; the meta check adds them. They are
measured apart, because one number would hide both — as ticket 33 found.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `shared/excluded-pages.mjs` — the list, which holds one entry today
- `crawl/21-crawl-store.mjs` — the early return and the failure-log write
- `web/src/lib/not-checked.mjs` and its test — what the dashboard list is built from
- `56-an-excluded-page-says-why.md` — the reason string already has a shape

Ticket 20 owns the 404 cell. Cross-reference it; do not change it.

## Ticket 91's table — what excluding `no-route` actually removes

Measured 2026-08-14 by `crawl/probes/probe-91-meta-classes.mjs` against `data/reports/`
as it stands: 816 reports, **722 comparable**, 40,947 findings, 22,003 `work`.

**The number in the ticket above is wrong, and so is ticket 58's.** Both say `no-route`
emits about 25 findings in every one of the six stores, which is ticket 21's figure of
2026-08-07 — 25 findings, 15 shown, per store, so about 150 over six. It is now
**85 findings over six stores, 34 of them work.** Roughly 14 a store, not 25.

| store | findings | work |
|---|---|---|
| `nl` | 14 | 5 |
| `be` | 14 | 5 |
| `be_fr` | 14 | 6 |
| `de` | 15 | 7 |
| `fr` | 14 | 6 |
| `uk` | 14 | 5 |
| **total** | **85** | **34** |

That is **0.21%** of findings and **0.15%** of work. Expect the gate to read 40,862
findings and 21,969 work afterwards, and **722 comparable pages to become 716**.

The gate above is `node compare/measure.mjs nl`, so here is the per-store baseline it
is read against, and what each store must show afterwards. **Nothing but the
`no-route` row may move.**

| store | comparable | findings | work | → comparable | → findings | → work |
|---|---|---|---|---|---|---|
| `nl` | 124 | 7,354 | 3,832 | 123 | 7,340 | 3,827 |
| `be` | 122 | 6,571 | 3,293 | 121 | 6,557 | 3,288 |
| `be_fr` | 115 | 6,607 | 3,645 | 114 | 6,593 | 3,639 |
| `de` | 123 | 6,780 | 3,873 | 122 | 6,765 | 3,866 |
| `fr` | 117 | 6,522 | 3,614 | 116 | 6,508 | 3,608 |
| `uk` | 121 | 7,113 | 3,746 | 120 | 7,099 | 3,741 |
| **all** | **722** | **40,947** | **22,003** | **716** | **40,862** | **21,969** |

`nl` by class, as the example:

| count | visibility | class |
|---|---|---|
| 6 | `information` | `text-added` |
| 4 | `work` | `text-missing` |
| 3 | `information` | `extra-link` |
| 1 | `work` | `alt-lost` |

The drop is smaller than ticket 58 budgeted for, and that matters to its arithmetic:
step 1 removes 85 findings, not ~150, while step 2 adds 197. `no-route` also carries
**3 meta findings** of its own — two `meta-title-changed` and one
`meta-description-changed`, on `be_fr` and `fr` — so if this ticket lands first, ticket
[97](97-the-meta-producer-one-finding-per-row.md) should expect 194 meta findings over
716 pages rather than 197 over 722.

**Nothing here changes what this ticket builds.** `no-route` is still production's 404
page against the new site's 404 page, both sides still answer 200, and the status gate
still cannot see it. Only the size of the removal moved.

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- <file>` and show the red before you write the implementation. Then the
next criterion. Do not plan across all four.

- [x] 1 `no-route` is in the exclusion list with its reason — that both sides answer
      200 with a 404 page, so the status gate cannot see it.
- [x] 2 It appears in the **Niet gecontroleerd** list on every store dashboard,
      carrying that reason.
- [x] 3 A run that aborts on `MaintenanceError` writes its failure log. The write
      moves above the early return.
- [x] 4 The aborted-run case is covered by a test, not by the order of two
      statements. A rule with no test is not a rule.

## Gate

`npm test`, then `node compare/measure.mjs nl`.

The per-store drop matches ticket 91's `no-route` table, and **nothing else moves**.
A ticket that adds no rule must move no other number.

## Answer

`no-route` is out of the log with its reason, it is named under **Niet
gecontroleerd** on all six dashboards, and an aborted crawl now writes its own
failure log. All four slices met.

### The removal is exactly ticket 91's table, and nothing else moved

The corpus has moved since 91 measured it on 2026-08-14, so the **absolute**
figures in the table above are stale — the baseline this ran against was already
40,805 findings and 21,833 work, not 40,947 and 22,003. The **delta** is the
table's delta to the finding, per store:

| store | comparable | findings | work | → comparable | → findings | → work | Δ findings | Δ work |
|---|---|---|---|---|---|---|---|---|
| `nl` | 124 | 7,348 | 3,815 | 123 | 7,334 | 3,810 | −14 | −5 |
| `be` | 122 | 6,573 | 3,283 | 121 | 6,559 | 3,278 | −14 | −5 |
| `be_fr` | 115 | 6,569 | 3,611 | 114 | 6,555 | 3,605 | −14 | −6 |
| `de` | 123 | 6,749 | 3,831 | 122 | 6,734 | 3,824 | −15 | −7 |
| `fr` | 117 | 6,485 | 3,580 | 116 | 6,471 | 3,574 | −14 | −6 |
| `uk` | 121 | 7,081 | 3,713 | 120 | 7,067 | 3,708 | −14 | −5 |
| **all** | **722** | **40,805** | **21,833** | **716** | **40,720** | **21,799** | **−85** | **−34** |

Every store lost one comparable page and its own `no-route` row and nothing
besides: **85 findings and 34 work**, which is ticket 91's figure per store
(14/5, 14/5, 14/6, 15/7, 14/6, 14/5). 722 comparable became 716.

Ticket 97 should therefore read this as confirmed: it faces **716** pages, not
722.

### What was built

- **`shared/excluded-pages.mjs`** holds a second entry. The header said the list
  was for *application pages*; `no-route` is not one, so it now names the second
  reason a page belongs here — the compare stage's status gate cannot reach a page
  that **is** the 404 page, because both sides answer 200.
- **`crawl/21-crawl-store.mjs`** writes the failure log **before** the
  `MaintenanceError` return, and `crawlStore()` is exported and takes every
  boundary it crosses — the seed file, the extract function, and the two
  directories — as an argument with a default. That is what let the aborted case
  become a test instead of the order of two statements. The CLI passes
  `{ store, force }`, and **`crawl/21-crawl-store.test.mjs`** is new: a whole
  crawl run driven over a temp directory with no network, which is more fixture
  than belongs in `extract.test.mjs`.

### Slice 2 needed no code

`notCheckedInStore()` already merges the committed list per store, and `no-route`
has both sides on all six stores, so slice 1 carried slice 2. The corpus test in
`web/src/lib/not-checked.test.mjs` locks it: for every store the page is
`excluded-page` with the committed reason. Without it the dashboard would file the
404 page as `not-crawled` — *a failed fetch* — which is exactly the silence the
ticket forbids.

### The extracts and the reports were deleted, not left to rot

`data/` is untracked past four files, so this is a local corpus change and not
part of the commit. `data/extract/*/no-route.json` and
`data/reports/*__no-route.json` are gone, six of each. The extract had to go with
the report: `30-compare.mjs` does not consult the exclusion list, so a surviving
extract would have rebuilt the report on the next run and undone the ticket
silently. Deleting both is the state `veranda-configurator` is already in — the
excluded page has neither.

`data/snapshot.json` and the run log were **not** rebuilt, because a build that
only re-compares is not an observation. They will drop the 85 findings on the next
real run, which will also mark those finding ids no longer seen.

### The 404 cell is untouched, as ticket 20 owns it

The cross-reference the ticket asked for. A **404 cell** is a seed cell the store
claims in its own sitemap and the new site does not serve — 34 of them, nl 14, be
8, be_fr 4, de 3, fr 3, uk 2 (ticket 11). That is a migration defect on a page
that exists, and `skipReason()` already keeps it out of the log by its status.

`no-route` is not one of those. It is the 404 **template**, the page a store serves
*for* a missing URL, and both its sides answer 200 — which is exactly why the gate
that handles the 34 cannot handle it. Nothing here reads or writes a 404 cell:
`data/10-store-seeds.json` is unchanged and `skipReason()` is unchanged.

### Recorded and not fixed: the removal rests on the deletion, not on a rule

`isExcludedPage()` is read by `crawl/`, and by `crawl/` only. `30-compare.mjs`
never consults the exclusion list, so an extract that survives on disk still
becomes a report. Nothing in code stops an excluded page re-entering the log —
what stops it here is that the crawler will not fetch `no-route` again, so the
extract cannot come back. That is the state `veranda-configurator` has been in
since ticket 19 and it has held, but it is a property of the corpus rather than a
rule with a test. Giving the compare stage the same gate the crawler has is one
small change in a file this ticket's reading list does not name; it wants its own
ticket.

`crawlStore()`'s return also grew `jobs`, `written` and `failures` on the abort
path. It already carried all three on the success path, so this is the two paths
agreeing on one shape rather than new surface, and no caller reads more than
`aborted`.

### The gate

| | before | after |
|---|---|---|
| `npm test` | 1,304 in 60 files | **1,308 in 61 files** |
| `node compare/measure.mjs` | 722 comparable, 40,805 findings, 21,833 work | **716, 40,720, 21,799** |
| `npm run typecheck` | clean | clean |
