# 95 — Re-crawl all six stores with the new head

Type: measure
Status: ready-for-agent
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

- [ ] `nl --force` first. Check a sample of three extracts by hand: the raw robots
      string holds a value, and each field ticket 94 added is present and not
      `undefined`.
- [ ] Then the other five stores. About 5 minutes for the request volume.
- [ ] `MaintenanceError` is the one thing that aborts a store. Production has served
      the maintenance page on 446 of 451 urls for a whole session. If a store aborts,
      re-run that store; ticket 93 has already made the aborted run write its failure
      log, so the log names what was missed. That half of 93 shipped and stands.
- [ ] Per store, record the extract count written, and whether the run was clean or
      retried. Paste it into this ticket.
- [ ] `no-route` is **present** in the new extracts on all six stores, like any other
      page. Ticket 93's exclusion was withdrawn as out of scope on 2026-08-19 — the 404
      body is a CMS page an editor writes, and the new site has rewritten it. An absent
      `no-route` means a stale checkout still carries the exclusion; fix that before
      trusting the run.

`compare/link-status.mjs` needs no care here: ticket
[59](59-link-status-overwrite.md) made it refuse a store argument on 2026-08-07, so
the overwrite that used to threaten a multi-store sitting cannot be typed.

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
