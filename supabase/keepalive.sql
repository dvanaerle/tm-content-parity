-- Why this table exists: a Supabase free project is paused after about 7 days
-- with no database activity, and the pause is invisible to an editor. The page
-- still loads, because it is static; only the override log stops. Ticket 13
-- chose to stay on the free plan and to write one row here each day from
-- `.github/workflows/supabase-keepalive.yml`.
--
-- It WRITES rather than reads. `research/supabase-override-log.md`, line 175,
-- records that it is unverified whether read-only select traffic counts as
-- meaningful activity. A keep-alive resting on that assumption would fail in
-- the same quiet shape as the fault it prevents.
--
-- It is NOT the `overrides` table. Ticket 09 makes that ledger append-only and
-- latest-event-wins, so a row written for a hosting reason would enter the
-- derivation and the progress bar.
--
-- `keepalive` is not in CONTEXT.md on purpose. It is infrastructure, not parity
-- vocabulary.
--
-- This file is separate from `schema.sql` because that file begins with
-- `drop table overrides`. The keep-alive must be applicable without any risk to
-- the override log.

create table if not exists keepalive (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);

alter table keepalive enable row level security;

-- Anyone who holds the anon key can insert, and the key is public by design
-- (ticket 30). That is accepted: the table has no column to carry a payload, so
-- the only possible damage is row count, against a 500 MB plan. There is no
-- select policy, because nothing reads this table.
drop policy if exists "anon can insert" on keepalive;
create policy "anon can insert" on keepalive for insert to anon with check (true);
