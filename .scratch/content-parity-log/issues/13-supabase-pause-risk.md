# 13 — Keeping the Supabase project awake

Type: grilling
Status: resolved
Resolved: 2026-08-07 — decided and built. One verification is still open: see
"Still unproven — the cron".
Blocked by: —
Parent: ../map.md

## Question

How is the silent-pause failure handled? A Supabase free project pauses after
about 7 days with no database activity, and the failure is invisible to editors.

Graduated from ticket 03, which found this.

## Why it matters more than it sounds

A paused project does not show an error to a content editor. The page still loads,
because the page is static. Only the override log stops working. So:

- Ticks and dismissals appear to save, then vanish.
- Findings an editor already judged as false positives come back as open.
- The progress roll-up falls instead of rising.

That is the exact failure that destroys trust in the log, and it looks identical to
a bug in the comparison rules. Nobody would suspect the database.

Restoring is a manual click in the Supabase dashboard, available for up to a year,
with data intact. So the data is safe. The problem is detection, not loss.

## Options

- **Accept it.** Editor activity may be enough on its own. Cheapest, and it fails
  silently when it fails.
- **Scheduled keep-alive.** Any free cron service, or a GitHub Action, hitting the
  REST endpoint a few times a week. Note the static webhosting cannot schedule
  anything, so this must live outside it.
- **Ping from the local re-check service.** Free, but only fires when someone runs
  it locally, which is precisely not the case during a quiet week.
- **Upgrade to Pro**, about $25 a month, which removes pausing entirely.

## What to settle

- Which mitigation, and who owns it.
- **Independently of the mitigation: how does the app detect and show a write
  failure?** Even with a keep-alive, a failed write must tell the editor rather
  than pretend to succeed. This part is arguably not optional, because the same
  handling covers a dropped network and a Supabase outage.
- Whether the app should warn when the log looks stale, for example no events at
  all in the last fortnight.

## Notes

Evidence: [`../research/supabase-override-log.md`](../research/supabase-override-log.md),
section 1, sourced from Supabase's free-project-pausing documentation, checked
2026-08-06.

Resolve with `/grilling`. Small, and pairs naturally with ticket 09 (task
lifecycle).

## Answer

**Stay on the free plan. Stop the pause with a daily GitHub Action that writes
one row to a `keepalive` table. Accept a pause as survivable if the Action
stops.**

### Two of the three questions were already answered

The ticket asks three things. Only the first was still open.

- **How does the app show a write failure?** Built by spec 29, before this
  ticket was resolved. `overrides/supabase.mjs:106` throws on a failed read and
  on a failed write, with the Supabase error as `cause`. A failed read does not
  give an empty list, because an empty list means "nobody did anything".
  `web/src/lib/overrides.mjs:110` puts the event in local state **after** the
  insert resolves, so there is no optimistic write to take back. `canWrite`
  makes the controls read-only when the log is not healthy, so a click is
  refused instead of lost. `LogBanner` in `web/src/components/Progress.jsx`
  shows three states in Dutch. This ticket does not decide it again.
- **A staleness warning?** No. See "Refused" below.

### Free, not Pro

Pro removes the pause and costs about $25 each month. This is a test project
with one database, and the free plan is sufficient for the data. The pause is a
detection problem, not a data problem: the data stays for up to a year and a
human clicks Resume. Money is the wrong tool for a detection problem.

### The ping writes, it does not read

The keep-alive **inserts a row**. It does not do a select.

`../research/supabase-override-log.md`, line 175, records that it is
**not verified** whether read-only select traffic counts as sufficient database
activity. A keep-alive built on that assumption can fail in the exact shape of
the fault it prevents: quiet, and only visible weeks later. An insert is
database activity with no assumption under it.

### The ping does not touch `overrides`

Ticket 09 makes `overrides` an append-only ledger where the latest event for
each `(scope, key)` wins. A row written for a hosting reason has no scope and no
key that means anything, and it would enter the derivation and the progress bar.
So the ping gets its own table:

- `keepalive`, with `id` and `created_at default now()`. **No other columns.**
- RLS on, with one policy: insert for `anon`, `with check (true)`.
- Insert only. No pruning. One row each day is 365 rows each year against a
  500 MB plan.

Anybody who holds the anon key can insert. The key is public by design — ticket
30 records this, and it is baked into the static build. Because the table holds
no value, the only possible damage is row count, and row count against 500 MB on
one unnamed table is not a threat. There is no free-text column to abuse.

