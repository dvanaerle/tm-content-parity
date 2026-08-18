import { describe, expect, it } from 'vitest';
import { siblingReading } from './sibling.mjs';
import { collapseRuns, collapses } from './view.mjs';

const unit = (raw, index, part = {}) => ({
  tag: 'p',
  kind: 'text',
  level: null,
  raw,
  norm: raw,
  index,
  ...part,
});

const sibling = (units, part = {}) => ({
  store: 'be',
  page: 'carport',
  rule: 'alternate',
  units,
  ...part,
});

const read = (here, there, part = {}) =>
  siblingReading({
    store: 'nl',
    page: 'carport',
    here,
    sibling: there === undefined ? null : sibling(there, part),
  });

describe('the sibling reading', () => {
  it('answers null where no sibling was matched, so the tab is absent and not empty', () => {
    expect(
      siblingReading({ store: 'de', page: 'carport', here: [unit('Een', 0)], sibling: null }),
    ).toBe(null);
  });

  it('says which side it compares, and it is production', () => {
    expect(read([unit('Een', 0)], [unit('Een', 0)]).side).toBe('production');
  });

  it('carries the sibling and the rule that matched it, as data', () => {
    expect(read([unit('Een', 0)], [unit('Een', 0)]).sibling).toEqual({
      store: 'be',
      page: 'carport',
      rule: 'alternate',
    });
  });

  it('puts both stores on one row, in this store document order', () => {
    const here = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2)];
    const there = [unit('Een', 0), unit('Twee anders', 1), unit('Drie', 2)];

    expect(
      read(here, there).rows.map((row) => [row.here?.norm ?? null, row.there?.norm ?? null]),
    ).toEqual([
      ['Een', 'Een'],
      ['Twee', 'Twee anders'],
      ['Drie', 'Drie'],
    ]);
  });

  it('keeps a block the sibling alone has, rather than dropping what only one store says', () => {
    const here = [unit('Een', 0)];
    const there = [unit('Een', 0), unit('Alleen daar', 1)];

    expect(read(here, there).rows.map((row) => row.key)).toEqual(['b0', 's1']);
  });

  it('gives a row no class, no finding and no decision, because a block difference has none', () => {
    const rows = read(
      [unit('Verkrijgbaar in drie kleuren', 0)],
      [unit('Verkrijgbaar in vier kleuren', 0)],
    ).rows;

    expect(rows.map((row) => row.class)).toEqual([null]);
    expect(rows.map((row) => row.finding)).toEqual([null]);
    expect(rows.map((row) => row.decidable)).toEqual([false]);
  });

  it('anchors a row where no finding link can name it', () => {
    // A finding link names `finding-<digest>`, and a content row names `p<n>` or `n<n>`.
    // Neither scheme reaches a row here, which is what keeps a landing off this tab.
    const keys = read([unit('Een', 0)], [unit('Een', 0), unit('Twee', 1)]).rows.map(
      (row) => row.key,
    );

    expect(keys.every((key) => /^[bs]\d+$/.test(key))).toBe(true);
  });

  it('answers the existing collapse predicate, so a run of agreeing blocks collapses', () => {
    const here = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2), unit('Vier', 3)];
    const there = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2), unit('Vier anders', 3)];
    const { rows } = read(here, there);

    expect(rows.map(collapses)).toEqual([true, true, true, false]);

    const items = collapseRuns(rows);
    expect(items.map((item) => item.kind)).toEqual(['marker', 'row']);
    expect(items[0].blocks).toBe(3);
    // Nothing here holds a finding, so every marker is a run of agreeing blocks.
    expect(items[0].agrees).toBe(true);
  });

  it('calls a page whose sibling says the same words agreeing, and not unmeasured', () => {
    const units = [unit('Een', 0), unit('Twee', 1)];
    const reading = read(
      units,
      units.map((one) => ({ ...one })),
    );

    expect(reading.measured).toBe(true);
    expect(reading.rows.every((row) => row.equal)).toBe(true);
  });

  it('is unmeasured where the sibling page has no production report', () => {
    const reading = read([unit('Een', 0)], null);

    expect(reading.measured).toBe(false);
    expect(reading.rows).toEqual([]);
    // The sibling is still named: it was matched, and only the comparison is missing.
    expect(reading.sibling.page).toBe('carport');
  });

  it('is unmeasured where either side has no content unit at all', () => {
    expect(read([], [unit('Een', 0)]).measured).toBe(false);
    expect(read([unit('Een', 0)], []).measured).toBe(false);
  });
});
