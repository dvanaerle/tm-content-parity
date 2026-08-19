import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { EXCLUDED_PAGES } from '../../../shared/excluded-pages.mjs';
import { DROP_RULES } from '../../../shared/drop-rules.mjs';
import { STORES } from '../../../shared/stores.mjs';
import {
  excludedInStore,
  groupNotChecked,
  notCheckedInStore,
  storeTotals,
} from './not-checked.mjs';

const both = (path) => ({
  path,
  prodUrl: `https://www.tuinmaximaal.nl/${path}`,
  newUrl: `https://m2stagingnl.intern.systems/${path}`,
});

const row = (page, stores) => ({ page, stores });

const drop = (path, rule = 'product-signature', store = 'nl') => ({
  loc: `https://www.tuinmaximaal.nl/${path}`,
  store,
  path,
  rule,
});

/**
 * Which excluded page belongs to which store. One rule, and it must be the
 * crawler's rule: an excluded page the crawler never saw would be counted *niet
 * gecontroleerd* on a store that does not have it.
 */
describe('excludedInStore', () => {
  const cell = {
    prodUrl: 'https://prod/veranda-configurator',
    newUrl: 'https://new/veranda-configurator',
  };
  const rows = (stores) => [row('veranda-configurator', stores)];

  it('gives the excluded page to a store that has both sides', () => {
    expect(excludedInStore(rows({ nl: cell }), 'nl')).toHaveLength(1);
    expect(excludedInStore(rows({ nl: cell }), 'nl')[0].page).toBe('veranda-configurator');
  });

  it('gives nothing to a store the page is absent from', () => {
    // `veranda-configurator` is nl only. A German dashboard that reported it
    // would be counting another store's page.
    expect(excludedInStore(rows({ nl: cell, de: null }), 'de')).toEqual([]);
  });

  it('gives nothing to a store that has production and no counterpart', () => {
    // The crawler needs both sides before it calls a page excluded. This asked
    // for the production url alone until ticket 38's review, so the two could
    // disagree on the same page.
    expect(
      excludedInStore([row('veranda-configurator', { de: { prodUrl: 'https://p/x' } })], 'de'),
    ).toEqual([]);
  });

  it('gives nothing for a page that is not excluded', () => {
    expect(excludedInStore([row('overkappingen', { nl: cell })], 'nl')).toEqual([]);
  });
});

/**
 * The one list the dashboard shows. Three things leave a page out and the reader
 * gets three words, because an editor acts on a decision and on a failed fetch
 * differently.
 */
describe('notCheckedInStore', () => {
  const rows = [
    row('garantie', { nl: both('garantie') }),
    row('faq/offerte', { nl: both('faq/offerte') }),
    row('veranda-configurator', { nl: both('veranda-configurator') }),
    row('(de)showroom', { de: both('showroom') }),
  ];

  it('gives the store its dropped urls, with the rule and the reason', () => {
    const [entry] = notCheckedInStore({
      rows,
      dropped: [drop('spuitbus-mat-wit')],
      crawled: ['garantie', 'faq/offerte'],
      store: 'nl',
    }).filter((page) => page.kind === 'dropped-by-rule');

    expect(entry.page).toBe('spuitbus-mat-wit');
    expect(entry.rule).toBe('product-signature');
    expect(entry.reason).toBe(DROP_RULES['product-signature'].reason);
    expect(entry.url).toBe('https://www.tuinmaximaal.nl/spuitbus-mat-wit');
  });

  it('gives a store no other store’s drop', () => {
    // Ticket 38: a German dashboard that counted a Dutch drop would be reporting
    // a page the German store does not have.
    const found = notCheckedInStore({
      rows,
      dropped: [drop('spuitbus-mat-wit')],
      crawled: [],
      store: 'de',
    });
    expect(found.filter((entry) => entry.kind === 'dropped-by-rule')).toEqual([]);
  });

  it('gives no store a drop of a foreign host, because it belongs to none', () => {
    const foreign = {
      loc: 'https://www.example.com/veranda',
      store: null,
      path: 'veranda',
      rule: 'foreign-host',
    };
    for (const store of STORES) {
      const found = notCheckedInStore({ rows, dropped: [foreign], crawled: [], store });
      expect(found.some((entry) => entry.url === foreign.loc)).toBe(false);
    }
  });

  it('carries the committed reason of an excluded page through unchanged', () => {
    const [entry] = notCheckedInStore({
      rows,
      dropped: [],
      crawled: ['garantie', 'faq/offerte'],
      store: 'nl',
    }).filter((page) => page.kind === 'excluded-page');

    expect(entry.page).toBe('veranda-configurator');
    expect(entry.reason).toBe(EXCLUDED_PAGES[0].reason);
  });

  it('names a seed page that has no report, so a failed fetch is never absence', () => {
    // `faq/offerte` is in the seed list on both sides and the crawl wrote no
    // report for it. Before ticket 56 the page was in no list at all.
    const found = notCheckedInStore({ rows, dropped: [], crawled: ['garantie'], store: 'nl' });
    const missing = found.filter((entry) => entry.kind === 'not-crawled');

    expect(missing.map((entry) => entry.page)).toEqual(['faq/offerte']);
    expect(missing[0].reason).toContain('the fetch failed');
  });

  it('says nothing of a page that has a report', () => {
    const found = notCheckedInStore({
      rows,
      dropped: [],
      crawled: ['garantie', 'faq/offerte'],
      store: 'nl',
    });
    expect(found.some((entry) => entry.page === 'garantie')).toBe(false);
  });

  it('counts an excluded page once, and never also as not crawled', () => {
    // The crawler fetches nothing for an excluded page, so it has no report by
    // design. A store total that counted it twice would be too big.
    const found = notCheckedInStore({ rows, dropped: [], crawled: ['garantie'], store: 'nl' });
    expect(found.filter((entry) => entry.page === 'veranda-configurator')).toHaveLength(1);
  });

  it('gives the same list whatever order the input came in', () => {
    const input = {
      rows,
      dropped: [drop('spuitbus-mat-wit'), drop('spuitbus-mat-zwart')],
      crawled: [],
      store: 'nl',
    };
    const forwards = notCheckedInStore(input);
    const backwards = notCheckedInStore({ ...input, dropped: [...input.dropped].reverse() });
    expect(backwards).toEqual(forwards);
  });

  it('reports nothing for a store with nothing left out', () => {
    expect(notCheckedInStore({ rows: [], dropped: [], crawled: [], store: 'uk' })).toEqual([]);
  });

  it('reaches the dashboard of the store it belongs to, on the committed list', () => {
    const seeds = JSON.parse(
      readFileSync(new URL('../../../data/10-store-seeds.json', import.meta.url), 'utf8'),
    );
    const found = notCheckedInStore({
      rows: seeds.rows,
      dropped: seeds.dropped,
      crawled: [],
      store: 'uk',
    });
    expect(found.filter((entry) => entry.kind === 'dropped-by-rule')).toHaveLength(10);
  });
});