`keepalive` is **not** in `CONTEXT.md`. It is not parity vocabulary; it exists
because a hosting plan switches databases off. The comment at the top of
`supabase/keepalive.sql` says why.

**It is its own file, not part of `supabase/schema.sql`.** That file begins with
`drop view` and `drop table overrides`, and ticket 30 tells a human to run it
whole. Putting the keep-alive in it would make "apply the keep-alive" a step
that can delete the override log. There is no select policy either, because
nothing reads `keepalive`.

### The workflow

- One insert each day, plus `workflow_dispatch` so the insert can be proved
  today without waiting for the cron.
- **It fails on a 4xx and on a 5xx**, and prints what the server said. A ping
  that swallows its own error is a green check that means nothing, which is the
  same lie as a tick that appears to save. A trailing slash on the URL secret is
  trimmed, because `//rest/v1/keepalive` redirects and curl would exit 0 on it.
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` come from repository
  secrets. Not for secrecy — the key is public — but for rotation, and because
  the habit stops a `sb_secret_…` key from being pasted into a workflow file.
- The repository is private, so the runs use the 2,000 free minutes each month.
  A daily run of a few seconds is about 30 minutes each month.
- Daily, not twice each week. GitHub's cron is best effort and drops or delays
  runs. The pause threshold is about 7 days, so a daily ping gives six spare
  failures. The runs cost nothing.

### Accepted, not solved

**GitHub disables a scheduled workflow after 60 days with no repository
activity.** It sends an e-mail and does not fail. So the keep-alive can die in
the same quiet shape as the fault it prevents: a quiet repository, no pings, a
paused project.

There is a second quiet way for it never to start: **GitHub fires a `schedule`
only from the default branch**, and it offers Run workflow only for a workflow
that is on it. On a feature branch the keep-alive is invisible. `RUNBOOK.md`
carries this as the first of the three human steps.

This is accepted. A cheap mitigation for the usual case is worth having; to call
it a guarantee is what does the damage. The detection for the rare case is the
loud write failure that spec 29 built, which also covers a lost network and a
Supabase outage — things no keep-alive prevents. `RUNBOOK.md` gets the recovery
path, because the fix is a click in the dashboard and it must not be found again
under pressure.

### Refused

- **A staleness warning**, for example "no events in a fortnight". A dead log
  announces itself as soon as an editor touches a control, and the warning also
  fires in a genuinely quiet fortnight. A banner that cries wolf teaches people
  to ignore banners.
- **Pruning the `keepalive` rows.** Not a number worth looking at.
- **Migration tooling.** One project, one human, no environments to keep in
  step. The SQL is applied by hand, as ticket 30 did on 2026-08-06. A forgotten
  run is loud, because the insert gives a 404.
- **A second free service to watch the first one.** It can die as quietly as the
  Action, which is the thing that was accepted rather than chased.

### What this does to ticket 30

Ticket 30 says to resolve this ticket before an editor sees the log. It records
"free or paid: not yet recorded". It is now recorded: **free**.

Ticket 30 used to carry the rule that it unblocks when a **scheduled** run has written a
row. **That check came back here on 2026-08-12**, when ticket 30 resolved: 30 is about
wiring, and the wiring is verified — the project holds 511 override rows written by more
than one editor across several days. Whether the cron fires is this ticket's mitigation
to prove, and nothing else waits on it.

### Still unproven — the cron

A `workflow_dispatch` run proves the insert; it does not prove the cron. Waiting a
whole week to see that no pause happens tests Supabase's timer, not this Action.

**Open Actions and confirm that a scheduled run has written a row.** The schedule is
`17 4 * * *` UTC and GitHub runs it when it can, so one or two hours late is usual and is
not a fault. The workflow landed 2026-08-07, so several scheduled runs should be in the
history.

It cannot be checked from a working copy: `keepalive` has no select policy by design, so
the anon key cannot read the table, and the repository is private, so the Actions API
refuses an unauthenticated request. It is a human at a browser tab.

**The live override rows do not answer it.** Editor writes are database activity in their
own right, so the project has never been idle long enough for the keep-alive to be the
thing keeping it awake. The 511 rows prove no pause has happened; they say nothing about
why.

### Built

2026-08-07. `supabase/keepalive.sql` and
`.github/workflows/supabase-keepalive.yml`, the first workflow in this
repository. `RUNBOOK.md` carries the two human steps and the Resume path.

**No test was written.** A keep-alive holds no comparison rule, and a Vitest
case against a mocked `curl` would assert the shape of the file and nothing
about the behaviour. The proof is a `workflow_dispatch` run that returns 2xx,
then a scheduled run.
