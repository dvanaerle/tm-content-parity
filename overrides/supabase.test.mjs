import { describe, expect, it } from 'vitest';

import { toEvent, toRow } from './supabase.mjs';

/**
 * The port is thin, and one thing in it is not: the mute's anchor heading has
 * three states and the table has two nulls to say them with (ADR 0008). A port
 * that flattened *absent* into *null* would turn every page-wide mute into a mute
 * of the content before the first heading, and the key would still look right.
 *
 * There is no test Supabase project, so this tests the two mappers and nothing
 * else. `createOverridesPort()` is never constructed here.
 */

const base = {
  createdAt: '2026-08-10T10:00:00.000Z',
  editor: 'Danielle',
  scope: 'page-class',
  action: 'muted',
  store: 'nl',
  page: 'terrasoverkapping',
  class: 'text-missing',
  note: 'Deze sectie roteert per campagne.',
};

const roundTrip = (event) => toEvent({ id: 1, created_at: base.createdAt, ...toRow(event) });

describe('the anchor heading crosses the port with all three states', () => {
  it('carries a named section', () => {
    const row = toRow({ ...base, anchorHeading: 'Gumax® Heavy Duty' });
    expect(row).toMatchObject({ anchor_heading: 'Gumax® Heavy Duty', names_section: true });
    expect(roundTrip({ ...base, anchorHeading: 'Gumax® Heavy Duty' }))
      .toMatchObject({ anchorHeading: 'Gumax® Heavy Duty' });
  });

  it('carries the null section as a section, and not as the page', () => {
    const row = toRow({ ...base, anchorHeading: null });
    expect(row).toMatchObject({ anchor_heading: null, names_section: true });
    expect(roundTrip({ ...base, anchorHeading: null })).toHaveProperty('anchorHeading', null);
  });

  it('carries the page-wide form as an absent heading', () => {
    const row = toRow(base);
    expect(row).toMatchObject({ anchor_heading: null, names_section: false });
    expect(roundTrip(base)).not.toHaveProperty('anchorHeading');
  });

  it('reads a row from before ticket 88 as the page-wide form', () => {
    // The table is append-only, so the history holds rows with neither column.
    expect(toEvent({
      id: 1, created_at: base.createdAt, editor: 'Danielle', scope: 'page-class',
      action: 'muted', store: 'nl', page: 'terrasoverkapping', class: 'text-missing',
    })).not.toHaveProperty('anchorHeading');
  });
});
