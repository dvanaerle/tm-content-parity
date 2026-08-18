import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decodeRunLog, encodeRunLog, nextRunLog, readRunLog, writeRunLog } from './run-log.mjs';

const FIRST = '2026-08-01T09:00:00.000Z-aaaaaaaa';
const SECOND = '2026-08-08T09:00:00.000Z-bbbbbbbb';

/** A finding as the index sees it: an id and the three facts that name where it is. */
const finding = (id, store = 'nl') => ({ id, store, page: '(home)', class: 'text-missing' });

const rowsById = (log) => new Map(log.rows.map((row) => [row.id, row]));

describe('the run log records when an id was first seen', () => {
  it('gives a first run its own observation', () => {
    const log = nextRunLog({
      previous: null,
      snapshot: [finding('aaa'), finding('bbb')],
      observationId: FIRST,
      covered: ['nl'],
    });

    expect(rowsById(log).get('aaa')).toMatchObject({
      firstSeen: FIRST,
      lastSeen: FIRST,
      seen: true,
    });
  });
  // The gate this ticket rests on. An index that churns on an unchanged site is broken:
  // every first-seen date would read as today and the record would say nothing.
  it('moves no first-seen date when a second run finds the same ids', () => {
    const first = nextRunLog({
      previous: null,
      snapshot: [finding('aaa'), finding('bbb')],
      observationId: FIRST,
      covered: ['nl'],
    });
    const second = nextRunLog({
      previous: first,
      snapshot: [finding('aaa'), finding('bbb')],
      observationId: SECOND,
      covered: ['nl'],
    });

    expect(second.rows.map((row) => row.firstSeen)).toEqual([FIRST, FIRST]);
  });

  it('gives a finding new in the second run the date of that run', () => {
    const first = nextRunLog({
      previous: null,
      snapshot: [finding('aaa')],
      observationId: FIRST,
      covered: ['nl'],
    });
    const second = nextRunLog({
      previous: first,
      snapshot: [finding('aaa'), finding('ccc')],
      observationId: SECOND,
      covered: ['nl'],
    });

    expect(rowsById(second).get('ccc')).toMatchObject({ firstSeen: SECOND, seen: true });
  });

  // Not a decision, and nobody made it: the row is marked, and the date it keeps is the
  // last run that actually saw the id.
  it('marks an id the run no longer holds and keeps its last-seen date', () => {
    const first = nextRunLog({
      previous: null,
      snapshot: [finding('aaa'), finding('bbb')],
      observationId: FIRST,
      covered: ['nl'],
    });
    const second = nextRunLog({
      previous: first,
      snapshot: [finding('aaa')],
      observationId: SECOND,
      covered: ['nl'],
    });

    expect(rowsById(second).get('bbb')).toMatchObject({ seen: false, lastSeen: FIRST });
  });

  // `node compare/30-compare.mjs nl` compares one store. The other five were not looked
  // at, and *not looked at* is not *gone*.
  it('leaves a store the run did not compare untouched', () => {
    const first = nextRunLog({
      previous: null,
      snapshot: [finding('aaa', 'nl'), finding('ddd', 'de')],
      observationId: FIRST,
      covered: ['nl', 'de'],
    });
    const second = nextRunLog({
      previous: first,
      snapshot: [finding('aaa', 'nl')],
      observationId: SECOND,
      covered: ['nl'],
    });

    expect(rowsById(second).get('ddd')).toMatchObject({ seen: true, lastSeen: FIRST });
  });

  /**
   * The rule ticket 01 refused a fuzzy re-attachment pass to protect, asserted on the
   * derivation itself: two runs whose findings share their ids and share nothing else
   * produce one index. The text is not an argument to `nextRunLog()`, so this cannot be
   * broken without changing the signature — which is what the test is guarding.
   */
  it('reads the ids and nothing else', () => {
    const previous = nextRunLog({
      previous: null,
      snapshot: [finding('aaa')],
      observationId: FIRST,
      covered: ['nl'],
    });
    const run = (extra) =>
      nextRunLog({
        previous,
        snapshot: [{ ...finding('aaa'), ...extra }],
        observationId: SECOND,
        covered: ['nl'],
      }).rows;

    expect(run({ prod: 'Terrasoverkapping', new: null })).toEqual(
      run({ prod: 'Something else entirely', new: 'And a second side' }),
    );
  });
});

