-- A record of what the database **actually is**, read from its own catalog.
--
-- This is not a migration and it changes nothing: every statement is a `select`. Run it in
-- the SQL Editor whenever you want the live structure on paper — before and after applying a
-- change is the useful pair.
--
-- **Why this exists rather than `pg_dump`.** A proper dump needs Docker or a native
-- `pg_dump`, and this project has neither. What it would buy over the four `.sql` files in
-- this directory is one thing, and it is the thing that matters: those files say what the
-- schema is *meant* to be, and the catalog says what it *is*. They can disagree — a
-- statement hand-run in the editor, a migration applied halfway, a constraint that was added
-- `not valid`. The queries below are the poor relation of a schema dump and they answer that
-- one question honestly.
--
-- Every result here is small, so the editor's row cap is not in play. Download each as CSV
-- into `data/`, which `.gitignore` excludes.

-- 1. The columns, with their types, defaults and generated expressions.
--    Read this against `schema.sql` line by line. `priority` and `annotation_slot` appear
--    only after `page-annotations.sql` has been applied.
select
  ordinal_position as pos,
  column_name,
  data_type,
  is_nullable,
  column_default,
  is_generated,
  generation_expression
from information_schema.columns
where table_schema = 'public' and table_name = 'overrides'
order by ordinal_position;

-- 2. Every constraint, as Postgres itself renders it.
--    This is the one that catches the hazard `page-annotations.sql` warns about: the action
--    check is declared inline on the column, so Postgres named it, and a migration that
--    dropped the wrong name would leave the old rule in place. `convalidated = false` marks a
--    constraint added `not valid` — the note rule of ticket 88 is the one that is.
select
  conname,
  contype,
  convalidated,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.overrides'::regclass
order by contype, conname;

-- 3. The indexes.
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'overrides'
order by indexname;

-- 4. The row level security policies. **The absence of an update and a delete policy is what
--    makes this table append-only**, so this result is a security check and not a curiosity:
--    two rows, both for `anon`, one `INSERT` and one `SELECT`, and nothing else.
select
  tablename,
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- 5. Whether RLS is actually switched on. A policy on a table with RLS off protects nothing.
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid in ('public.overrides'::regclass, 'public.keepalive'::regclass);

-- 6. The view's definition, which carries the key `overrides_current` reduces on.
select pg_get_viewdef('public.overrides_current'::regclass, true) as definition;

-- 7. Every table in the public schema, so a table nobody remembered shows up here.
select table_name, table_type from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 8. The row counts that a migration must not change, and the shape of the log by action.
--    Hold these against the JSON dump `overrides/dump.mjs` writes.
select count(*) as rows, count(note) filter (where trim(note) <> '') as with_note
from overrides;

select scope, action, count(*) as rows
from overrides
group by scope, action
order by scope, action;

-- 9. `keepalive`, which the anon key cannot read and the JSON dump therefore misses. It is a
--    heartbeat for ticket 13 and its rows are meaningless, so this is for completeness.
select count(*) as keepalive_rows from keepalive;
