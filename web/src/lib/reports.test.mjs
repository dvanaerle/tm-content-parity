import { describe, expect, it } from 'vitest';
import { EXCLUDED_REGIONS } from '../../../shared/excluded-regions.mjs';
import {
  notCheckedFor,
  regionsChangedInLog,
  regionsRemovedInStore,
  storesFromFilenames,
} from './reports.mjs';

/**
 * Which stores get a route and a switcher entry. The judgement is that a store is
 * in the log when it has a report, so the switcher never offers a dead link.
 */
describe('storesFromFilenames', () => {
  it('gives the stores that have a report', () => {
    const names = ['de__carports.json', 'nl__overkappingen.json', 'nl__carports.json'];
    expect(storesFromFilenames(names)).toEqual(['nl', 'de']);
  });

  it('gives the contract order and not the folder order', () => {
    // The folder is sorted by name, so `be` comes before `nl`. The switcher reads
    // the same on every store, so the order is the contract's.
    expect(storesFromFilenames(['uk__x.json', 'be__x.json', 'nl__x.json'])).toEqual([
      'nl',
      'be',
      'uk',
    ]);
  });

  it('gives no store for an empty folder', () => {
    // A fresh clone has no `data/reports/`, and it must still build.
    expect(storesFromFilenames([])).toEqual([]);
  });

  it('leaves out a name that claims no store', () => {
    expect(storesFromFilenames(['snapshot.json'])).toEqual([]);
  });
});

/**
 * Ticket 56. The rule is `not-checked.mjs` and its own tests hold it. What is
 * tested here is the **read**: the dashboard gets the drop list out of the
 * committed seed file.
 */
describe('notCheckedFor', () => {
  it('reads the committed drop list, and gives the British store its ten', async () => {
    const found = await notCheckedFor('uk', []);
    expect(found.filter((entry) => entry.kind === 'dropped-by-rule')).toHaveLength(10);
  });

  it('gives every entry a reason, because that is the whole of this ticket', async () => {
    for (const entry of await notCheckedFor('nl', [])) expect(entry.reason).toBeTruthy();
  });

  it('leaves out a page that has a report, so a crawled page is never listed', async () => {
    const [first] = await notCheckedFor('nl', []);
    const again = await notCheckedFor('nl', [{ page: first.page }]);
    expect(again.some((entry) => entry.page === first.page && entry.kind === 'not-crawled')).toBe(
      false,
    );
  });
});

/**
 * Ticket 63: an excluded region says why, and it says where. `removedOn` is what
 * makes the entry falsifiable. An entry removed on no page has stopped matching.
 */
describe('regionsRemovedInStore', () => {
  const GRID = EXCLUDED_REGIONS[0].selector;
  const page = (production, next) => ({
    sides: {
      production: { regionsExcluded: production },
      new: { regionsExcluded: next },
    },
  });

  it('counts the pages and the units, on each side apart', () => {
    const [entry] = regionsRemovedInStore([
      page([{ selector: GRID, units: 50 }], [{ selector: GRID, units: 21 }]),
      page([{ selector: GRID, units: 50 }], [{ selector: GRID, units: 21 }]),
      page([], []),
    ]);

    expect(entry.removedOn).toEqual({
      production: { pages: 2, units: 100 },
      new: { pages: 2, units: 42 },
    });
  });

  it('lists an entry that matched nothing, so a region that stopped matching is one line', () => {
    const [entry] = regionsRemovedInStore([page([], [])]);
    expect(entry.selector).toBe(GRID);
    expect(entry.removedOn.production.pages).toBe(0);
  });

  it('carries the reason and the kind through, because the list must say why', () => {
    for (const entry of regionsRemovedInStore([])) {
      expect(entry.reason).toBeTruthy();
      expect(['non-editorial', 'legacy-only']).toContain(entry.kind);
    }
  });

  it('gives every committed entry a count, so a new entry cannot read as absent', () => {
    expect(regionsRemovedInStore([]).map((entry) => entry.selector)).toEqual(
      EXCLUDED_REGIONS.map((entry) => entry.selector),
    );
  });
});

/**
 * Ticket 64. The dashboard reads the snapshot's verdicts, and it must survive a
 * snapshot that is older than the rule as well as no snapshot at all.
 */
describe('regionsChangedInLog', () => {
  it('reads the run scope, the reason and the verdicts', async () => {
    const read = await regionsChangedInLog();

    expect(read).toHaveProperty('store');
    expect(Array.isArray(read.changes)).toBe(true);
    expect(read.reason === null || typeof read.reason === 'string').toBe(true);
  });
});
