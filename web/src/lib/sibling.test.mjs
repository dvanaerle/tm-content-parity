import { describe, expect, it } from 'vitest';
import { siblingReading } from './sibling.mjs';
import { collapseRuns, collapses } from './content-view.mjs';

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

/*
 * The delivery area in the wordings `FLATTENING.md` found, long and heavily overlapping
 * on purpose: `diffRows()` pairs two units on similarity, so a short pair of sentences is
 * two blocks — one lost, one added — and not one block that changed.
 */
const DUTCH_FIRST =
  'Levering in Nederland en België aan huis, met uitzondering van de Waddeneilanden.';
const BELGIAN_FIRST =
  'Levering in België en Nederland aan huis, met uitzondering van de Waddeneilanden.';

const read = (here, there, part = {}) =>
  siblingReading({ here, sibling: there === undefined ? null : sibling(there, part) });

describe('the sibling reading', () => {
  it('answers null where no sibling was matched, so the tab is absent and not empty', () => {
    expect(siblingReading({ here: [unit('Een', 0)], sibling: null })).toBe(null);
  });

  it('puts both stores on one row, in this store document order', () => {
    const here = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2)];
    const there = [unit('Een', 0), unit('Twee anders', 1), unit('Drie', 2)];

    expect(
      read(here, there).production.rows.map((row) => [
        row.here?.norm ?? null,
        row.there?.norm ?? null,
      ]),
    ).toEqual([
      ['Een', 'Een'],
      ['Twee', 'Twee anders'],
      ['Drie', 'Drie'],
    ]);
  });

  it('keeps a block the sibling alone has, rather than dropping what only one store says', () => {
    const here = [unit('Een', 0)];
    const there = [unit('Een', 0), unit('Alleen daar', 1)];

    expect(read(here, there).production.rows.map((row) => row.key)).toEqual(['b0', 's1']);
  });

  it('gives a row no class, no finding and no decision, because a block difference has none', () => {
    const rows = read(
      [unit('Verkrijgbaar in drie kleuren', 0)],
      [unit('Verkrijgbaar in vier kleuren', 0)],
    ).production.rows;

    expect(rows.map((row) => row.class)).toEqual([null]);
    expect(rows.map((row) => row.finding)).toEqual([null]);
    expect(rows.map((row) => row.decidable)).toEqual([false]);
  });

  it('anchors a row where no finding link can name it', () => {
    // A finding link names `finding-<digest>`, and a content row names `p<n>` or `n<n>`.
    // Neither scheme reaches a row here, which is what keeps a landing off this tab.
    const keys = read([unit('Een', 0)], [unit('Een', 0), unit('Twee', 1)]).production.rows.map(
      (row) => row.key,
    );

    expect(keys.every((key) => /^[bs]\d+$/.test(key))).toBe(true);
  });

  it('answers the existing collapse predicate, so a run of agreeing blocks collapses', () => {
    const here = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2), unit('Vier', 3)];
    const there = [unit('Een', 0), unit('Twee', 1), unit('Drie', 2), unit('Vier anders', 3)];
    const { rows } = read(here, there).production;

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

    expect(reading.production.measured).toBe(true);
    expect(reading.production.rows.every((row) => row.equal)).toBe(true);
  });

  it('is unmeasured where the sibling page has no production report', () => {
    const reading = read([unit('Een', 0)], null);

    expect(reading.production.measured).toBe(false);
    expect(reading.production.rows).toEqual([]);
    // The sibling is still named: it was matched, and only the comparison is missing.
    expect(reading.sibling.page).toBe('carport');
  });

  it('is unmeasured where either side has no content unit at all', () => {
    expect(read([], [unit('Een', 0)]).production.measured).toBe(false);
    expect(read([unit('Een', 0)], []).production.measured).toBe(false);
  });
});

/**
 * The second reading (ticket 07): the new site's two stores beside production's.
 *
 * It is here for one sentence production alone cannot say. Where production varied and
 * the new site does not, the migration lost a store difference — the warranty scope, the
 * delivery area — and one store now shows the other's words. The reading reports the
 * divergence and never its cause: a store-scoped variable renders no HTML.
 */
describe("the new site's two stores", () => {
  const bothSides = (here, hereNew, there, thereNew) =>
    siblingReading({ here, hereNew, sibling: sibling(there, { newUnits: thereNew }) });

  it("draws the new site's two stores as a reading of its own", () => {
    const reading = bothSides(
      [unit(DUTCH_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
    );

    expect(reading.newSite.side).toBe('the new site');
    expect(reading.newSite.measured).toBe(true);
    expect(reading.newSite.rows.map((row) => row.equal)).toEqual([true]);
  });

  it('marks the row production diverges on and the new site does not', () => {
    const reading = bothSides(
      [unit(DUTCH_FIRST, 0), unit('Gelijk', 1)],
      [unit(BELGIAN_FIRST, 0), unit('Gelijk', 1)],
      [unit(BELGIAN_FIRST, 0), unit('Gelijk', 1)],
      [unit(BELGIAN_FIRST, 0), unit('Gelijk', 1)],
    );

    expect(reading.production.rows.map((row) => row.flattened)).toEqual([true, false]);
    expect(reading.flattening).toBe(1);
  });

  it('marks nothing where the new site keeps the two stores apart', () => {
    // A legal text that differs on production and still differs on the new site is
    // correct and not defective, and nothing here reports it.
    const reading = bothSides(
      [unit(DUTCH_FIRST, 0)],
      [unit(DUTCH_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
    );

    expect(reading.production.rows.map((row) => row.flattened)).toEqual([false]);
    expect(reading.flattening).toBe(0);
  });

  it('marks nothing on a page whose new site was never read', () => {
    // The tab as it stood before this reading: production on both stores and no new-site
    // units at all. *And the new site does not* is then a sentence about something nobody
    // looked at, so it is not said.
    const reading = read([unit(DUTCH_FIRST, 0)], [unit(BELGIAN_FIRST, 0)]);

    expect(reading.newSite.measured).toBe(false);
    expect(reading.newSite.rows).toEqual([]);
    expect(reading.flattening).toBe(0);
    expect(reading.production.rows.every((row) => row.flattened === false)).toBe(true);
  });

  it("keeps the flattening off the new site's own rows, where the question does not arise", () => {
    const reading = bothSides(
      [unit(DUTCH_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
    );

    expect(reading.newSite.rows.every((row) => row.flattened === false)).toBe(true);
  });

  it("anchors its rows apart from production's, so one page pair has no anchor twice", () => {
    const reading = bothSides(
      [unit(DUTCH_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
    );

    expect(reading.production.rows.map((row) => row.key)).toEqual(['b0']);
    expect(reading.newSite.rows.map((row) => row.key)).toEqual(['nb0']);
  });

  it('offers no decision on a flattened row either, because a block difference has none', () => {
    // The defect, where there is one, is the axis-A finding on the store that lost its
    // words — 109 of the measured 111 already are one — and the decision stays there.
    const [row] = bothSides(
      [unit(DUTCH_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
      [unit(BELGIAN_FIRST, 0)],
    ).production.rows;

    expect(row.flattened).toBe(true);
    expect([row.class, row.finding, row.decidable]).toEqual([null, null, false]);
  });
});
