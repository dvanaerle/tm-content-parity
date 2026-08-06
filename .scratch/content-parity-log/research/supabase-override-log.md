# Supabase for the content-parity override log — research

Ticket: `issues/03-supabase-access-model.md`
Checked: 2026-08-06, against Supabase's own docs (supabase.com/docs, supabase.com/pricing).

## Answers (summary)

1. **Free tier limits**: fine for this tool's traffic (500 MB DB, 50,000 MAU, 5 GB egress, "unlimited" API requests) — but a project with only a handful of editors ticking boxes a few times a week risks silent auto-pause after 7 days of no activity. This is the real free-tier risk, not size or rate limits.
2. **Anon key + RLS**: the anon key is *meant* to be public and is safe to ship in client JS — but only because Postgres enforces access via RLS, not the key itself. RLS is not "extra" security, it is the *only* security. Without a policy, an exposed anon key with RLS off = full read/write to everyone. Append-only is done by writing INSERT and SELECT policies and simply never writing UPDATE/DELETE policies.
3. **Editor identity without accounts**: recommend (a) a typed display name kept in `localStorage`, sent as a plain text column. Supabase Anonymous Sign-In is real but is built for app users, not named humans — it doesn't give you a name, doesn't survive a cleared browser or a second device, and adds auth-setup weight (CAPTCHA recommended, JWT `is_anonymous` claim handling) that this internal tool doesn't need.
4. **Schema**: a simple append-only events table (finding_id, page_slug, store_view, action, actor, note, created_at) with "current state" read via `DISTINCT ON` or a window-function view. Finding-id column semantics are explicitly **not finalised** — blocked on ticket 01.
5. **Realtime**: on the free tier (200 concurrent connections, 2,000,000 messages/month included), but overkill for 5-10 editors. A plain fetch on page load (or on tab focus) is simpler, has no extra moving parts, and is easily "good enough" — Realtime becomes worth it only if it turns out editors work simultaneously often and duplicate work is a real cost.
6. **Gotchas**: no dashboard "allowed origins" setting exists for the REST API — Supabase deliberately serves `Access-Control-Allow-Origin: *`, so calling from any static host (or even `file://`, in most browsers) is not blocked by Supabase's CORS. There is no documented request-per-second cap on REST inserts on free tier, so a leaked anon key with a permissive INSERT policy is an open abuse surface — mitigate with strict `WITH CHECK` constraints and by keeping the payload valueless (ids/status only, never content, as already decided).

---

## 1. Free-tier limits