/**
 * Ticket 38 found an editor reading the comparable count as the size of the
 * store: on fr the gap was 28 to 25, and the reader who arrived through the
 * switcher took 25 for the whole store. Ticket 56 puts the pages the log does
 * not check inside that total.
 */
describe('storeTotals', () => {
  const page = (comparable) => ({ comparable });

  it('counts a page the log does not check inside the found total', () => {
    const totals = storeTotals({
      pages: [page(true), page(true), page(false)],
      notChecked: [{ page: 'spuitbus-mat-wit' }, { page: 'veranda-configurator' }],
    });

    expect(totals.found).toBe(5);
    expect(totals.crawled).toBe(3);
    expect(totals.comparable).toBe(2);
    expect(totals.oneSided).toBe(1);
    expect(totals.notChecked).toBe(2);
  });

  it('never reports a found total below the crawled one', () => {
    const totals = storeTotals({ pages: [page(true)], notChecked: [] });
    expect(totals.found).toBe(1);
    expect(totals.comparable).toBe(1);
  });

  it('counts an empty store as nothing rather than failing', () => {
    // A fresh clone has no reports and no seed file, and it must still build.
    expect(storeTotals({ pages: [], notChecked: [] })).toEqual({
      found: 0,
      crawled: 0,
      comparable: 0,
      oneSided: 0,
      notChecked: 0,
    });
  });
});

describe('groupNotChecked', () => {
  const entries = [
    { page: 'a', kind: 'dropped-by-rule', rule: 'product-signature', reason: 'One.', url: null },
    { page: 'b', kind: 'dropped-by-rule', rule: 'product-signature', reason: 'One.', url: null },
    { page: 'c', kind: 'not-crawled', rule: null, reason: 'Two.', url: null },
  ];

  it('says one reason once, with its pages under it', () => {
    expect(groupNotChecked(entries).map((group) => [group.reason, group.pages.length])).toEqual([
      ['One.', 2],
      ['Two.', 1],
    ]);
  });

  it('loses no page, because the aside is the whole list', () => {
    const total = groupNotChecked(entries).reduce((sum, group) => sum + group.pages.length, 0);
    expect(total).toBe(entries.length);
  });

  it('keeps two details apart, because the detail is part of the reason', () => {
    const two = [
      {
        page: 'a',
        kind: 'dropped-by-rule',
        rule: 'duplicate-in-store',
        reason: 'Lost to x.',
        url: null,
      },
      {
        page: 'b',
        kind: 'dropped-by-rule',
        rule: 'duplicate-in-store',
        reason: 'Lost to y.',
        url: null,
      },
    ];
    expect(groupNotChecked(two)).toHaveLength(2);
  });
});
