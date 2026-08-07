# 30 — Wire the Supabase project to the built log

Type: task
Status: ready-for-human
Blocked by: 29
Parent: ../map.md

## Question

Nothing to decide. Spec 29 is built and the log runs, but it runs **not
connected**: every read and write path exists and is tested, and there is no
project behind them. This is the last step between the built feature and an
editor using it, and it is a human at a dashboard plus one paste.

The project now exists — the user created it and connected it to the GitHub repo.
What it does not have is the schema, and what the repo does not have is the two
public values.

## Checklist

1. In the Supabase dashboard, open the SQL editor and run
   `supabase/schema.sql` **whole**. It begins with `drop view` and `drop table`,
   which is deliberate: the file replaces ticket 03's two-kind model, and ticket
   09 replaced that with three scopes and five actions. Confirm the project holds
   no data before running it. It should not — nothing has ever written to it.
2. Check that row level security is on and that `overrides` has exactly two
   policies: insert for `anon` and select for `anon`. **No update policy and no
   delete policy.** The absence of the policy is what makes the table
   append-only; adding either one silently removes the protection.
3. Copy `web/.env.example` to `web/.env` and fill in:
   - `PUBLIC_SUPABASE_URL` — Project Settings → API → Project URL
   - `PUBLIC_SUPABASE_ANON_KEY` — the **anon public** key, not the service role
     key. The service role key bypasses RLS and must never reach a browser.
4. `npm start`, open a page, enter a name, and click **Opgelost** on one finding.
   Reload. The claim must still be there.
5. Press **Hercontroleer** on that same page. The claim was made against the
   build's observation and the re-check is a later one, so a finding that still
   differs must come back as *nog niet opgelost*, with the name on it. That one
   click exercises the whole precedence rule end to end.

## Facts later tickets depend on

- **Project ref:** `xikswymsgjivrldgwfzk`
- **Schema applied:** 2026-08-06. `overrides` and `overrides_current` both answer
  `200 []` to an anon select over REST, so the table, the view and the select
  policy are all live.
- **Key format:** the project issues the new `sb_publishable_…` key rather than a
  legacy `anon` JWT. It maps to the `anon` role, so the policies written `to
  anon` apply unchanged. Never the `sb_secret_…` counterpart.
- **The variable names carry a `PUBLIC_` prefix and must keep it.** Astro only
  exposes a variable to the browser when it does, and every read and write here
  happens in the browser. Without the prefix the value is `undefined`, Rollup
  proves the guard in `createOverridesPort()` always throws and drops the client
  as dead code, and the log reports itself as not connected. The connected
  bundle is `_astro/overrides.*.js` at ~228 KB; the not-connected one is ~11 KB.
- **Free or paid:** **free**, decided by ticket 13 on 2026-08-07. The pause is
  stopped by a daily GitHub Action that inserts one row into a `keepalive`
  table. Pro was refused.

## Notes

The anon key is **public by design** — ticket 03 argued this, and it is baked
into the static build that goes on the webhost. It identifies the project, not a
person. It is not a secret and does not need hiding; `web/.env` is gitignored as
a matter of hygiene, not of security.

[Ticket 13](13-supabase-pause-risk.md) is resolved: the plan stays free and a
daily GitHub Action inserts one row into a `keepalive` table. **This ticket
unblocks when a scheduled run has written a row**, not when a
`workflow_dispatch` run has. A manual run proves the insert; only the cron
proves the keep-alive. Until then the project can still pause after about seven
days idle, and every override lives in it. Spec 29 made the failure **loud**,
which is a mitigation and not an answer.
