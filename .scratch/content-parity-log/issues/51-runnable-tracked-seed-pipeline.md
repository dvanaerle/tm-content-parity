# 51 — A seed pipeline that runs, and output that is tracked

Type: task
Status: ready-for-agent
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

- [ ] The generator and each consumer read and write the same directory. No
      consumer reads a path that no writer writes.
- [ ] The seed list is tracked by git. The rest of the generated data stays
      ignored.
- [ ] The generator names the input it needs, and stops with a clear message if
      the input is absent. It must not stop with a raw file error.
- [ ] The stale self-reference in the generator's own output names the current
      script path.
- [ ] Two probe scripts carry a second and different defect: they read a
      directory two levels above where the data is, so they resolve inside the
      crawl directory. Three sibling probes get it right. Correct the two, or say
      why not. Probes are evidence and are never imported, so this is not urgent —
      but it is a wrong path in a file that claims to hold a measurement.
- [ ] The dead legacy pipeline of five scripts reads the same absent directory in
      twelve places. None of them is in the documented run sequence. Fix them or
      delete them, and say which. They must not look runnable when they are not.
- [ ] The generator writes a summary file to the repository root. That file is not
      ignored by git and does not exist. Decide where it belongs.
- [ ] `npm test` is green. No test changes behaviour in this ticket.

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

## Why this is first

`AGENTS.md` says the contract changes first, then the code. This ticket changes
neither: it makes the existing code able to run. The measurement behind ticket 50
found that the committed seed list has no committed input and no committed self,
and that its generator has been unable to run since the move from `devdva02` on
2026-08-06. Every later ticket assumes it can run the generator and compare the
result.
