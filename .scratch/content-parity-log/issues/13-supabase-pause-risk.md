# 13 — Keeping the Supabase project awake

Type: grilling
Status: open
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
