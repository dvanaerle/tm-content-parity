-- APPLIED 2026-08-14. Ticket 83: a page carries a priority and a note.
--
-- `schema.sql` holds the same thing as one whole file, and **running that file drops the
-- override log**. This file is the same change applied to a live table, so the log
-- survived. The two now agree. Kept as the record of what the live table was asked to do,
-- which is the convention `mute-anchor-heading.sql` set.
--
-- Two new actions on the existing `page` scope, one carrying a priority from a closed list
-- and one carrying free text. No new scope, no new table, and no schema editor: the
-- proposal's add / rename / reorder / edit-the-options needs UPDATE and DELETE policies
-- this table does not have, and authentication this project does not have either.
--
-- Ticket 13 decided the project stays on the free plan. Two actions add rows at the rate
-- an editor types, which is nothing. A schema table would not have been.
--
-- Every constraint below is added **valid**, not `not valid`: each one is a rule about
-- actions no row on the table has ever carried, so the history satisfies all of them
-- vacuously. That is the difference from ticket 88's note constraint, which widened a rule
-- over four rows written before it existed.

alter table overrides add column priority text;

-- Which of the page's three things a `page` row is about. It mirrors `PAGE_KEY` in
-- `overrides/state.mjs`, and the view below keys on it. The review keeps the empty slot it
-- has always had, so **no row already on disk changes key**.
alter table overrides add column annotation_slot text generated always as (
  case action
    when 'prioritised' then 'priority'
    when 'noted' then 'note'
    else ''
  end
) stored;

-- The action vocabulary gains the two. `muted` and `page-class` stay in their checks for
-- the reason ADR 0011 gives: eleven historical rows have to keep satisfying the table.
--
-- **The name was checked before this file ran, and it matched.** That check mattered: the
-- action check is written inline on the column in `schema.sql`, so Postgres named it rather
-- than we did, and `drop ... if exists` against the wrong name silently does nothing —
-- leaving the old check in place to refuse every `prioritised` row while this file reports
-- success. The query that confirmed `overrides_action_check`, for the next migration that
-- has to drop a constraint it did not name:
--
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'overrides'::regclass and contype = 'c';
alter table overrides drop constraint if exists overrides_action_check;
alter table overrides add constraint overrides_action_check check (
  action in ('fixed', 'dismissed', 'muted', 'reviewed', 'cleared', 'prioritised', 'noted')
);

alter table overrides drop constraint if exists override_action;
alter table overrides add constraint override_action check (
  action = 'cleared'
  or (scope = 'finding'    and action in ('fixed', 'dismissed'))
  or (scope = 'page-class' and action = 'muted')
  or (scope = 'page'       and action in ('reviewed', 'prioritised', 'noted'))
);

-- Only a `prioritised` row carries a priority, so a stray value cannot sit on a review
-- waiting to be read as one. There is deliberately **no check listing the three words**:
-- that list is `shared/priorities.mjs`, closed in git, and a list in two places is a list
-- that can drift.
alter table overrides add constraint override_priority check (
  action = 'prioritised' or priority is null
);

-- `override_note` is left exactly as it stands. `noted` is not in its list, on purpose: a
-- dismissal note is mandatory and explains one judgement about two strings, and a page note
-- is optional, explains nothing in particular, and an empty one is how an editor takes it
-- back. The two share this column and the action is what tells them apart.

-- Without `annotation_slot` in the key, each annotation would be the newest row on the
-- **review's** key, and this view would report a priority where a caller asked what the
-- review was.
drop view if exists overrides_current;
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

-- There is no **owner** column here, and ticket 83 refused to add one. With any name
-- typeable by anyone in `localStorage`, an owner column invites an accountability reading
-- it cannot support. If ownership is wanted, that is an authentication ticket.