describe('the file the run log is committed as', () => {
  const log = () =>
    nextRunLog({
      previous: null,
      snapshot: [finding('aaa'), finding('bbb', 'de')],
      observationId: FIRST,
      covered: ['nl', 'de'],
    });

  it('reads back what it wrote', () => {
    expect(decodeRunLog(encodeRunLog(log()))).toEqual(log());
  });

  /**
   * The reason the file is lines and not one object, and the reason a row that is still
   * seen does not write its last-seen date. Git history is the archive (ADR 0004), and an
   * index whose 60,000 rows are all rewritten by a run that found nothing new is an
   * archive nobody can read. An unchanged run moves the header and nothing under it.
   */
  it('leaves every row byte for byte where the run found no change', () => {
    const first = log();
    const second = nextRunLog({
      previous: first,
      snapshot: [finding('aaa'), finding('bbb', 'de')],
      observationId: SECOND,
      covered: ['nl', 'de'],
    });
    const rowsOf = (text) => text.split('\n').slice(1);

    expect(rowsOf(encodeRunLog(second))).toEqual(rowsOf(encodeRunLog(first)));
  });

  it('reads a missing file as an empty index rather than failing', async () => {
    expect(await readRunLog(new URL('./no-such-run-log.jsonl', import.meta.url))).toBeNull();
  });

  it('reads back a row the last run no longer held', async () => {
    const url = new URL('./run-log-roundtrip.jsonl', pathToFileURL(`${tmpdir()}/`));
    const gone = nextRunLog({
      previous: log(),
      snapshot: [finding('bbb', 'de')],
      observationId: SECOND,
      covered: ['nl', 'de'],
    });
    await writeRunLog(gone, url);

    expect(rowsById(await readRunLog(url)).get('aaa')).toMatchObject({
      seen: false,
      lastSeen: FIRST,
    });
  });
});

/**
 * Ticket 78. The note beside a finding asks *which run stopped seeing that id*, and the
 * last run that **saw** a row is one run short of the answer.
 *
 * It is recorded rather than reconstructed. A reader can only rebuild the run sequence from
 * the observations the rows name, and a run that retires an id without introducing one
 * names itself nowhere: every row it still sees is seen again later and overwrites it. That
 * run then drops out of the sequence, and its closures are attributed to a later run — a
 * note beside a finding that appeared after them.
 */
describe('the run log records which run stopped seeing an id', () => {
  const THIRD = '2026-08-15T09:00:00.000Z-cccccccc';

  const upTo = (...snapshots) =>
    snapshots.reduce(
      (previous, snapshot, at) =>
        nextRunLog({
          previous,
          snapshot,
          observationId: [FIRST, SECOND, THIRD][at],
          covered: ['nl'],
        }),
      /** @type {any} */ (null),
    );

  it('names the run, and not the last run that saw the id', () => {
    const log = upTo([finding('aaa')], []);

    expect(rowsById(log).get('aaa')).toMatchObject({ lastSeen: FIRST, retiredAt: SECOND });
  });

  /**
   * The retirement is a fact about one moment, so a later run that also fails to see the id
   * must not restamp it. Without this the answer walks forward one run at a time and every
   * closure reads as having happened in the newest run.
   */
  it('keeps the run that retired it when a later run does not see it either', () => {
    const log = upTo([finding('aaa')], [], []);

    expect(rowsById(log).get('aaa').retiredAt).toBe(SECOND);
  });

  // An id that comes back is seen, and nothing has stopped seeing it.
  it('clears the run where the id is seen again', () => {
    const log = upTo([finding('aaa')], [], [finding('aaa')]);

    expect(rowsById(log).get('aaa')).toMatchObject({ seen: true, retiredAt: null });
  });

  it('survives the file', () => {
    const log = upTo([finding('aaa')], []);

    expect(rowsById(decodeRunLog(encodeRunLog(log))).get('aaa').retiredAt).toBe(SECOND);
  });

  /**
   * The gate ticket 77 rests on, asked of the new field: a run over an unchanged corpus
   * must rewrite no line. A row that is seen carries no retirement, so it writes none.
   */
  it('writes no retirement on a row that is seen', () => {
    const log = upTo([finding('aaa')], [finding('aaa')]);

    expect(encodeRunLog(log)).not.toContain('gone');
  });
});
