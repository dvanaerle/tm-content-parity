import { describe, expect, it } from 'vitest';

import {
  readingEventFor,
  recordLayoutFrom,
  separateEventFor,
  sharedEventFor,
} from './record-layout.mjs';

/**
 * Events as the table holds them, newest last. The derivation is pure, so these are
 * hand-written and no Supabase project is involved — the split `overrides/supabase.mjs`
 * describes.
 *
 * @param {string} at An ISO stamp, which orders the events.
 */
const separate = (store, page, at, record = 412, reason = 'Belgian legal text.') => ({
  id: `${store}-${page}-${at}`,
  createdAt: at,
  editor: 'd.aerle',
  kind: 'separate',
  store,
  page,
  recordId: record,
  reason,
  takenOn: null,
});

const shared = (store, page, at, reason = 'The merge landed.') => ({
  ...separate(store, page, at),
  kind: 'shared',
  recordId: null,
  reason,
});

const reading = (takenOn, at) => ({
  id: `reading-${at}`,
  createdAt: at,
  editor: 'd.aerle',
  kind: 'reading',
  store: null,
  page: null,
  recordId: null,
  reason: null,
  takenOn,
});

describe('the record layout the events add up to', () => {
  it('turns a separate-record event into the entry the rule takes', () => {
    const layout = recordLayoutFrom([
      reading('2026-08-19', '2026-08-19T09:00:00Z'),
      separate('be', 'algemene-voorwaarden', '2026-08-19T09:05:00Z'),
    ]);

    expect(layout.takenOn).toBe('2026-08-19');
    expect(layout.notShared).toEqual([
      {
        store: 'be',
        page: 'algemene-voorwaarden',
        record: 412,
        reason: 'Belgian legal text.',
        editor: 'd.aerle',
        writtenAt: '2026-08-19T09:05:00Z',
      },
    ]);
  });

  // The withdrawal is a later event and never an edit, because the table has no UPDATE
  // policy and the absence of the policy is the protection.
  it('drops an entry a later shared event withdrew', () => {
    const layout = recordLayoutFrom([
      reading('2026-08-19', '2026-08-19T09:00:00Z'),
      separate('be', 'algemene-voorwaarden', '2026-08-19T09:05:00Z'),
      shared('be', 'algemene-voorwaarden', '2026-08-20T11:00:00Z'),
    ]);

    expect(layout.notShared).toEqual([]);
  });

  it('takes the newest event per store page, whatever order they arrive in', () => {
    const layout = recordLayoutFrom([
      reading('2026-08-19', '2026-08-19T09:00:00Z'),
      shared('be', 'garantie', '2026-08-20T11:00:00Z'),
      separate('be', 'garantie', '2026-08-21T08:00:00Z', 421, 'Split again in Magento.'),
    ]);

    expect(layout.notShared).toEqual([
      {
        store: 'be',
        page: 'garantie',
        record: 421,
        reason: 'Split again in Magento.',
        editor: 'd.aerle',
        writtenAt: '2026-08-21T08:00:00Z',
      },
    ]);
  });

  // A correction is a later row, the way everything else in this log is corrected — so the
  // newest **written** reading wins, and not the newest date somebody typed.
  it('takes the newest written reading, and not the latest date', () => {
    const layout = recordLayoutFrom([
      reading('2026-08-19', '2026-08-19T09:00:00Z'),
      reading('2026-07-01', '2026-08-22T09:00:00Z'),
    ]);

    expect(layout.takenOn).toBe('2026-07-01');
  });

  // An empty table must never mean *everything is shared*. Without a reading there is no
  // date, and `sharedPageIndex()` shares nothing without one.
  it('has no date at all until the grid has been read', () => {
    const layout = recordLayoutFrom([
      separate('be', 'algemene-voorwaarden', '2026-08-19T09:05:00Z'),
    ]);

    expect(layout.takenOn).toBe(null);
    expect(layout.notShared).toHaveLength(1);
  });

  it('is empty and undated over no events', () => {
    expect(recordLayoutFrom([])).toEqual({ notShared: [], takenOn: null, readings: [] });
  });

  // The readings are a sequence and the screen says how old the newest one is, so the
  // derivation carries all of them rather than only the answer it used.
  it('carries every reading, newest first', () => {
    const layout = recordLayoutFrom([
      reading('2026-07-01', '2026-07-01T09:00:00Z'),
      reading('2026-08-19', '2026-08-19T09:00:00Z'),
    ]);

    expect(layout.readings.map((one) => one.takenOn)).toEqual(['2026-08-19', '2026-07-01']);
  });
});

describe('the events the interface writes', () => {
  it('names a store page, its record and its reason on a separate event', () => {
    expect(
      separateEventFor({
        store: 'be',
        page: 'algemene-voorwaarden',
        record: 412,
        reason: 'Belgian legal text.',
      }),
    ).toEqual({
      kind: 'separate',
      store: 'be',
      page: 'algemene-voorwaarden',
      record_id: 412,
      reason: 'Belgian legal text.',
    });
  });

  it('withdraws with a reason and no record id', () => {
    expect(sharedEventFor({ store: 'be', page: 'garantie', reason: 'The merge landed.' })).toEqual({
      kind: 'shared',
      store: 'be',
      page: 'garantie',
      reason: 'The merge landed.',
    });
  });

  it('records a reading as a day and nothing else', () => {
    expect(readingEventFor('2026-08-19')).toEqual({ kind: 'reading', taken_on: '2026-08-19' });
  });

  // The table refuses these, and so does this, so a caller learns at the seam rather than
  // from a constraint violation in a browser.
  it.each([
    ['no record id', { store: 'be', page: 'x', record: null, reason: 'why' }],
    ['no reason', { store: 'be', page: 'x', record: 412, reason: '  ' }],
    ['no page', { store: 'be', page: '', record: 412, reason: 'why' }],
  ])('refuses a separate event with %s', (_what, input) => {
    expect(() => separateEventFor(input)).toThrow();
  });

  it('refuses a reading that is not a day', () => {
    expect(() => readingEventFor('19 Aug 2026')).toThrow();
  });
});
