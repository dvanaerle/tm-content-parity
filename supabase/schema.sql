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
-- applied on its own, and ticket 88's change to a live table is in
-- `mute-anchor-heading.sql`. This file is what a new project gets.

drop view if exists overrides_current;
drop table if exists overrides;

create table overrides (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  editor      text        not null check (length(trim(editor)) > 0),

  -- RETIRED 2026-08-13, ADR 0011: `page-class` is no longer written. The app has no
  -- code that can produce one — ticket 114 deleted the key, the derivation and the
  -- control — and the eleven historical rows are why the value stays in this check.
  -- A constraint saying a mute is impossible could only be added `not valid`, which
  -- would be a schema asserting a shape the table demonstrably held eleven times.
  --
  -- What the event is keyed on:
  --   finding     one difference, by its content-addressed id (ticket 01)
  --   page-class  one class on one page — the withdrawn mute key
  --   page        the whole page — a human review
  scope       text        not null check (scope in ('finding', 'page-class', 'page')),

  -- RETIRED 2026-08-13, ADR 0011: `muted` is no longer written, for the reason above.
  --
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

  -- RETIRED 2026-08-13, ADR 0011: these three columns carried the section of the withdrawn
  -- override, and nothing reads them. `overrides/supabase.mjs` no longer selects them and
  -- no insert names them, so a new row takes the `names_section` default and leaves
  -- `anchor_heading` null. They hold what the eleven historical rows put there.
  --
  -- The **finding's** `anchorHeading` is a different thing and survives (ADR 0011): it is
  -- how a difference says where it is on the page. It comes off the snapshot, never off
  -- this table, so it was never one of these columns.
  --
  -- ADR 0008: a mute names a section, and the section is the anchor heading. The
  -- field has three states and two of them are null here, so `names_section`
  -- carries the difference: false is the page-wide form, and true with a null
  -- heading is the content before the first heading, which is a real section.
  anchor_heading text,
  names_section  boolean not null default false,

  -- The heading part of the withdrawn key, as one value. `anchorHeadingSlot()` in
  -- `shared/mute-key.mjs` held the same expression in JavaScript, and the derivation keyed
  -- on it; ticket 114 deleted that module with the key it built. So the two no longer
  -- agree, and the divergence is **accepted rather than fixed**: `eventKey()` keys on
  -- three columns and this view on four, which can split two of the eleven historical rows
  -- the derivation merges. Nothing looks their key up, so nothing can observe it. See the
  -- note on `eventKey()` in `overrides/state.mjs`.
  anchor_heading_slot text generated always as (
    case
      when not names_section then '*page'
      when anchor_heading is null then '*none'
      else '#' || anchor_heading
    end
  ) stored,

  -- The observation a `fixed` claim was made against. A claim is contradicted
  -- only by a LATER observation that still gives the finding, so without this
  -- column the button could not work on a frozen snapshot. Ids sort
  -- chronologically by construction — see newObservationId().
  observation_id text,

  -- On `reviewed`: the `work`-class finding set at the moment of review. A review
  -- goes stale when this stops matching, and never expires on its own.
  finding_set_hash text,

  note        text,

  -- RETIRED 2026-08-13, ADR 0011: the `page-class` branch of this constraint and of
  -- `override_action` below permit a row the app can no longer build. They stay because
  -- the eleven historical rows have to keep satisfying the table they are in.
  --
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

  -- RETIRED 2026-08-13, ADR 0011: nothing sets `names_section` any more, so every new
  -- row satisfies this on the first branch by default.
  --
  -- Only a mute names a section. Every other row leaves both fields alone.
  constraint override_anchor_heading check (
    (names_section = false and anchor_heading is null)
    or (names_section and scope = 'page-class')
  ),

  -- RETIRED 2026-08-13, ADR 0011 — the `muted` half. A note is required on the
  -- **judgement**, and a dismissal is the only judgement left; the mute this clause also
  -- covered can no longer be written, so the clause is now a rule about dismissals with a
  -- dead disjunct beside it.
  --
  -- A dismissal accepts a real difference for good, so the next reader must be told why;
  -- a fix claim is a one-line correction and must not cost a sentence of prose. Ticket 88
  -- added the mute here: it was the one override nobody could review later.
  constraint override_note check (
    action not in ('dismissed', 'muted') or length(trim(coalesce(note, ''))) > 0
  )
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
select distinct on (scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot)
  id, created_at, editor, scope, action, store, page,
  finding_id, class, anchor_heading, names_section,
  observation_id, finding_set_hash, note
from overrides
order by scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot, created_at desc, id desc;
