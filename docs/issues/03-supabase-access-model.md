# 03 — Supabase: limits, access model and schema

Type: research
Status: resolved
Resolved: 2026-08-06
Blocked by: —
Parent: ../map.md

## Question

Can Supabase hold the override log for an internal tool that has no login, called
straight from a static page, and what is the correct schema and access model?

## What to find out

- **Free-tier limits** that matter here: row count, database size, request rate,
  and the project-pausing rule for inactivity. A paused project would silently
  break the log.
- **Anonymous writes.** The anon key ships in client JavaScript on a page that may
  sit on public webhosting. What does Row Level Security allow and forbid for
  insert and update with no authenticated user? Is an append-only table with
  insert-but-not-delete the right shape?
- **Identifying editors without accounts.** The log needs "who ticked this".
  Options: a name typed once and kept in localStorage, Supabase anonymous
  sign-in, or a shared magic-link. What does Supabase support, and what does each
  cost in setup?
- **Schema for an append-only override log**: finding id, page, store view,
  action (resolved / dismissed / reopened), actor, note, timestamp. Read the
  current state as the latest event per finding id.
- **Reading without a key leak risk.** Confirm what an anon key exposes if
  someone views source, and whether RLS is enough on its own.
- **Realtime**, and whether it is worth using so two editors see each other's
  ticks live, or whether a plain fetch on load is enough.

## Constraints

- The webhosting runs **no server code**. All calls come from the browser.
- Only finding ids and statuses are stored. Never page content.
- A handful of internal editors, not public traffic.

## Notes

AFK. Resolve with a `/research` subagent against Supabase's own documentation.
Capture findings on a `research/supabase-override-log` branch and leave a pointer
here.

The schema depends on ticket 01 (finding identity). Research the platform facts
now; do not fix the schema until 01 is resolved.

## Answer

Yes, Supabase can hold the override log. Full findings, with sources and dates:
[`../research/supabase-override-log.md`](../research/supabase-override-log.md).

- **Scale is a non-issue.** 500 MB database, 50,000 MAU, 5 GB egress, unlimited
  API requests on the free tier. This log stores ids and statuses for 5-10
  editors.
- **The anon key is meant to be public.** Supabase's own documentation calls it
  "safe to expose online". It identifies the project, not a user. So shipping it
  in client JavaScript on public webhosting is the intended use.
- **RLS is the whole protection, not extra hardening.** With RLS off, the anon key
  reads and writes everything. With RLS on, the **absence** of an UPDATE or DELETE
  policy denies those operations — which makes the table append-only for free, with
  nothing extra to write.

  ```sql
  alter table overrides enable row level security;
  create policy "anon can insert" on overrides for insert to anon with check (true);
  create policy "anon can read"   on overrides for select to anon using (true);
  -- no update policy, no delete policy => append-only
  ```

  Tighten the `with check` once ticket 01 fixes the schema.
- **Identify editors with a name typed once and kept in localStorage**, sent as a
  plain column. Anonymous Sign-In does not survive across browsers or devices, does
  not supply a name, and adds CAPTCHA and session handling this tool does not need.
- **Schema**: an append-only events table; derive current state with `DISTINCT ON`
  or a `row_number()` view. The `finding_id` semantics stay open — they depend on
  ticket 01.
- **Skip Realtime for now.** It is on the free tier (200 connections, 2M messages
  per month), but fetch-on-load meets the requirement and adds no failure surface.
- **No CORS allowlist exists or is needed.** The REST API returns
  `Access-Control-Allow-Origin: *` regardless of origin, so `file://` and any
  static host work.

### The one finding that changes a decision

**Free projects pause after about 7 days without database activity.** Restoring is
a manual click in the dashboard, possible for up to a year. A paused project fails
**silently from the browser** — no error reaches the editor, the log simply stops
recording, and already-resolved findings reappear as open. Editor ticks may well
supply enough activity on their own, but a quiet week (holidays, a slow sprint)
pauses it.

Graduated into ticket 13.

### Unverified

Whether Anonymous Sign-In counts toward MAU, and the exact REST throttle numbers.
Neither affects the recommendation, because both options above avoid them.

## Covered by the spec in ticket 29

2026-08-06. [29 — Spec: make the log actionable](29-actionable-log.md) is the build
instruction. It carries the user stories, the seam, the schema and the testing
decisions for the Supabase table and its access model. Read 29 before starting; this ticket keeps the reasoning.
