import { describe, expect, it } from 'vitest';
import { excludedInStore, storesFromFilenames } from './reports.mjs';

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
 * Which excluded page belongs to which store. One rule, and it must be the
 * crawler's rule: an excluded page the crawler never saw would be counted *niet
 * gecontroleerd* on a store that does not have it.
 */
describe('excludedInStore', () => {
  const both = { prodUrl: 'https://prod/veranda-configurator', newUrl: 'https://new/veranda-configurator' };
  const rows = (stores) => [{ page: 'veranda-configurator', stores }];

  it('gives the excluded page to a store that has both sides', () => {
    expect(excludedInStore(rows({ nl: both }), 'nl')).toHaveLength(1);
    expect(excludedInStore(rows({ nl: both }), 'nl')[0].page).toBe('veranda-configurator');
  });

  it('gives nothing to a store the page is absent from', () => {
    // `veranda-configurator` is nl only. A German dashboard that reported it
    // would be counting another store's page.
    expect(excludedInStore(rows({ nl: both, de: null }), 'de')).toEqual([]);
  });

  it('gives nothing to a store that has production and no counterpart', () => {
    // The crawler needs both sides before it calls a page excluded. This asked
    // for the production url alone until ticket 38's review, so the two could
    // disagree on the same page.
    expect(excludedInStore(rows({ de: { prodUrl: 'https://prod/x' } }), 'de')).toEqual([]);
  });

  it('gives nothing for a page that is not excluded', () => {
    expect(excludedInStore([{ page: 'overkappingen', stores: { nl: both } }], 'nl')).toEqual([]);
  });
});
