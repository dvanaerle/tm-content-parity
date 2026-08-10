# 51 — A seed pipeline that runs, and output that is tracked

Type: task
Status: resolved
Assignee: —
Blocked by: —
Parent: 50-content-page-discriminator.md

**What to build:** an engineer clones the repo, runs the seed generator, and gets
the same seed list that the log was built from. Today that is not possible. The
generator reads a directory that was never committed, so it stops with a file
error. It writes to a different directory than the one that all six consumers
read. And the directory the consumers read is ignored by git, so the file that
the whole pipeline depends on is not in version control.

This is a prefactor. It changes no rule and no number. Do it before ticket 53
touches the rule, or ticket 53 carries this work as well.

- [x] The generator and each consumer read and write the same directory. No
      consumer reads a path that no writer writes.
- [x] The seed list is tracked by git. The rest of the generated data stays
      ignored.
- [x] The generator names the input it needs, and stops with a clear message if
      the input is absent. It must not stop with a raw file error.
- [x] The stale self-reference in the generator's own output names the current
      script path.
- [x] Two probe scripts carry a second and different defect: they read a
      directory two levels above where the data is, so they resolve inside the
      crawl directory. Three sibling probes get it right. Correct the two, or say
      why not. Probes are evidence and are never imported, so this is not urgent —
      but it is a wrong path in a file that claims to hold a measurement.
- [x] The dead legacy pipeline of five scripts reads the same absent directory in
      twelve places. None of them is in the documented run sequence. Fix them or
      delete them, and say which. They must not look runnable when they are not.
- [x] The generator writes a summary file to the repository root. That file is not
      ignored by git and does not exist. Decide where it belongs.
- [x] **The generator uses `maintenanceReason()` and `MaintenanceError` from
      `crawl/fetch-page.mjs`.** Today it does its own raw `fetch` and matches its
      own local regex at `crawl/10-store-seeds.mjs:164-183`. Folded in from
      ticket 22 — see below.
- [x] `npm test` is green. No test changes behaviour in this ticket.

## Answer

The absent directory was `_data/`. The real one is `data/`. No `_data` reference
is left in any code file. The name survives in `.scratch/` prose, where it is
history and stays.

**The legacy pipeline is deleted, not repaired.** `crawl/01-parse-sitemap.mjs`
through `crawl/06-html.mjs` are gone. Six files, not five: `06-html.mjs` held no
`_data` reference but belonged to the same dead chain. None was in a run
sequence, none could run because its inputs are absent, and repairing the paths
would have left them looking runnable. Git history holds them.

**The summary file goes to `data/10-store-seeds.md`**, next to its JSON, and it
stays ignored. Only the seed list itself is tracked.

`.gitignore` now reads `data/*` and then `!data/10-store-seeds.json`. The
negation needs `data/*` and not `data/`: git does not look inside a directory it
has already excluded.

**The maintenance guard is now one rule and it aborts.** The private regex and
the `prodMaintenance`/`newMaintenance` flags are gone, with the count column and
the warning that read them. Nothing outside the generator read either. A
maintenance answer now raises `MaintenanceError`, the queue is drained so the run
does not ask nine hundred more times, and the script exits 3 **before** it
writes. The manual redirect stays, because the seed list records where a url
sends the reader; that is why the generator keeps its own `fetch` and does not
call `fetchPage`.

**Correction to "it changes no rule": the shared guard is wider than the private
one it replaced.** `maintenanceReason()` names every 500 and every 503 on the
status alone, before it reads a body. The private regex needed a matching body.
So a single transient 500 on one of about nine hundred urls now stops the whole
run, where before it was recorded as `prodStatus: 500`. This is the intended
direction — ticket 04 says a maintenance page is an error and never a page, and
recording-and-carrying-on is exactly how the phantom column was made — but it is
a widening and not a pure move. Whoever runs the generator will meet it.

**The tracked seed list is not reproducible from this tree, and it is not a
clean measurement.** Two things are true and both are for ticket 53:

- Neither input has a producer here. Deleting the baseline made that permanent
  rather than causing it: their own inputs were already gone. The generator now
  names the absent input and exits 2 instead of throwing ENOENT, which is what
  this ticket asked for, but "clone and run the generator" still ends at exit 2.
- The committed `data/10-store-seeds.json` is the run of 2026-08-06, made during
  the maintenance session. Its `prodStatus` column is phantom and it carries
  `prodMaintenance` flags in a shape the generator no longer writes. It is in git
  because every stage needs a page list to read, not because it is right.

`README.md` says both of these where an engineer will meet them.

No test was added. The generator is a top-level script with no seam to test at,
and the guard it now shares is the one `crawl/fetch-page.mjs` already holds.
`npm test` is green at 347 tests.

## The size of it, measured

**Eight files hold twenty references to the absent directory. Only one file is on
the live path**, and in three lines: it reads the sitemap, reads the Dutch
baseline, and writes the seed list. **The write is the drift** — five consumers
read the seed list from the other directory. The rest is the dead legacy pipeline
and two probes.

The absent directory is **not** ignored by git. It was never committed and it is
simply not there. So the seed list on disk cannot be produced by the generator in
the tree, and its two inputs are gone as well. One of those inputs held the 48
Dutch rows that no sitemap declares, which is why ticket 53 must carry them over
instead of making them again.

The generator also prints a provenance line that names a script path from another
repository layout. That is almost certainly where the whole drift came from.

## Folded in from ticket 22: one maintenance guard, not two

Triage of 2026-08-07 folded [22](22-remeasure-prod-status.md) into this ticket
and into [53](53-every-content-page-in-the-seed-list.md). 22 is not closed; it is
marked folded and points at both.

The generator holds a **second, private copy of the maintenance guard**.
`crawl/10-store-seeds.mjs:164-183` does a raw `fetch` and tests the body against
its own regex, `/the maintenance mode is enabled|Error 503: Service
Unavailable/i`. `crawl/fetch-page.mjs` already holds the same rule as
`maintenanceReason()`, and it throws `MaintenanceError`, which is ticket 04's
fail-loudly guard.

Two copies of one rule is the shape the review of ticket 38 found in
`crawl/seed-rows.mjs` and fixed there: one rule asked two ways, so the two can
disagree. Here the disagreement is worse than a wrong count. The private copy
**records** maintenance as a flag on the row and carries on; the shared one
**aborts**. That is how 451 phantom `prodStatus` values reached the seed file.

This is a move and not a new rule, which is why it belongs in this prefactor and
not in 53. 53 then does the measurement itself, on the rebuilt list.

## Why this is first

`AGENTS.md` says the contract changes first, then the code. This ticket changes
neither: it makes the existing code able to run. The measurement behind ticket 50
found that the committed seed list has no committed input and no committed self,
and that its generator has been unable to run since the move from `devdva02` on
2026-08-06. Every later ticket assumes it can run the generator and compare the
result.
