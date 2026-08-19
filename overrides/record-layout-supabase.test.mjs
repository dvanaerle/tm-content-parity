import { describe, expect, it } from 'vitest';

import { createRecordLayoutPort, toEvent } from './record-layout-supabase.mjs';
import { readingEventFor, recordLayoutFrom, separateEventFor } from './record-layout.mjs';

/**
 * The port is thin, so what these tests pin is the two things in it that are not a mapper:
 * the read pages the way the override port's does, and the append refuses to write without a
 * name.
 *
 * There is no test Supabase project. The fake below is the shape `overrides/supabase.test.mjs`
 * uses and for the same reason — a `PostgrestBuilder` is a thenable that collects its query
 * and runs it on await, so a client that caps is the only way to observe the paging.
 */
const fakeSupabase = (rows, cap, onInsert = () => {}) => ({
  from: () => {
    let window = [0, Number.MAX_SAFE_INTEGER];
    let inserted = null;

    const builder = {
      select: () => builder,
      order: () => builder,
      range: (from, to) => {
        window = [from, to];
        return builder;
      },
      insert: (row) => {
        inserted = row;
        onInsert(row);
        return builder;
      },
      single: () => ({ data: { id: 1, created_at: '2026-08-19T09:00:00.000Z', ...inserted } }),
      // oxlint-disable-next-line unicorn/no-thenable
      then: (resolve) => {
        const [from, to] = window;
        resolve({ data: rows.slice(from, to + 1).slice(0, cap), error: null });
      },
    };
    return builder;
  },
});

const row = (id, extra) => ({
  id,
  created_at: `2026-08-19T09:${String(id).padStart(2, '0')}:00.000Z`,
  editor: 'd.aerle',
  kind: 'separate',
  store: 'be',
  page: `page-${id}`,
  record_id: 400 + id,
  reason: 'Own record.',
  taken_on: null,
  ...extra,
});

describe('reading the record layout', () => {
  it('maps a row to the event the derivation takes', () => {
    expect(toEvent(row(1, { taken_on: null }))).toEqual({
      id: '1',
      createdAt: '2026-08-19T09:01:00.000Z',
      editor: 'd.aerle',
      kind: 'separate',
      store: 'be',
      page: 'page-1',
      recordId: 401,
      reason: 'Own record.',
      takenOn: null,
    });
  });

  it('maps a reading, which claims nothing about one page', () => {
    const reading = toEvent(
      row(2, { kind: 'reading', store: null, page: null, record_id: null, taken_on: '2026-08-19' }),
    );

    expect(reading.kind).toBe('reading');
    expect(reading.store).toBe(null);
    expect(reading.takenOn).toBe('2026-08-19');
  });

  // The same defect the override port pages around, on a table that is small **today**. A
  // truncated read of this table would drop the newest entries, which is to say it would grant
  // sharing on pages somebody has just said are separate records.
  it('reads past a server that caps a select', async () => {
    const rows = Array.from({ length: 2400 }, (_, i) => row(i + 1));
    const port = createRecordLayoutPort({ client: fakeSupabase(rows, 1000) });

    const events = await port.readEvents();

    expect(events).toHaveLength(2400);
    expect(events.at(-1)?.page).toBe('page-2400');
  });

  it('is loud when the read fails, and never answers with an empty list', async () => {
    const failing = {
      from: () => {
        const builder = {
          select: () => builder,
          order: () => builder,
          range: () => builder,
          // oxlint-disable-next-line unicorn/no-thenable
          then: (resolve) => resolve({ data: null, error: { message: 'network' } }),
        };
        return builder;
      },
    };

    await expect(createRecordLayoutPort({ client: failing }).readEvents()).rejects.toThrow(
      /record layout/,
    );
  });
});

describe('writing to the record layout', () => {
  it('adds the editor and writes the columns the event named', async () => {
    let written = null;
    const port = createRecordLayoutPort({
      client: fakeSupabase([], 1000, (one) => {
        written = one;
      }),
    });

    await port.appendEvent(
      separateEventFor({ store: 'be', page: 'garantie', record: 421, reason: 'Own record.' }),
      ' d.aerle ',
    );

    expect(written).toEqual({
      kind: 'separate',
      store: 'be',
      page: 'garantie',
      record_id: 421,
      reason: 'Own record.',
      editor: 'd.aerle',
    });
  });

  // There is no login — an editor is a name in `localStorage` — so the name is the only
  // attribution there is, and a row without one is a fact nobody can ask about.
  it('refuses to write without a name', async () => {
    const port = createRecordLayoutPort({ client: fakeSupabase([], 1000) });

    await expect(port.appendEvent(readingEventFor('2026-08-19'), '  ')).rejects.toThrow(/who you/);
  });

  // The round trip the interface makes: write, read back, derive. It is what says the three
  // event builders, the columns and the derivation all agree on one spelling.
  it('comes back through the derivation as the layout it wrote', async () => {
    const stored = [];
    const port = createRecordLayoutPort({
      client: fakeSupabase(stored, 1000, (one) => {
        stored.push({
          id: stored.length + 1,
          created_at: `2026-08-19T09:0${stored.length}:00`,
          ...one,
        });
      }),
    });

    await port.appendEvent(readingEventFor('2026-08-19'), 'd.aerle');
    await port.appendEvent(
      separateEventFor({ store: 'be', page: 'garantie', record: 421, reason: 'Own record.' }),
      'd.aerle',
    );

    const layout = recordLayoutFrom(await port.readEvents());

    expect(layout.takenOn).toBe('2026-08-19');
    expect(layout.notShared).toEqual([
      {
        store: 'be',
        page: 'garantie',
        record: 421,
        reason: 'Own record.',
        editor: 'd.aerle',
        writtenAt: '2026-08-19T09:01:00',
      },
    ]);
  });
});
