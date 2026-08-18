import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUN_LOG } from '../../../compare/run-log.mjs';
import { closingsFor, closingsOf, firstSeenOn } from './run-log.mjs';
import { fromRoot } from './repo-root.mjs';

const AT = '2026-08-01T09:00:00.000Z';
const index = new Map([['aaa', AT]]);

describe('the dates a page reads off the run log', () => {
  it('gives a finding the day its id was first seen', () => {
    expect(firstSeenOn(index, [{ id: 'aaa' }])).toEqual({ aaa: AT });
  });

  /**
   * The index is committed and the reports are not, so on a fresh clone the index is
   * older than the report it is read beside — and a re-check mints ids no run has seen.
   * A finding with no row says nothing. It must never guess, because the guess would be
   * *first seen today* on a difference that has been there since the first crawl.
   */
  it('says nothing about a finding the index does not hold', () => {
    expect(firstSeenOn(index, [{ id: 'zzz' }])).toEqual({});
  });
});

/**
 * The web build reads the index the compare stage writes, and it resolves the path a
 * different way — through `repo-root.mjs`, because Astro bundles server modules into
 * `web/.astro/.prerender/chunks/` where a path relative to `import.meta.url` points at
 * nothing (ticket 72).
 *
 * Two ways of naming one file is two chances for them to name different ones, and the
 * failure is silent: a missing index is a legitimate answer on a fresh clone, so the
 * build loses every date and still exits 0. It did exactly that once. This is the guard.
 */
it('reads the file the compare stage writes', () => {
  expect(fromRoot('history/run-log.jsonl')).toBe(fileURLToPath(RUN_LOG));
});

/**
 * Ticket 78. Three runs, so that the run which retired a row is a different run from the last
 * run that saw it — the two are one apart, and a fixture that conflates them would pass
 * against a reading of `lastSeen`.
 */
const FIRST = '2026-08-01T09:00:00.000Z-11111111';
const SECOND = '2026-08-02T09:00:00.000Z-22222222';
const THIRD = '2026-08-03T09:00:00.000Z-33333333';

/** @param {Partial<import('../../../compare/contract.mjs').RunLogRow>} parts */
const row = (parts) => ({
  store: 'nl',
  page: 'overkappingen',
  class: 'copy',
  firstSeen: FIRST,
  lastSeen: FIRST,
  retiredAt: SECOND,
  seen: false,
  id: '',
  ...parts,
});

/** The id of a finding drawn now, first seen in the run that retired `closed-in-second`. */
const drawn = { id: 'drawn', store: 'nl', page: 'overkappingen', class: 'copy' };

const log = {
  observationId: THIRD,
  stores: { nl: THIRD },
  rows: [
    row({ id: 'drawn', firstSeen: SECOND, lastSeen: THIRD, retiredAt: null, seen: true }),
    row({ id: 'closed-in-second', firstSeen: FIRST, lastSeen: FIRST, retiredAt: SECOND }),
    row({ id: 'closed-in-third', firstSeen: FIRST, lastSeen: SECOND, retiredAt: THIRD }),
    row({ id: 'other-class', class: 'casing' }),
    row({ id: 'other-page', page: 'carports' }),
    row({ id: 'other-store', store: 'be' }),
  ],
};

describe('the ids that closed as a finding appeared', () => {
  it('names an id of the same class on the same page that the run retired', () => {
    expect(closingsFor(closingsOf(log), [drawn])).toEqual({ drawn: ['closed-in-second'] });
  });

  /**
   * The subtle one, and the reason the fixture spans three runs. `closed-in-third` is still
   * seen by the very run that first saw `drawn`, and a later run ends it — so it closed on
   * its own. Reading the last **sighting** instead of the retirement names this row, and the
   * note would report a closure from a different moment than the finding beside it.
   */
  it('passes over an id that a later run stopped seeing', () => {
    const closings = closingsOf(log);
    expect(closings.retired.get('nl|overkappingen|copy')?.get(THIRD)).toEqual(['closed-in-third']);
    expect(closingsFor(closings, [drawn]).drawn).not.toContain('closed-in-third');
  });

  // A row that no run has ended yet is not a closure, whatever its last sighting says.
  it('passes over a row that nothing has stopped seeing', () => {
    const open = { ...log, rows: [...log.rows, row({ id: 'unended', retiredAt: null })] };

    expect(closingsFor(closingsOf(open), [drawn]).drawn).not.toContain('unended');
  });

  /**
   * Where several closed at once the note counts them, so this must hand over all of
   * them. Picking one is a match, which is the thing ADR 0004 refuses.
   */
  it('names every id where several of one class closed in one run', () => {
    const several = {
      ...log,
      rows: [...log.rows, row({ id: 'also-closed-in-second', retiredAt: SECOND })],
    };
    expect(closingsFor(closingsOf(several), [drawn]).drawn).toEqual([
      'closed-in-second',
      'also-closed-in-second',
    ]);
  });

  it('says nothing about a finding the index does not hold', () => {
    expect(closingsFor(closingsOf(log), [{ ...drawn, id: 'unseen' }])).toEqual({});
  });
});