Source: [supabase.com/pricing](https://supabase.com/pricing), checked 2026-08-06.

- **Database size**: 500 MB (shared CPU, 500 MB RAM).
- **Monthly Active Users (MAU)**: 50,000 included. Irrelevant at this scale (5-10 editors).
- **Egress**: 5 GB egress + 5 GB cached egress included per month. Irrelevant for a log of ids/statuses.
- **API requests**: the pricing page lists "Unlimited API requests" across all plans including Free. There is no documented per-second throttle for the REST API on the free tier (see §6 for the abuse-risk implication of this).
- **Realtime**: 200 concurrent peak connections, 2,000,000 messages/month included on Free.
- **Project limit**: 2 active free projects per organization.

**Inactivity pause — the critical one.**
Source: [supabase.com/docs/guides/platform/free-project-pausing](https://supabase.com/docs/guides/platform/free-project-pausing), checked 2026-08-06.

- A Free plan project is **paused after roughly 1 week (7 days) with no meaningful database activity**. The docs describe it as: "considered inactive if it does not receive sufficient user database activity over the past week," and note that "typically a few user requests to the database each day over the previous week is enough" to prevent pausing.
- Restoring is a **manual, human action**: open the dashboard, select the paused project, click "Resume project," confirm. It comes back in a few minutes with data intact.
- Projects can be restored for **up to 1 year** after pausing. After that, Supabase Studio can no longer restore it automatically — data recovery beyond a year requires downloading backups and migrating manually (see [restore-project-after-90-days-pause](https://supabase.com/docs/guides/troubleshooting/restore-project-after-90-days-pause)).

**What this means for this tool, concretely**: 5-10 editors ticking a handful of findings per week is *plausibly* enough activity to avoid the pause on its own, since it writes to the database — but if a review cycle goes quiet for more than a week (holidays, a slow sprint, nobody opens the page), the project pauses. A paused project means every write and every read from the static page **fails silently from the browser's point of view** — no editor gets an error dialog explaining why, the override log just stops updating and the map re-shows already-resolved findings as new. There is no built-in warning to editors before this happens; only whoever watches the Supabase dashboard would see it.

Mitigations if this risk is judged too high: a scheduled low-cost external ping (any cron service hitting the Supabase REST endpoint once a week) keeps it "active," or upgrading to Pro ($25/month) removes pausing entirely. Neither is implemented; flagging as a design decision for whoever finalises the plan.

## 2. Anonymous writes with the anon key, and RLS

Source: [supabase.com/docs/guides/getting-started/api-keys](https://supabase.com/docs/guides/getting-started/api-keys) and [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security), checked 2026-08-06.

**What the anon key exposes.** The docs are explicit that the (now called "publishable") anon key is "Safe to expose online: web page, mobile or desktop app, GitHub actions, CLIs, source code." It only identifies *which project* is being called — it is not a secret and not a per-user credential. It has "Low" privileges by design. Quoting the docs: "access to your project's data is guarded by Postgres via the built-in `anon` and `authenticated` roles." In other words: viewing source and finding the anon key gives an attacker nothing more than the ability to *ask* Postgres for data under the `anon` role — what that role can actually do is entirely down to RLS policies.

**Is RLS sufficient on its own?** Yes, and it is not optional extra hardening — it is the *entire* protection. If RLS is off on a table, or on but with a permissive policy, the anon key is enough to read or write everything in that table, full stop. The docs' own security checklist for API keys tells you to "enable Row Level Security on all tables" and "regularly review your Row Level Security policies." There is no secondary gate behind RLS for anon access — no separate firewall, no key-scoping to specific tables or operations.

**Concrete policy shape for an append-only log**, following the SQL patterns in the RLS docs (`create policy ... on table for insert/select to anon using (...) with check (...)`):

```sql
-- Turn on RLS (required — off by default is "deny nothing" in practice
-- once a table exists, since old default grants exist for anon/authenticated)
alter table overrides enable row level security;

-- Allow anyone with the anon key to insert new events.
-- Add real WITH CHECK constraints once the schema (ticket 01) is fixed,
-- e.g. checking action is one of the allowed enum values.
create policy "anon can insert override events"
on overrides
for insert
to anon
with check ( true );

-- Allow anyone with the anon key to read the log
-- (needed to compute "current state" client-side).
create policy "anon can read override events"
on overrides
for select
to anon
using ( true );

-- No UPDATE policy and no DELETE policy is created for anon (or authenticated).
-- With RLS enabled, the ABSENCE of a policy for an operation means that
-- operation is denied for that role — this is what makes the table
-- append-only. Nothing extra needs to be written to "forbid" it.
```

This matches the shape the docs use for `profiles` (`for select to anon using (true)`, `for insert to authenticated with check (...)`) — only the target role and check expression differ.

## 3. Identifying editors without accounts

Source: [supabase.com/docs/guides/auth/auth-anonymous](https://supabase.com/docs/guides/auth/auth-anonymous), checked 2026-08-06.

**(a) Typed display name in `localStorage`, sent as a plain column.**
Simplest possible option. Editor types their name once, it's stored in the browser, and every write includes it as a normal text value in the `actor` column. No Supabase Auth involved at all — the anon key alone talks to PostgREST. Cost: near zero. Downsides: not verified (anyone could type someone else's name; but this is an internal trust-based tool, not a security boundary), and the name is per-browser, not per-person (a different browser or a cleared `localStorage` means retyping it).

**(b) Supabase Anonymous Sign-In.**
`signInAnonymously()` creates a real row in `auth.users` and hands back a session, without email/password/OAuth. Anonymous users get the `authenticated` Postgres role (not `anon`) and a JWT with an `is_anonymous: true` claim to distinguish them from real accounts in RLS policies. Key facts from the docs:
- It behaves "like a permanent user, except the user can't access their account if they sign out, clear browsing data, or use another device" — i.e. **it does not survive across browsers or devices**, and does not survive a cleared browser.
- It does **not** give you a human-readable name — you'd still need a separate step (e.g. `updateUser()` with custom metadata, or your own table) to attach "who is this."
- Auth rate-limits it: "An IP-based rate limit is enforced at 30 requests per hour" for anonymous sign-ins, and Supabase "strongly recommends enabling invisible CAPTCHA or Cloudflare Turnstile to prevent abuse."
- **MAU billing**: the official MAU docs define an MAU generically as "distinct users who log in or refresh their token during the billing cycle," without calling out anonymous users specifically one way or the other. Community sources say anonymous sign-ins do count once they authenticate, but I could not find this stated in Supabase's own primary docs — flagged below as unverified. At 5-10 editors it is moot either way (50,000 MAU free allowance).

**(c) Other options in the docs.** Supabase also supports full email/password, magic link, OAuth, and phone auth, and (b) anonymous sign-in above. There's no lighter-weight "shared team login" primitive beyond these. A shared magic-link account (one email, shared by all editors) is technically possible but not a documented pattern and adds an email-delivery dependency this static-hosting setup doesn't otherwise need.

**Recommendation: (a).** This tool has no login system by design and editors are a known, trusted internal group. A typed name in `localStorage` gets "who ticked this" with zero auth infrastructure, no CAPTCHA requirement, no session-expiry edge cases, and no per-device confusion beyond "retype your name once." Anonymous Sign-In adds real setup cost (auth session handling, RLS on `is_anonymous`, CAPTCHA recommendation) to solve a problem (verified identity) this tool doesn't have — the log is append-only and low-trust-but-not-adversarial by design.

## 4. Schema for the append-only override log

Not finalised — the `finding_id` column's exact semantics depend on ticket 01 (finding identity), which is unresolved. What follows is the *shape*, not the final DDL.

```sql
create table overrides (
  id           bigint generated always as identity primary key,
  finding_id   text not null,        -- semantics pending ticket 01
  page_slug    text not null,
  store_view   text not null,
  action       text not null check (action in ('resolved', 'dismissed', 'reopened')),
  actor        text not null,        -- typed display name, see §3(a)
  note         text,
  created_at   timestamptz not null default now()
);
```

**Reading "current state" as the latest event per finding.** Two documented-idiom SQL patterns work; both are standard Postgres, not Supabase-specific:

- `DISTINCT ON`, ordered by `finding_id`, `created_at desc` — simplest to read:
  ```sql
  select distinct on (finding_id) *
  from overrides
  order by finding_id, created_at desc;
  ```
- A window-function view, useful if you want it queryable as a normal table from the client:
  ```sql
  create view current_overrides as
  select *
  from (
    select *,
           row_number() over (partition by finding_id order by created_at desc) as rn
    from overrides
  ) t
  where rn = 1;
  ```
  The view can then get its own RLS-equivalent behaviour by inheriting the base table's `select` policy (Postgres views run with the querying role's permissions on the underlying table by default), so no separate policy is normally needed for the view itself.

**Flag**: the `finding_id` column is a placeholder. Ticket 01 needs to settle what a "finding id" stably identifies (e.g. slug+rule combination vs. a hash vs. something else) before this schema is final — this research answers the platform question only, per the ticket's own instruction not to fix the schema yet.

## 5. Realtime

Source: [supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime) and [supabase.com/pricing](https://supabase.com/pricing), checked 2026-08-06.

- Realtime is available on the Free plan: 200 concurrent peak connections and 2,000,000 messages/month included.
- It offers three primitives: **Postgres Changes** (listen to row inserts/updates on a table — this is the relevant one here), **Broadcast** (arbitrary low-latency messages between clients), and **Presence** (who's online).
- For this tool, Postgres Changes on the `overrides` table would let every open tab see another editor's tick appear instantly, without refreshing.

**Is it worth it?** For 5-10 editors doing occasional review passes, not simultaneously in most cases, a plain `fetch` on page load (or re-fetch on tab focus / a manual refresh button) covers the actual need: "don't show me stale state when I open the page." Realtime adds a persistent websocket connection, subscription lifecycle management, and another thing that can silently stop working, to solve a problem (seeing a co-editor's tick *live*, mid-session) that's a nice-to-have, not a functional requirement described anywhere in the ticket. Recommend starting with fetch-on-load and only adding Realtime later if editors report actually colliding (duplicate work on the same finding) often enough to matter.

## 6. Gotchas specific to this setup

Source: [supabase.com/docs/guides/getting-started/api-keys](https://supabase.com/docs/guides/getting-started/api-keys), GitHub issue [supabase/supabase#42033](https://github.com/supabase/supabase/issues/42033), and general search of supabase.com/docs, checked 2026-08-06.

- **CORS from `file://` or arbitrary static hosts.** Supabase does not expose a dashboard "allowed origins" setting for the REST/PostgREST API. By design and by observed behaviour (confirmed in an open Supabase GitHub issue), the API responds with `Access-Control-Allow-Origin: *` regardless of PostgREST-level CORS config — i.e. **any origin, including a `file://` page or any static host**, can call the REST API in a browser. This is good news for this project (no allowlist to maintain as the static site moves between hosts) but means CORS gives zero access control — again, RLS is the only real gate. Realtime does have its own separate "allowed origins" setting in the dashboard if Postgres Changes is ever adopted (see §5); the REST API does not.
- **No domain allowlist required or available.** Following directly from the above — there's nothing to configure. The site can be redeployed to a new static host without touching Supabase settings.
- **Rate limiting on anon inserts.** The Free-tier pricing page advertises "unlimited API requests" with no documented per-second/per-minute cap on REST/PostgREST specifically (Auth endpoints like sign-in do have documented limits, e.g. the 30/hour on anonymous sign-in in §3, but that's a different API surface). This means there is **no built-in throttle stopping a script from hammering the INSERT policy** if someone found the anon key. Practical mitigation given this tool's own constraints (only ids/statuses, never content) is to keep the blast radius small: tight `WITH CHECK` validation (only known finding ids / enum actions), and treat "someone spams junk rows into an internal QA log" as a low-severity, easily-cleaned-up risk rather than a security incident — there's no PII or content in the table to leak.
- **Abuse risk if the anon key leaks publicly.** Because the key is meant to be public (§2), "leaking" isn't really the right framing — it's already effectively public once shipped in the static build, by design. The actual risk is scoped entirely to what the RLS policies allow: with the shape in §2 (insert + select only, tight `WITH CHECK`), the worst case is spam rows in an append-only internal log, not data exfiltration or destructive writes, since there's no UPDATE/DELETE policy and no other table exposed to `anon`.

---

## Sources

- [supabase.com/pricing](https://supabase.com/pricing) — Free plan limits (DB size, MAU, egress, Realtime), checked 2026-08-06.
- [supabase.com/docs/guides/platform/free-project-pausing](https://supabase.com/docs/guides/platform/free-project-pausing) — inactivity pause rule and restoration, checked 2026-08-06.
- [supabase.com/docs/guides/troubleshooting/restore-project-after-90-days-pause](https://supabase.com/docs/guides/troubleshooting/restore-project-after-90-days-pause) — restoring long-paused projects, checked 2026-08-06.
- [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS SQL policy patterns, checked 2026-08-06.
- [supabase.com/docs/guides/getting-started/api-keys](https://supabase.com/docs/guides/getting-started/api-keys) — anon/publishable key exposure and safety, checked 2026-08-06.
- [supabase.com/docs/guides/api/securing-your-api](https://supabase.com/docs/guides/api/securing-your-api) — default grants for `anon`/`authenticated`/`service_role`, checked 2026-08-06.
- [supabase.com/docs/guides/auth/auth-anonymous](https://supabase.com/docs/guides/auth/auth-anonymous) — Anonymous Sign-In behaviour, cross-device persistence, rate limits, checked 2026-08-06.
- [supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users) — MAU definition, checked 2026-08-06.
- [supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime) — Realtime feature overview (Postgres Changes, Broadcast, Presence), checked 2026-08-06.
- [github.com/supabase/supabase/issues/42033](https://github.com/supabase/supabase/issues/42033) — REST API CORS behaviour (Access-Control-Allow-Origin forced to `*`), checked 2026-08-06.

## Open risks (could not fully verify against primary docs)

- **Anonymous sign-in and MAU billing.** Supabase's own MAU docs define MAU generically ("distinct users who log in or refresh their token") without explicitly stating whether anonymous sign-ins are included. Third-party sources say yes; I did not find this confirmed in Supabase's own primary docs. Not a blocker for this tool at 5-10 editors either way, but flagging since §3 rules out Anonymous Sign-In for other reasons regardless.
- **Exact REST/PostgREST rate limit numbers.** The pricing page's "unlimited API requests" claim is not the same as "no throttling ever" — Supabase's infrastructure (Cloudflare-fronted) may apply undocumented abuse-detection throttling under sustained load. No official per-second number was found for the Free tier REST API specifically.
- **Whether "sufficient database activity" for pause-prevention is satisfied by read-only `select` traffic alone**, or whether it must be a write. The docs say "user database activity" generically; if only 1-2 editors visit in a slow week and only read (never tick anything), it's unverified whether that alone prevents the pause. Treat the 7-day pause risk in §1 as real until this is tested in practice or a keep-alive ping is added.
