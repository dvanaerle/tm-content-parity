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
  -- `prioritised` and `noted` are ticket 83's two page annotations. They are two actions
  -- and not one, because one event means one thing and the latest-event-per-key derivation
  -- stays trivial that way. **There is no third**: the moment two annotations exist a third
  -- looks free, and it is not — a third is the schema editor this ticket refused.
  action      text        not null check (
                action in (
                  'fixed', 'dismissed', 'muted', 'reviewed', 'cleared',
                  'prioritised', 'noted'
                )
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

  -- Which of the page's three things a `page` row is about (ticket 83). It mirrors
  -- `PAGE_KEY` in `overrides/state.mjs`, and `overrides_current` keys on it — see the note
  -- on the view. The review keeps the empty slot it has always had, so no row already on
  -- disk changes key.
  annotation_slot text generated always as (
    case action
      when 'prioritised' then 'priority'
      when 'noted' then 'note'
      else ''
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

  -- Ticket 83: the page priority, on a `prioritised` row. One of `high | medium | low`.
  --
  -- **There is deliberately no check constraint listing those words.** The list is
  -- `shared/priorities.mjs` and it is closed there, in git, because the proposal's schema
  -- editor — add, rename, reorder, edit the options — needs UPDATE and DELETE policies this
  -- table does not have, and authentication this project does not have either. A list in
  -- two places is a list that can drift, and the copy that would win is the one nobody can
  -- read in a diff. `priorityEventFor()` in `overrides/state.mjs` is the guard.
  --
  -- A **null on a `prioritised` row is a value**: it is how the annotation is cleared. The
  -- table is append-only, so clearing is a new row and never an edit of this column.
  priority    text,

  -- There is no **owner** column, and ticket 83 refused to add one. With any name typeable
  -- by anyone in `localStorage`, an owner column invites an accountability reading it cannot
  -- support. If ownership is wanted, that is an authentication ticket.

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
  --
  -- The two annotations join the `page` scope, which gains **no new scope of its own**: an
  -- annotation describes a page, and the page scope is what already names one.
  constraint override_action check (
    action = 'cleared'
    or (scope = 'finding'    and action in ('fixed', 'dismissed'))
    or (scope = 'page-class' and action = 'muted')
    or (scope = 'page'       and action in ('reviewed', 'prioritised', 'noted'))
  ),

  -- Only a `prioritised` row carries a priority. Every other action leaves the column
  -- alone, so a stray value cannot sit on a review waiting to be read as one.
  constraint override_priority check (
    action = 'prioritised' or priority is null
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
  --
  -- Ticket 83's `noted` is deliberately **not** in this list, and that is the difference
  -- between the two things that share this column. A dismissal note is mandatory and
  -- explains one judgement about two strings. A page note is optional, explains nothing in
  -- particular, and an empty one is how an editor takes it back.
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
--
-- `annotation_slot` mirrors `PAGE_KEY` in `overrides/state.mjs`, and the two have to agree.
-- Without it the page scope has one key, and ticket 83's two annotations would each be the
-- newest row on the **review's** key — so this view would report a priority where a caller
-- asked what the review was. That is the same trap `eventKey()` names, answered the same
-- way: the review's own slot stays the empty string it has always been, so every row
-- already on disk keeps the key it was written under, and `cleared` goes on keying to the
-- review, which is the one thing it has ever revoked on this scope.
--
-- This is the one divergence from `anchor_heading_slot` above that is **not** accepted:
-- that slot keys eleven retired rows nothing looks up, and this one keys rows the app
-- writes every time an editor annotates a page.
create view overrides_current as
select distinct on (
    scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot, annotation_slot
  )
  id, created_at, editor, scope, action, store, page,
  finding_id, class, anchor_heading, names_section,
  observation_id, finding_set_hash, note, priority
from overrides
order by
  scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot, annotation_slot,
  created_at desc, id desc;
