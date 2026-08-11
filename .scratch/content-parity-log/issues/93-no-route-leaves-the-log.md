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
