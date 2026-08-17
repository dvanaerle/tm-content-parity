import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { siblingPages } from './blocks.mjs';

/**
 * One seed row, as `crawl/seed-list.mjs` writes it: a page key and a cell per
 * store, `null` where the store does not have the page.
 *
 * @param {string} page
 * @param {Record<string, string>} paths The path of each store that has the page.
 */
const row = (page, paths) => ({
  page,
  stores: Object.fromEntries(
    ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'].map((store) => [
      store,
      paths[store] === undefined
        ? null
        : {
            path: paths[store],
            prodUrl: `https://prod.example/${paths[store]}`,
            newUrl: `https://new.example/${paths[store]}`,
            provenance: 'sitemap-daily',
          },
    ]),
  ),
});

describe('the sibling page', () => {
  // The first rule, and the one that goes first. Two stores on **one** seed row is
  // production's own claim that the two pages are the same page: the row exists
  // because production declared the hreflang alternate between them.
  it('matches by the alternate production declares', () => {
    const rows = [row('carport', { nl: 'carport', be: 'carport' })];

    expect(siblingPages({ rows, store: 'be' })).toEqual([
      { page: 'carport', sibling: { page: 'carport', rule: 'alternate' } },
    ]);
  });

  // The second rule, and it is what makes the French block as complete as the Dutch
  // one: most of `be_fr` and `fr` declare no Dutch counterpart, so each sits on its
  // own unanchored row and the alternate rule reaches neither.
  //
  // `be_fr` carries a leading `fr/` because it shares a host with `be`. That prefix
  // is a host artefact, so it comes off **for the comparison** — and nowhere else.
  it('matches by path where neither page declares an alternate, with `fr/` off', () => {
    const rows = [
      row('(be_fr)fr/carport', { be_fr: 'fr/carport' }),
      row('(fr)carport', { fr: 'carport' }),
    ];

    expect(siblingPages({ rows, store: 'be_fr' })).toEqual([
      { page: '(be_fr)fr/carport', sibling: { page: '(fr)carport', rule: 'path' } },
    ]);
    expect(siblingPages({ rows, store: 'fr' })).toEqual([
      { page: '(fr)carport', sibling: { page: '(be_fr)fr/carport', rule: 'path' } },
    ]);
  });

  // The order of the two rules, which is the part that can be got wrong silently.
  // `fr/carport` would match `carport` by path, and it declares `autre-chose`
  // instead — so it follows the alternate. Production's own claim about which of
  // its pages are the same page outranks a coincidence of spelling.
  it('follows the alternate where a page would also match by path', () => {
    const rows = [
      row('shared', { be_fr: 'fr/carport', fr: 'autre-chose' }),
      row('(fr)carport', { fr: 'carport' }),
    ];

    expect(siblingPages({ rows, store: 'be_fr' })).toEqual([
      { page: 'shared', sibling: { page: 'shared', rule: 'alternate' } },
    ]);
  });

  // Neither rule reached it, so it has no sibling — and it says so as a value rather
  // than being left out of the answer. A page missing from the list would read as a
  // page that agrees.
  it('reports no sibling where neither rule reaches one', () => {
    const rows = [row('blog', { nl: 'blog' })];

    expect(siblingPages({ rows, store: 'nl' })).toEqual([{ page: 'blog', sibling: null }]);
  });

  // A store in no block has no siblings anywhere, which is what stops the surface
  // appearing half-working on `de` and `uk`.
  it('answers with nothing for a store that is in no block', () => {
    const rows = [row('carport', { nl: 'carport', be: 'carport', de: 'carport' })];

    expect(siblingPages({ rows, store: 'de' })).toEqual([]);
    expect(siblingPages({ rows, store: 'uk' })).toEqual([]);
  });
});

/**
 * The measurement, against the seed list git holds. In the manner of
 * `crawl/seed-list.test.mjs`'s *the committed seed list*: the numbers were measured
 * on 2026-08-17 and they are written down, so the day the pairing changes is a day
 * somebody has to read this and say why.
 */
describe('the committed seed list', () => {
  const seeds = JSON.parse(
    readFileSync(new URL('../../../data/10-store-seeds.json', import.meta.url), 'utf8'),
  );

  /** How many of one store's pages matched, split by the rule that matched them. */
  const tally = (store) => {
    const matched = siblingPages({ rows: seeds.rows, store });
    return {
      pages: matched.length,
      alternate: matched.filter((one) => one.sibling?.rule === 'alternate').length,
      path: matched.filter((one) => one.sibling?.rule === 'path').length,
      absent: matched.filter((one) => !one.sibling).length,
    };
  };

  // The Dutch block already aligns on the seed row, so the path rule has nothing
  // left to do here. It is `nl` that is the bigger store, not `be` that is short:
  // 55 of `nl`'s pages have no `be` counterpart at all.
  it('pairs the Dutch block on the alternate alone', () => {
    expect(tally('be')).toEqual({ pages: 131, alternate: 126, path: 0, absent: 5 });
    expect(tally('nl')).toEqual({ pages: 181, alternate: 126, path: 0, absent: 55 });
  });

  // The criterion this test exists for: the French block is as complete as the Dutch
  // one. The alternate rule alone reaches 28 of 122, because most of `be_fr` and `fr`
  // declare no Dutch counterpart and so sit on their own unanchored rows. The path
  // rule recovers 92 more, and 120 of 122 is the answer.
  it('makes the French block as complete as the Dutch one, through the path rule', () => {
    expect(tally('be_fr')).toEqual({ pages: 122, alternate: 28, path: 92, absent: 2 });
    expect(tally('fr')).toEqual({ pages: 123, alternate: 28, path: 92, absent: 3 });
  });

  // A sibling is one page and the relation is symmetric, so no two pages of one store
  // may claim the same sibling. This is the failure a path rule invites — two rows
  // whose paths differ only by the prefix it strips.
  it('gives no two pages of a store the same sibling', () => {
    for (const store of ['nl', 'be', 'be_fr', 'fr']) {
      const claimed = siblingPages({ rows: seeds.rows, store })
        .filter((one) => one.sibling)
        .map((one) => one.sibling.page);
      expect(new Set(claimed).size).toBe(claimed.length);
    }
  });
});
