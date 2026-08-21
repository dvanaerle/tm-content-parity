import { describe, expect, it } from 'vitest';
import { flattenedPages, flattenedUnits } from './flattening.mjs';

const unit = (raw, index, part = {}) => ({
  tag: 'p',
  kind: 'text',
  level: null,
  raw,
  norm: raw,
  index,
  ...part,
});

/*
 * The delivery area, in the three wordings the measurement found (`FLATTENING.md`). They
 * are long and they overlap heavily on purpose: `diffRows()` pairs two units on
 * similarity, so a short pair of sentences is not one block that changed but two blocks,
 * one lost and one added — which is a different fact and not this reading's.
 */
const DUTCH_FIRST =
  'Levering in Nederland en België aan huis, met uitzondering van de Waddeneilanden.';
const BELGIAN_FIRST =
  'Levering in België en Nederland aan huis, met uitzondering van de Waddeneilanden.';
const BENELUX = 'Levering in de Benelux aan huis, met uitzondering van de Waddeneilanden.';

/** One page, both sides, from two lists of texts. */
const sides = (production, next) => ({
  production: production?.map((text, at) => unit(text, at)) ?? null,
  new: next?.map((text, at) => unit(text, at)) ?? null,
});

describe('a flattened store difference', () => {
  it('reports a unit the two stores differ on and the new site says one thing for', () => {
    // The delivery area, `levergebied`, `nl` against `be`: production orders the countries
    // by the store's own country and both new sites order them Belgium first, so the Dutch
    // store now lists Belgium ahead of the Netherlands.
    const found = flattenedUnits({
      here: sides([DUTCH_FIRST, 'Gelijk'], [BELGIAN_FIRST, 'Gelijk']),
      there: sides([BELGIAN_FIRST, 'Gelijk'], [BELGIAN_FIRST, 'Gelijk']),
    });

    expect(found.map((one) => [one.here.norm, one.there.norm, one.newBoth.norm])).toEqual([
      [DUTCH_FIRST, BELGIAN_FIRST, BELGIAN_FIRST],
    ]);
  });

  it('reports a divergence the new site rewrote into words neither store had', () => {
    // 21 of the measured 111 are this. It is still a store difference the migration lost:
    // production varied and the new site does not, and which store won is not the question.
    const found = flattenedUnits({
      here: sides([DUTCH_FIRST], [BENELUX]),
      there: sides([BELGIAN_FIRST], [BENELUX]),
    });

    expect(found).toHaveLength(1);
  });

  it('says nothing about a unit the two stores agree on, on production', () => {
    // The divergence on production is the whole premise. Two stores that already agree
    // have no store difference for a migration to lose.
    expect(
      flattenedUnits({
        here: sides(['Gelijk'], ['Iets anders']),
        there: sides(['Gelijk'], ['Iets anders']),
      }),
    ).toEqual([]);
  });

  it('says nothing where the new site keeps the two stores apart', () => {
    // A legal text that differs on production and still differs on the new site is
    // correct, not defective, and it is not this reading's business.
    expect(
      flattenedUnits({
        here: sides([DUTCH_FIRST], [DUTCH_FIRST]),
        there: sides([BELGIAN_FIRST], [BELGIAN_FIRST]),
      }),
    ).toEqual([]);
  });

  it('claims nothing where one store lost the unit altogether', () => {
    // The new site does not carry this store's unit at all, so nothing was aligned. That
    // is an axis-A absence on this store, and reading it as agreement would report a
    // flattening on the strength of a unit nobody found.
    expect(
      flattenedUnits({
        here: sides([DUTCH_FIRST], ['Onze showroom is dagelijks geopend van negen tot zes uur.']),
        there: sides([BELGIAN_FIRST], [BELGIAN_FIRST]),
      }),
    ).toEqual([]);
  });

  it('claims nothing where a side has nothing to align', () => {
    const both = ['Woorden'];
    expect(flattenedUnits({ here: sides(both, null), there: sides(both, both) })).toEqual([]);
    expect(flattenedUnits({ here: sides(both, both), there: sides(null, both) })).toEqual([]);
    expect(flattenedUnits({ here: sides(both, both), there: sides([], both) })).toEqual([]);
  });
});

/**
 * The same reading over a whole block, which is what orders the dashboard's list.
 *
 * The pairing is `siblingPages()`' own, so the list and the tab cannot disagree about
 * which page is whose sibling — a page lifted up the list for a flattening the tab does
 * not draw would be the ordering pointing at nothing.
 */
describe('the flattened pages of a block', () => {
  /** One seed row, as `crawl/seed-list.mjs` writes it. */
  const row = (page, paths) => ({
    page,
    stores: Object.fromEntries(
      Object.entries(paths).map(([store, path]) => [store, { path, provenance: 'sitemap-daily' }]),
    ),
  });

  const rows = [
    row('levergebied', { nl: 'levergebied', be: 'levergebied' }),
    row('carport', { nl: 'carport', be: 'carport' }),
    row('pergola', { nl: 'pergola' }),
  ];

  const corpus = {
    nl: {
      levergebied: sides([DUTCH_FIRST, 'Gelijk'], [BELGIAN_FIRST, 'Gelijk']),
      carport: sides(['Gelijk'], ['Gelijk']),
    },
    be: {
      levergebied: sides([BELGIAN_FIRST], [BELGIAN_FIRST]),
      carport: sides(['Gelijk'], ['Gelijk']),
    },
  };
  const sidesOf = (store, page) => corpus[store]?.[page] ?? null;

  it('counts the flattened units of each page that has any', () => {
    expect([...flattenedPages({ rows, store: 'nl', sidesOf })]).toEqual([['levergebied', 1]]);
  });

  it('leaves a page nothing was measured on out of the map altogether', () => {
    // `pergola` has no sibling and no page over there has a report. Nothing was compared,
    // so nothing is claimed — and a zero would be a measurement.
    const found = flattenedPages({ rows, store: 'nl', sidesOf: () => null });

    expect(found.size).toBe(0);
  });

  it('answers nothing for a store in no block', () => {
    // `de` and `uk` are each alone in their language, so there is no second store for a
    // migration to flatten anything into.
    expect(flattenedPages({ rows, store: 'de', sidesOf }).size).toBe(0);
  });
});
