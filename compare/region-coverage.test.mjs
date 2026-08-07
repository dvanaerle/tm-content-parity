import { describe, expect, it } from 'vitest';

import {
  CoverageTally, coverageChanges, coverageDelta, coverageReport, whyNotComparable,
} from './region-coverage.mjs';

const BANNER = '.mgz-element-section:has(a)';
const GRID = '#grid';

const ENTRIES = [
  { selector: BANNER, kind: 'legacy-only', reason: 'x', measured: { pages: ['a', 'b', 'c'], production: 9, new: 0 } },
  { selector: GRID, kind: 'non-editorial', reason: 'x', measured: { pages: ['a', 'b', 'c'], production: 4, new: 4 } },
];

/** @param {string[]} selectors */
const cut = (...selectors) => selectors.map((selector) => ({ selector, units: 9 }));

/** One tally over a list of pages, each page given as the two sides' removals. */
function tallyOf(pages, entries = ENTRIES) {
  const tally = new CoverageTally(entries);
  for (const page of pages) tally.addPage(page);
  return tally.all();
}

describe('CoverageTally', () => {
  it('counts the pages and the units an entry was removed on, per side', () => {
    const coverage = tallyOf([
      { production: cut(BANNER, GRID), new: cut(GRID) },
      { production: cut(BANNER), new: [] },
    ]);

    expect(coverage).toEqual([
      { selector: BANNER, kind: 'legacy-only', removedOn: { production: { pages: 2, units: 18 }, new: { pages: 0, units: 0 } } },
      { selector: GRID, kind: 'non-editorial', removedOn: { production: { pages: 1, units: 9 }, new: { pages: 1, units: 9 } } },
    ]);
  });

  it('lists an entry that matched nowhere, so a zero is a number and not an absence', () => {
    const coverage = tallyOf([{ production: [], new: [] }]);

    expect(coverage.map((region) => region.selector)).toEqual([BANNER, GRID]);
    expect(coverage[0].removedOn.production.pages).toBe(0);
  });

  it('ignores a removal for a selector that is not in the list any more', () => {
    // A report on disk was built by an older list. Its numbers belong to no entry.
    const coverage = tallyOf([{ production: cut('#gone'), new: [] }]);

    expect(coverage.map((region) => region.selector)).toEqual([BANNER, GRID]);
  });

  it('reads a page whose side carries no removals at all, because a pre-63 report has none', () => {
    expect(() => tallyOf([{ production: undefined, new: undefined }])).not.toThrow();
  });
});

describe('whyNotComparable', () => {
  const current = { store: null, regions: tallyOf([{ production: cut(BANNER), new: [] }]) };

  it('says a first run has nothing to compare against', () => {
    expect(whyNotComparable(null, current)).toMatch(/No previous snapshot/);
  });

  it('says a snapshot older than this rule holds no coverage', () => {
    expect(whyNotComparable({ store: null }, current)).toMatch(/older than ticket 64/);
  });

  it('refuses to compare one store against the whole corpus', () => {
    // A `node compare/30-compare.mjs nl` run would otherwise read as five stores
    // that stopped matching.
    const reason = whyNotComparable({ store: 'nl', regions: [] }, current);
    expect(reason).toMatch(/covers nl/);
    expect(reason).toMatch(/every store/);
  });

  it('compares two runs of the same scope', () => {
    expect(whyNotComparable({ store: null, regions: [] }, current)).toBeNull();
  });
});

describe('coverageChanges', () => {
  const before = tallyOf([
    { production: cut(BANNER, GRID), new: cut(GRID) },
    { production: cut(BANNER), new: [] },
  ]);

  it('calls an entry unchanged when both sides hold the same page count', () => {
    expect(coverageChanges(before, before).map((change) => change.verdict))
      .toEqual(['unchanged', 'unchanged']);
  });

  it('calls out an entry that matched and now matches nowhere', () => {
    const after = tallyOf([{ production: cut(GRID), new: cut(GRID) }]);
    const change = coverageChanges(before, after).find((c) => c.selector === BANNER);

    expect(change.verdict).toBe('stopped-matching');
    expect(change.was.pages).toBe(2);
    expect(change.now.pages).toBe(0);
  });

  it('tells a narrower match apart from one that stopped', () => {
    const after = tallyOf([{ production: cut(BANNER), new: [] }]);

    expect(coverageChanges(before, after).find((c) => c.selector === BANNER).verdict)
      .toBe('narrowed');
  });

  it('reports an entry that started matching, because a new entry is also news', () => {
    const after = tallyOf([
      { production: cut(BANNER, GRID), new: cut(GRID) },
      { production: cut(BANNER), new: cut(BANNER) },
    ]);

    expect(coverageChanges(before, after).find((c) => c.selector === BANNER).verdict)
      .toBe('widened');
  });

  it('reports an entry the list gained, and one it lost', () => {
    const gained = coverageChanges([], before);
    expect(gained.map((change) => change.verdict)).toEqual(['new-entry', 'new-entry']);

    const lost = coverageChanges(before, []);
    expect(lost.map((change) => change.verdict)).toEqual(['left-the-list', 'left-the-list']);
  });
});

describe('coverageReport', () => {
  const before = tallyOf([
    { production: cut(BANNER, GRID), new: cut(GRID) },
    { production: cut(BANNER), new: [] },
  ]);

  it('says nothing when nothing moved, so a quiet run stays quiet', () => {
    expect(coverageReport({ store: null, regions: before }, { store: null, regions: before }))
      .toEqual([]);
  });

  it('says a region that stopped matching in one line, and names both numbers', () => {
    const after = tallyOf([{ production: cut(GRID), new: cut(GRID) }]);
    const lines = coverageReport(
      { store: null, regions: before },
      { store: null, regions: after },
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain(BANNER);
    expect(lines[0]).toContain('2 pages');
    expect(lines[0]).toContain('0 now');
    expect(lines[0]).toMatch(/stopped matching/);
  });

  it('gives the reason in one line when the two runs cannot be compared', () => {
    expect(coverageReport(null, { store: null, regions: before }))
      .toEqual([expect.stringMatching(/No previous snapshot/)]);
  });
});

/**
 * The snapshot holds the verdicts and not the words, because the crawl and the
 * dashboard say them in two languages.
 */
describe('coverageDelta', () => {
  const before = tallyOf([{ production: cut(BANNER, GRID), new: cut(GRID) }]);
  const after = tallyOf([{ production: cut(GRID), new: cut(GRID) }]);

  it('keeps an unchanged entry, so a reader sees it was compared', () => {
    const delta = coverageDelta({ store: null, regions: before }, { store: null, regions: after });

    expect(delta.reason).toBeNull();
    expect(delta.changes.map((change) => [change.selector, change.verdict])).toEqual([
      [BANNER, 'stopped-matching'],
      [GRID, 'unchanged'],
    ]);
  });

  it('holds the reason and no verdict when the two runs cannot be compared', () => {
    const delta = coverageDelta(null, { store: null, regions: after });

    expect(delta.reason).toMatch(/No previous snapshot/);
    expect(delta.changes).toEqual([]);
  });
});
