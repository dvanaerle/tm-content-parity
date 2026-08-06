-- The override log. Ticket 03 gives the access model, ticket 01 the keys.
--
-- The table is append-only: row level security is on, and there is no UPDATE
-- policy and no DELETE policy. The absence of the policy is the protection.
-- The anon key is safe in the browser, because it identifies the project, not
-- a person.
--
-- An editor is a name that the browser keeps in localStorage. There is no
-- login.

create table if not exists overrides (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  editor      text        not null,

  -- 'dismissal' is keyed on content and expires when either side changes.
  -- 'mute' is keyed on store, page and class, and it persists.
  kind        text        not null check (kind in ('dismissal', 'mute')),

  store       text        not null,
  page        text        not null,

  -- Present on a dismissal. sha256(store|page|check|rule|prodNorm|newNorm),
  -- cut to 16 base64url characters.
  finding_id  text,

  -- Present on a mute. The class name from compare/contract.mjs.
  class       text,

  -- 'off' withdraws an earlier row of the same key. The table never deletes.
  active      boolean     not null default true,

  note        text,

  constraint override_key check (
    (kind = 'dismissal' and finding_id is not null) or
    (kind = 'mute'      and class      is not null)
  )
);

create index if not exists overrides_page_idx on overrides (store, page);
create index if not exists overrides_finding_idx on overrides (finding_id);

alter table overrides enable row level security;

create policy "anon can insert" on overrides for insert to anon with check (true);
create policy "anon can read"   on overrides for select to anon using (true);
-- No update policy and no delete policy. The table is append-only.

-- The current state: the newest row wins, per key.
create or replace view overrides_current as
select distinct on (kind, store, page, coalesce(finding_id, class))
  kind, store, page, finding_id, class, active, editor, note, created_at
from overrides
order by kind, store, page, coalesce(finding_id, class), created_at desc;
