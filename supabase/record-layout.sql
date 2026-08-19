-- Ticket 08: the record layout, kept in the log by whoever reads the grid.
--
-- **A new table and not a scope on `overrides`.** What this holds is a **fact**, and that
-- table holds **judgements**. A judgement carries a mandatory note, sits in a bucket, moves
-- a bar and is a decision somebody owns; this carries a reason, sits in no bucket, moves no
-- count, and a later crawl can contradict it. In `overrides` it would have gained a bucket
-- and a `cleared` verb, and the first reader to see it beside a dismissal would have read a
-- transcription of Magento's configuration as somebody's decision. ADR 0011's whole subject
-- is what happens when those two are confused.
--
-- **Append-only, on the same terms.** Row level security is on, there is an insert policy
-- and a select policy, and there is **no UPDATE policy and no DELETE policy**. The absence
-- of the policy is the protection. An entry is withdrawn by a later event, never by an
-- edit. Ticket 83 refused a schema editor for exactly this reason: add / rename / edit needs
-- the two policies this project does not have, and authentication it does not have either.
--
-- **Anyone who can open the site can write here.** An editor is a name in `localStorage`
-- and the anon key identifies the project and not a person. This table therefore widens who
-- can change a permission-granting fact from *whoever can push to git* to *whoever can open
-- the site*. That is the cost of the fact being kept by more than one person, and it is
-- recorded in the amendment to ADR 0025 rather than discovered later. There is no `owner`
-- column, which ticket 83 refused on grounds that hold here unchanged.
--
-- Applying this file drops nothing else. It is its own table, so unlike `schema.sql` it is
-- safe to run whole.

drop view if exists record_layout_readings;
drop view if exists record_layout_current;
drop table if exists record_layout;

create table record_layout (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  editor      text        not null check (length(trim(editor)) > 0),

  -- Three kinds and no fourth.
  --
  --   separate  this store page's new-site record is NOT shared with its block sibling
  --   shared    it is again — the merge landed in Magento
  --   reading   the grid was read on `taken_on`, and the complement is valid as of then
  --
  -- `separate` and `shared` are one fact said two ways, and `shared` is the withdrawal —
  -- the shape `cleared` has on `overrides`. A fourth kind is where a plan would enter, and
  -- ADR 0025 is explicit that this states a fact about today and never a plan.
  kind        text        not null check (kind in ('separate', 'shared', 'reading')),

  -- Which store page. Null on a `reading`, which is about the whole grid and no one page.
  --
  -- It is the **page key**, not a url path, so there is nothing to normalise: the screen
  -- picks a store page out of the corpus instead of taking a typed key, which is what
  -- removes the typo the committed file needed a build guard to catch. The `fr/` prefix
  -- never appears here.
  store       text,
  page        text,

  -- The Magento record id, for a reader with the grid open. **Nothing is keyed on it** —
  -- ADR 0025's rule, unchanged by the move. Every id in this repo is content-addressed and
  -- expires on purpose; a record id is not one, and a page moved between store views must
  -- not expire findings whose content did not change.
  record_id   integer,

  -- Why this page is its own record. The next reader will ask. It is **not** a note in the
  -- override sense: it explains a configuration, not a judgement, and nobody is accountable
  -- for it.
  reason      text,

  -- The day the grid was looked at, as a date and not a timestamp.
  --
  -- **This is not `created_at`.** That column says when somebody typed; this says when the
  -- grid was read, and it is the second that bounds what the complement may grant. A store
  -- page whose first sighting in the run log is later than this reads as not shared,
  -- because the reading cannot have seen it.
  taken_on    date,

  -- Each kind carries its own fields, and nothing else.
  constraint record_layout_key check (
    (kind in ('separate', 'shared') and store is not null and page is not null
                                    and taken_on is null)
    or (kind = 'reading' and store is null and page is null and taken_on is not null)
  ),

  -- A `separate` is the only kind that claims anything about a record, so it is the only
  -- one that may name one — and it must, because an entry nobody can look up in the grid is
  -- an entry nobody can check. `shared` withdraws and needs no id.
  constraint record_layout_separate check (
    kind <> 'separate' or (record_id is not null and length(trim(coalesce(reason, ''))) > 0)
  ),

  -- A withdrawal says why too. The merge landed, or the earlier reading was wrong, and
  -- those are different facts that the next reader has to be able to tell apart.
  constraint record_layout_shared check (
    kind <> 'shared' or length(trim(coalesce(reason, ''))) > 0
  ),

  -- A reading claims nothing about one page.
  constraint record_layout_reading check (
    kind <> 'reading' or record_id is null
  )
);

create index record_layout_page_idx on record_layout (store, page);
create index record_layout_kind_idx on record_layout (kind, created_at desc);

alter table record_layout enable row level security;

create policy "anon can insert" on record_layout for insert to anon with check (true);
create policy "anon can read"   on record_layout for select to anon using (true);
-- No update policy and no delete policy. The table is append-only.

-- The current layout: the newest row wins, per store page. The history underneath still
-- answers "who wrote this, and when".
--
-- **Neither view is read by the app.** `overrides/record-layout.mjs` derives the same answer
-- in JavaScript from every event, the way `overrides/state.mjs` does, because the derivation
-- has to be testable against a hand-written list with no Supabase project. These are here
-- for a person with SQL access, and they are the record of what the derivation is supposed
-- to say.
--
-- A `reading` is deliberately **not** in this view. It keys on nothing, so it has no
-- current-per-key form: the readings are a sequence, and `record_layout_readings` below is
-- that sequence.
create view record_layout_current as
select distinct on (store, page)
  id, created_at, editor, kind, store, page, record_id, reason
from record_layout
where kind in ('separate', 'shared')
order by store, page, created_at desc, id desc;

-- Every reading of the grid, newest first. The first row is the one that bounds what the
-- complement may grant, and it is the newest **written** and not the newest `taken_on`: a
-- correction is a later row, which is how everything else in this log is corrected.
create view record_layout_readings as
select id, created_at, editor, taken_on
from record_layout
where kind = 'reading'
order by created_at desc, id desc;
