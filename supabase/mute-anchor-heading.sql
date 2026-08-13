-- APPLIED 2026-08-10, and SUPERSEDED 2026-08-13 by ADR 0011: the mute this file
-- hardened is withdrawn, and ticket 114 deleted the code that could write one. Nothing
-- here is rolled back — the columns, the generated slot and the constraints stay on the
-- table, holding what the eleven historical rows put there. This file is kept as the
-- record of a change that was applied to a live table; do not apply it again, and do not
-- read it as a description of a live feature. `schema.sql` carries the retirement notes.
--
-- Ticket 88 / ADR 0008: the mute key gains the anchor heading, and a mute needs
-- a note.
--
-- `schema.sql` holds the same thing as one whole file, and running that file
-- drops the override log. This file is the same change applied to a live table,
-- so the log survives. Apply it once, then the two agree.
--
-- The table was counted again on 2026-08-10, on the day of the change and not
-- quoted from ticket 65: 4 live `page-class` keys, and **every one of them
-- cleared**. No mute is live in any store, so no key is orphaned.
--
-- The history holds 4 `muted` rows, and all 4 carry no note. That is why the
-- widened note constraint below is added `not valid`.

alter table overrides add column anchor_heading text;
alter table overrides add column names_section boolean not null default false;

-- The heading part of the mute key, as one value. `anchorHeadingSlot()` in
-- `shared/mute-key.mjs` was the same expression in JavaScript, and the two had to agree.
-- Ticket 114 deleted that module; `schema.sql` records why the divergence is accepted.
alter table overrides add column anchor_heading_slot text generated always as (
  case
    when not names_section then '*page'
    when anchor_heading is null then '*none'
    else '#' || anchor_heading
  end
) stored;

alter table overrides add constraint override_anchor_heading check (
  (names_section = false and anchor_heading is null)
  or (names_section and scope = 'page-class')
);

-- `not valid` on purpose. The table is append-only, so a mute written before this
-- ticket can never be repaired — only superseded. The rule holds from the next
-- row on, and the history stays as it was written.
alter table overrides drop constraint if exists override_note;
alter table overrides add constraint override_note check (
  action not in ('dismissed', 'muted') or length(trim(coalesce(note, ''))) > 0
) not valid;

drop view if exists overrides_current;
create view overrides_current as
select distinct on (scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot)
  id, created_at, editor, scope, action, store, page,
  finding_id, class, anchor_heading, names_section,
  observation_id, finding_set_hash, note
from overrides
order by scope, store, page, coalesce(finding_id, class, ''), anchor_heading_slot, created_at desc, id desc;
