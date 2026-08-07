-- The override log. Ticket 03 gives the access model, ticket 01 the keys,
-- ticket 09 the lifecycle, and spec 29 the observation.
--
-- This file REPLACES the two-kind model that stood here before. That version
-- encoded ticket 03's `kind in ('dismissal','mute')` with an `active` boolean;
-- ticket 09 resolved afterwards and gave three scopes and five actions instead.
-- The project held no data, so this is a replacement and not a migration.
--
-- The table is append-only: row level security is on, and there is no UPDATE
-- policy and no DELETE policy. **The absence of the policy is the protection.**
-- The anon key is safe in the browser, because it identifies the project and
-- not a person.
--
-- An editor is a name the browser keeps in localStorage. There is no login.
--
-- **Running this file whole drops the override log.** The `keepalive` table of
-- ticket 13 is therefore in `keepalive.sql`, so that the keep-alive can be
-- applied on its own.

drop view if exists overrides_current;
drop table if exists overrides;

create table overrides (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  editor      text        not null check (length(trim(editor)) > 0),

  -- What the event is keyed on:
  --   finding     one difference, by its content-addressed id (ticket 01)
  --   page-class  one class on one page — the mute key, which persists
  --   page        the whole page — a human review
  scope       text        not null check (scope in ('finding', 'page-class', 'page')),

  -- `cleared` is valid on every scope. It is what replaces four `un-` verbs and
  -- the `active` flag the earlier model carried.
  action      text        not null check (
                action in ('fixed', 'dismissed', 'muted', 'reviewed', 'cleared')
              ),

  store       text        not null,
  page        text        not null,

  -- sha256(store|page|check|rule|prodNorm|newNorm), cut to 16 base64url
  -- characters. Present when scope = 'finding'.
  finding_id  text,

  -- The class name from compare/vocabulary.mjs. Present when scope = 'page-class'.
  class       text,

  -- The observation a `fixed` claim was made against. A claim is contradicted
  -- only by a LATER observation that still gives the finding, so without this
  -- column the button could not work on a frozen snapshot. Ids sort
  -- chronologically by construction — see newObservationId().
  observation_id text,

  -- On `reviewed`: the shown-class finding set at the moment of review. A review
  -- goes stale when this stops matching, and never expires on its own.
  finding_set_hash text,

  note        text,

  -- Each scope carries its own key column, and nothing else.
  constraint override_key check (
    (scope = 'finding'    and finding_id is not null and class is null) or
    (scope = 'page-class' and class      is not null and finding_id is null) or
    (scope = 'page'       and finding_id is null     and class is null)
  ),

  -- Each scope allows only the actions that mean something on it.
  constraint override_action check (
    action = 'cleared'
    or (scope = 'finding'    and action in ('fixed', 'dismissed'))
    or (scope = 'page-class' and action = 'muted')
    or (scope = 'page'       and action = 'reviewed')
  ),

  -- A note is required on `dismissed` only. A dismissal accepts a real
  -- difference for good, so the next reader must be told why; a fix claim is a
  -- one-line correction and must not cost a sentence of prose.
  constraint override_note check (action <> 'dismissed' or length(trim(coalesce(note, ''))) > 0)
);

create index overrides_page_idx on overrides (store, page);
create index overrides_finding_idx on overrides (finding_id);

alter table overrides enable row level security;

create policy "anon can insert" on overrides for insert to anon with check (true);
create policy "anon can read"   on overrides for select to anon using (true);
-- No update policy and no delete policy. The table is append-only.

-- The current state: the newest row wins, per key. The history underneath still
-- answers "who dismissed this, and who cleared it".
create view overrides_current as
select distinct on (scope, store, page, coalesce(finding_id, class, ''))
  id, created_at, editor, scope, action, store, page,
  finding_id, class, observation_id, finding_set_hash, note
from overrides
order by scope, store, page, coalesce(finding_id, class, ''), created_at desc, id desc;
