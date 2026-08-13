import { describe, expect, it } from 'vitest';

import { statusDisagreements, statusTargets, summariseStatus } from './page-status.mjs';

const row = (page, stores) => ({
  page,
  stores: {
    nl: null,
    be: null,
    be_fr: null,
    de: null,
    fr: null,
    uk: null,
    ...stores,
  },
});

const cell = (path, host = 'nl') => ({
  path,
  prodUrl: `https://www.tuinmaximaal.${host}/${path}`,
  newUrl: `https://m2staging${host}.intern.systems/${path}`,
  source: 'sitemap-daily',
});

describe('what the status pass visits', () => {
  it('visits both sides of every store page', () => {
    const rows = [row('garantie', { nl: cell('garantie') })];
    expect(statusTargets(rows)).toEqual([
      {
        store: 'nl',
        page: 'garantie',
        side: 'prod',
        url: 'https://www.tuinmaximaal.nl/garantie',
      },
      {
        store: 'nl',
        page: 'garantie',
        side: 'new',
        url: 'https://m2stagingnl.intern.systems/garantie',
      },
    ]);
  });
});

describe('what the status pass says about a store', () => {
  it('counts each side of the store apart', () => {
    const results = [
      { store: 'fr', page: 'a', side: 'prod', url: 'x', status: 200 },
      { store: 'fr', page: 'a', side: 'new', url: 'y', status: 404 },
      { store: 'fr', page: 'b', side: 'prod', url: 'x', status: 301, redirect: '/elders' },
      { store: 'fr', page: 'b', side: 'new', url: 'y', status: 200 },
    ];
    expect(summariseStatus(results).fr).toEqual({
      pairs: 2,
      prodOk: 1,
      prodRedirect: 1,
      prodMissing: 0,
      prodFailed: 0,
      newOk: 1,
      newRedirect: 0,
      newMissing: 1,
      newFailed: 0,
    });
  });
});

describe('the guard on a phantom column', () => {
  const results = (store, side, status) =>
    Array.from({ length: 3 }, (_, index) => ({
      store,
      page: `p${index}`,
      side,
      url: 'x',
      status,
    }));

  it('says nothing when both sides answered', () => {
    const counts = summariseStatus([...results('fr', 'prod', 200), ...results('fr', 'new', 200)]);
    expect(statusDisagreements(counts)).toEqual([]);
  });

  it('stops a side of a store where nothing answered at all', () => {
    // Every `prodStatus` in the seed list of ticket 04 was 0. A column of
    // failures is not a measurement, and it must not be written as one.
    const counts = summariseStatus([...results('fr', 'prod', 0), ...results('fr', 'new', 200)]);
    expect(statusDisagreements(counts)).toEqual([
      'fr: no url of production answered, over 3 pages',
    ]);
  });
});
