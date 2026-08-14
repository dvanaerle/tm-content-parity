import { describe, expect, it } from 'vitest';
import { appendEach } from './bulk.mjs';

/**
 * A port that stores what it is handed, and fails on the nth call when told to.
 *
 * No Supabase project and no network: ticket 31 requires the seam to be covered by a
 * test that does not touch either, and `supabase.test.mjs` already draws that line for
 * the mapping half of this file.
 */
function fakePort({ failOn = null, message = 'de kolom weigert' } = {}) {
  const calls = [];
  return {
    calls,
    async appendEvent(event) {
      calls.push(event);
      if (calls.length === failOn)
        throw new Error(`Could not save to the override log: ${message}`);
      return {
        ...event,
        id: `row-${calls.length}`,
        createdAt: `2026-08-12T10:00:0${calls.length}.000Z`,
      };
    },
  };
}

const dismissal = (page, findingId) => ({
  scope: 'finding',
  action: 'dismissed',
  store: 'nl',
  page,
  findingId,
  editor: 'Dina',
  note: 'de footer is bewust anders',
});

const three = [
  dismissal('overkapping', 'f1'),
  dismissal('veranda', 'f2'),
  dismissal('carport', 'f3'),
];

describe('appendEach', () => {
  it('writes one event per input, in the order it was given', async () => {
    const port = fakePort();
    await appendEach(port, three);

    expect(port.calls.map((call) => call.page)).toEqual(['overkapping', 'veranda', 'carport']);
  });

  it('aims each event at its own page', async () => {
    const port = fakePort();
    const result = await appendEach(port, three);

    // The whole point of the seam change: the page is a term of the event and not of
    // the hook, so two events of one press land on two different pages.
    expect(result.stored.map((row) => row.page)).toEqual(['overkapping', 'veranda', 'carport']);
    expect(new Set(result.stored.map((row) => row.page)).size).toBe(3);
  });

  it('reports what was written when nothing failed', async () => {
    const port = fakePort();
    const result = await appendEach(port, three);

    expect(result).toMatchObject({ written: 3, total: 3, failedOn: null, error: null });
    expect(result.stored).toHaveLength(3);
  });

  it('returns the stored rows, so the caller can put them in the list it holds', async () => {
    const port = fakePort();
    const result = await appendEach(port, three);

    // Ids and timestamps are the log's to assign, so the rows that come back are the
    // ones that enter the list — never the ones that went in.
    expect(result.stored.map((row) => row.id)).toEqual(['row-1', 'row-2', 'row-3']);
  });

  it('says how many were written and which page failed', async () => {
    const port = fakePort({ failOn: 2 });
    const result = await appendEach(port, three);

    expect(result.written).toBe(1);
    expect(result.total).toBe(3);
    expect(result.failedOn).toBe('veranda');
    expect(result.error).toMatch('de kolom weigert');
  });

  it('keeps what was written before the failure', async () => {
    const port = fakePort({ failOn: 3 });
    const result = await appendEach(port, three);

    // "23 of 30 saved" is the honest report, and it needs the 23 rows themselves:
    // they are already in the log, and a caller that dropped them would show a list
    // that disagrees with the table.
    expect(result.stored.map((row) => row.page)).toEqual(['overkapping', 'veranda']);
  });

  it('stops at the first failure and does not attempt the rest', async () => {
    const port = fakePort({ failOn: 2 });
    await appendEach(port, three);

    // A log that has begun refusing is not asked twenty-eight more times, and the
    // count the interface reports stays a count of consecutive writes.
    expect(port.calls).toHaveLength(2);
  });

  it('writes nothing for an empty list', async () => {
    const port = fakePort();
    const result = await appendEach(port, []);

    expect(port.calls).toEqual([]);
    expect(result).toMatchObject({ written: 0, total: 0, failedOn: null, error: null });
  });
});
