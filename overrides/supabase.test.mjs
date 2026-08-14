import { describe, expect, it } from 'vitest';

import { noteEventFor, priorityEventFor } from './state.mjs';
import { toEvent, toRow } from './supabase.mjs';

/**
 * The port is thin, and what these tests pin is the one asymmetry left in it: the app
 * **writes** four actions on two scopes, and it **reads** a table that is append-only and
 * older than that. ADR 0011 withdrew the override keyed on a class in a section, and the
 * eleven rows it left stay on disk for ever. So `toEvent()` has to map a shape `toRow()` can
 * no longer produce, and it must do it without asking what the shape is.
 *
 * This file tested that override's three anchor states until ticket 114 — the port was where
 * *absent* had to stay distinguishable from *null*, because flattening the two turned a
 * judgement about a page into a judgement about the content before its first heading. There
 * is no key left that reads either, and the two columns are no longer selected.
 *
 * There is no test Supabase project, so this tests the two mappers and nothing else.
 * `createOverridesPort()` is never constructed here.
 */

/**
 * The live withdrawn row, as Supabase hands it over: `nl` · `downloads` · `text-missing` ·
 * the content before the first heading, 2026-08-10 11:07, note `"Negeren"` (ADR 0011).
 *
 * It still carries `anchor_heading` and `names_section`, because the columns are still on
 * the table — the port simply stopped selecting them. A fixture that dropped them would
 * be testing a row Postgres does not hold.
 */
const withdrawnRow = {
  id: 311,
  created_at: '2026-08-10T11:07:00.000Z',
  editor: 'Danielle',
  scope: 'page-class',
  action: 'muted',
  store: 'nl',
  page: 'downloads',
  finding_id: null,
  class: 'text-missing',
  anchor_heading: null,
  names_section: true,
  observation_id: null,
  finding_set_hash: null,
  note: 'Negeren',
};

describe('a withdrawn row still crosses the port', () => {
  it('does not throw, and keeps the row readable', () => {
    expect(() => toEvent(withdrawnRow)).not.toThrow();
    expect(toEvent(withdrawnRow)).toMatchObject({
      id: '311',
      scope: 'page-class',
      action: 'muted',
      store: 'nl',
      page: 'downloads',
      class: 'text-missing',
      note: 'Negeren',
    });
  });

  it('carries no anchor heading, because nothing selects the column', () => {
    // The finding's own `anchorHeading` is a locator off the snapshot and survives ADR
    // 0011. It never came from this table, and an override that carried one would be a
    // key nothing writes.
    expect(toEvent(withdrawnRow)).not.toHaveProperty('anchorHeading');
  });

  it('survives a row that has neither retired column, as the oldest four do', () => {
    // Four of the eleven predate ticket 88 and were written before the columns existed.
    const { anchor_heading: _a, names_section: _n, ...older } = withdrawnRow;
    expect(() => toEvent(older)).not.toThrow();
    expect(toEvent(older).action).toBe('muted');
  });
});

describe('what the app writes', () => {
  const dismissal = {
    createdAt: '2026-08-13T10:00:00.000Z',
    editor: 'Danielle',
    scope: 'finding',
    action: 'dismissed',
    store: 'nl',
    page: 'terrasoverkapping',
    findingId: 'a1b2c3d4e5f6a7b8',
    note: 'Prijs verschilt per omgeving.',
  };

  const roundTrip = (event) => toEvent({ id: 1, created_at: event.createdAt, ...toRow(event) });

  it('round-trips a dismissal through the row shape', () => {
    expect(roundTrip(dismissal)).toMatchObject({
      scope: 'finding',
      action: 'dismissed',
      findingId: 'a1b2c3d4e5f6a7b8',
      note: 'Prijs verschilt per omgeving.',
    });
  });

  it('leaves the retired columns out of the row entirely', () => {
    // Not `null`: absent. Both columns keep their table defaults, and an insert that named
    // them would be the app writing to a shape ADR 0011 retired.
    const row = toRow(dismissal);
    expect(row).not.toHaveProperty('anchor_heading');
    expect(row).not.toHaveProperty('names_section');
  });

  it('nulls the key column the scope does not use', () => {
    // `override_key` in the schema wants exactly one of the two, and a missing property
    // and an explicit null are not the same thing to Postgres.
    expect(toRow(dismissal).class).toBeNull();
  });

  it('round-trips a page review', () => {
    expect(roundTrip({
      ...dismissal, scope: 'page', action: 'reviewed', findingId: undefined, findingSetHash: 'h1', note: undefined,
    })).toMatchObject({ scope: 'page', action: 'reviewed', findingSetHash: 'h1' });
  });

  const annotation = {
    ...dismissal, findingId: undefined, note: undefined, ...priorityEventFor('high'),
  };

  it('round-trips a page priority', () => {
    expect(roundTrip(annotation)).toMatchObject({
      scope: 'page', action: 'prioritised', priority: 'high',
    });
  });

  it('carries a cleared priority as an explicit null and not as an absent column', () => {
    // The clearing **is** the value here: a row with no `priority` column named would take
    // the column default, and the derivation reads the latest `prioritised` event's value
    // whatever it is. Absent and null are not the same thing to Postgres.
    const row = toRow({ ...annotation, ...priorityEventFor(null) });
    expect(row).toHaveProperty('priority');
    expect(row.priority).toBeNull();
  });

  it('round-trips a page note without it becoming a dismissal note', () => {
    // Both live in the `note` column, and the action is what tells them apart.
    expect(roundTrip({ ...annotation, ...noteEventFor('Campagne-update') })).toMatchObject({
      scope: 'page', action: 'noted', note: 'Campagne-update',
    });
  });
});
