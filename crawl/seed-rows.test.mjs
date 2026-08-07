import { describe, expect, it } from 'vitest';
import { cellWithBothSides } from './seed-rows.mjs';

const row = (stores) => ({ page: 'overkappingen', stores });

/**
 * The rule that decides whether a store has a page axis A can check. The crawler
 * and the dashboard both ask it, and ticket 38's review found them asking it two
 * different ways.
 */
describe('cellWithBothSides', () => {
  it('gives the cell when the store has both sides', () => {
    const cell = { prodUrl: 'https://prod/x', newUrl: 'https://new/x' };
    expect(cellWithBothSides(row({ nl: cell }), 'nl')).toBe(cell);
  });

  it('gives nothing for a null cell', () => {
    // A null cell says the store does not have the page. That is axis B's
    // subject, never a crawl target.
    expect(cellWithBothSides(row({ nl: null }), 'nl')).toBeNull();
    expect(cellWithBothSides(row({}), 'nl')).toBeNull();
    expect(cellWithBothSides({ page: 'overkappingen' }, 'nl')).toBeNull();
  });

  it('gives nothing when one side is missing', () => {
    // Axis A compares two sides, so one side is not something it can check.
    // `veranda-configurator` carries empty strings on the five non-nl stores,
    // which is the shape this case is really about.
    expect(cellWithBothSides(row({ de: { prodUrl: 'https://prod/x' } }), 'de')).toBeNull();
    expect(cellWithBothSides(row({ de: { newUrl: 'https://new/x' } }), 'de')).toBeNull();
    expect(cellWithBothSides(row({ de: { prodUrl: '', newUrl: '' } }), 'de')).toBeNull();
  });

  it('reads one store and not its neighbour', () => {
    const both = { prodUrl: 'https://prod/x', newUrl: 'https://new/x' };
    const seed = row({ be: both, be_fr: null });
    expect(cellWithBothSides(seed, 'be')).toBe(both);
    expect(cellWithBothSides(seed, 'be_fr')).toBeNull();
  });
});
