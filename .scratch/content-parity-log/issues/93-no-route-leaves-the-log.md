# 93 — `no-route` leaves the log, and an aborted run writes its failures

Type: build
Status: ready-for-agent
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

Measured 2026-08-14 by `crawl/probes/probe-meta-classes.mjs` against `data/reports/`
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

- [ ] 1 `no-route` is in the exclusion list with its reason — that both sides answer
      200 with a 404 page, so the status gate cannot see it.
- [ ] 2 It appears in the **Niet gecontroleerd** list on every store dashboard,
      carrying that reason.
- [ ] 3 A run that aborts on `MaintenanceError` writes its failure log. The write
      moves above the early return.
- [ ] 4 The aborted-run case is covered by a test, not by the order of two
      statements. A rule with no test is not a rule.

## Gate

`npm test`, then `node compare/measure.mjs nl`.

The per-store drop matches ticket 91's `no-route` table, and **nothing else moves**.
A ticket that adds no rule must move no other number.
