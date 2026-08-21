import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { blockReading, siblingPages } from './blocks.mjs';

/**
 * One seed row, as `crawl/seed-list.mjs` writes it: a page key and a cell per
 * store, `null` where the store does not have the page.
 *
 * @param {string} page
 * @param {Record<string, string>} paths The path of each store that has the page.
 */
const row = (page, paths, provenance = 'sitemap-daily') => ({
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
            provenance,
          },
    ]),
  ),
});

/**
 * A `unitsOf()` over the texts given: the normalised texts of one page's production
 * content units, per store, as the build reads them out of the reports. `undefined`
 * for a page no report covers, which is the honest answer and not an empty page.
 *
 * @param {Record<string, Record<string, string[]>>} byStore
 */
const units = (byStore) => (store, page) => byStore[store]?.[page] ?? null;

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

  /**
   * The page keys of one kind, on one store's reading, sorted. Sorted because the
   * ticket fixes no order for an absent row — only the shared rows are ranked — and a
   * test that pinned the seed file's own row order would be asserting something
   * nobody decided.
   */
  const ofKind = (store, kind) =>
    blockReading({ rows: seeds.rows, store, unitsOf: () => null })
      .rows.filter((one) => one.kind === kind)
      .map((one) => one.page)
      .sort();

  // The pages the ticket names, checked against the list git holds rather than
  // against a fixture that agrees with itself by construction.
  it('finds the pages the Dutch block does not share, on both sides', () => {
    expect(ofKind('be', 'sibling-absent')).toEqual([
      '(be)herroeping-deel-geleverd-webformulier',
      '(be)herroeping-deel-niet-geleverd-webformulier',
      '(be)herroeping-niet-geleverd-webformulier',
      '(be)herroeping-webformulier-form',
      '(be)pergola',
    ]);
    // `nl` has 55 that `be` has not, and these three are the ones the ticket names.
    const absentFromBe = ofKind('nl', 'sibling-absent');
    expect(absentFromBe).toHaveLength(55);
    expect(absentFromBe).toContain('blog');
    expect(absentFromBe).toContain('klantenservice');
    expect(absentFromBe).toContain('contactformulier');
    // And each store sees the other's five and fifty-five from its own side.
    expect(ofKind('be', 'only-in-sibling')).toEqual(absentFromBe.slice().sort());
    expect(ofKind('nl', 'only-in-sibling')).toHaveLength(5);
  });

  // The typo split, which is the reason a path rule needs a test on real data: the two
  // stores spell one page two ways, so neither rule pairs them and both sides report
  // an absence. That is the honest answer — the log must not guess that `eclairaige`
  // was meant to be `eclairage`.
  it('splits the French block on the two spellings of the lighting gallery', () => {
    // `afterpay` is unprefixed because production declares a Dutch alternate for it,
    // so it is an anchored key that `be_fr` shares with `nl` — and it still has no
    // `fr` counterpart. The prefix on a key says how the key was made, never which
    // store the page belongs to.
    expect(ofKind('be_fr', 'sibling-absent')).toEqual(['(be_fr)fr/galerie/eclairage', 'afterpay']);
    expect(ofKind('fr', 'sibling-absent')).toEqual([
      '(fr)conditions-generales',
      '(fr)formulaire-de-retrait',
      '(fr)galerie/eclairaige',
    ]);
  });

  // The census sentence, against the store it was measured on: 48 of `nl`'s 181 cells
  // are carried over, because no sitemap declares them.
  it('counts the 48 pages of `nl` that no sitemap declares', () => {
    expect(blockReading({ rows: seeds.rows, store: 'nl', unitsOf: () => null }).census).toEqual({ carriedOver: 48 });
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

describe('the block reading', () => {
  // The two kinds the dashboard has to tell apart, and the reason it must: a page
  // the sibling store does not have is work somebody builds, and a page both stores
  // have is work somebody edits.
  it('tells a page whose sibling is absent from a page both stores have', () => {
    const rows = [
      row('carport', { nl: 'carport', be: 'carport' }),
      row('pergola', { be: 'pergola' }),
    ];
    const unitsOf = units({ be: { carport: ['A carport'] }, nl: { carport: ['A carport'] } });

    expect(blockReading({ rows, store: 'be', unitsOf }).rows).toEqual([
      {
        page: 'carport',
        kind: 'identical',
        sibling: { page: 'carport', rule: 'alternate' },
        share: 1,
        units: 1,
        found: 1,
        flattening: 0,
      },
      {
        page: 'pergola',
        kind: 'sibling-absent',
        sibling: null,
        share: null,
        units: null,
        found: null,
        flattening: 0,
      },
    ]);
  });

  // Agreement is an **answer**, so it has a word of its own. This is the common case
  // and not an edge — 66 of the Dutch block's 125 measured pages and 47 of the French
  // block's 120 — and a page that agrees must never read as a comparison that failed
  // to run.
  it('says a page whose sibling is byte-identical is identical', () => {
    const rows = [row('carport', { nl: 'carport', be: 'carport' })];
    const unitsOf = units({
      be: { carport: ['A carport', 'Two of them'] },
      nl: { carport: ['A carport', 'Two of them'] },
    });

    expect(blockReading({ rows, store: 'be', unitsOf }).rows).toEqual([
      {
        page: 'carport',
        kind: 'identical',
        sibling: { page: 'carport', rule: 'alternate' },
        share: 1,
        units: 2,
        found: 2,
        flattening: 0,
      },
    ]);
  });

  // The share is one-directional, so a page wholly contained in a much longer sibling
  // scores 1 — and it is **not** two pages that agree. `be` says two things and `nl`
  // says those two and eight more, so *agrees word for word* would be a false sentence
  // about it. Identity is asked both ways round.
  it('does not call a page identical when its sibling says a great deal more', () => {
    const rows = [row('carport', { nl: 'carport', be: 'carport' })];
    const unitsOf = units({
      be: { carport: ['A carport', 'Two of them'] },
      nl: { carport: ['A carport', 'Two of them', 'And a long paragraph nobody translated'] },
    });

    const [one] = blockReading({ rows, store: 'be', unitsOf }).rows;
    expect(one.kind).toBe('diverged');
    // The share is still 1: every word of `be` is over there. That is the number, and
    // `diverged` is the reading of it — the two are different questions.
    expect(one.share).toBe(1);
    // And from `nl`'s own side it is a plain divergence, which is the mirror it should
    // always have been.
    expect(blockReading({ rows, store: 'nl', unitsOf }).rows[0].kind).toBe('diverged');
  });

  // The failure `unmeasured` exists to refuse, arriving by the other door: a page that
  // answered 200 and carries no content unit. Zero of zero is not agreement, and a
  // share of one here would have it claim it agrees word for word with a sibling it was
  // never compared to.
  it('never calls a page with no content units identical', () => {
    const rows = [row('carport', { nl: 'carport', be: 'carport' })];
    const unitsOf = units({ be: { carport: [] }, nl: { carport: ['A carport'] } });

    expect(blockReading({ rows, store: 'be', unitsOf }).rows).toEqual([
      {
        page: 'carport',
        kind: 'unmeasured',
        sibling: { page: 'carport', rule: 'alternate' },
        share: null,
        units: null,
        found: null,
        flattening: 0,
      },
    ]);
  });

  // The groupings are values, so the panel re-derives none of them. `identical` counts
  // the shared rows that agree and nothing else — an absent page is not a page that
  // agrees, and that is the arithmetic a component must never be trusted with.
  it('groups the rows and counts the agreements itself', () => {
    const rows = [
      row('agrees', { nl: 'agrees', be: 'agrees' }),
      row('differs', { nl: 'differs', be: 'differs' }),
      row('pergola', { be: 'pergola' }),
      row('blog', { nl: 'blog' }),
    ];
    const unitsOf = units({
      be: { agrees: ['One'], differs: ['One', 'Two'] },
      nl: { agrees: ['One'], differs: ['One', 'Other'] },
    });

    const reading = blockReading({ rows, store: 'be', unitsOf });
    expect(reading.shared.map((one) => one.page)).toEqual(['differs', 'agrees']);
    expect(reading.absentThere.map((one) => one.page)).toEqual(['pergola']);
    expect(reading.absentHere.map((one) => one.page)).toEqual(['blog']);
    expect(reading.identical).toBe(1);
  });

  // Worst-first, so a page somebody rewrote in one store sorts above a page whose
  // phone number differs. The ranking orders a list and nothing else — it is not a
  // score on a finding, because a block difference is not a finding.
  it('ranks the pages both stores have worst-first', () => {
    const rows = [
      row('agrees', { nl: 'agrees', be: 'agrees' }),
      row('rewritten', { nl: 'rewritten', be: 'rewritten' }),
      row('a-phone-number', { nl: 'a-phone-number', be: 'a-phone-number' }),
    ];
    const unitsOf = units({
      be: {
        agrees: ['One', 'Two'],
        rewritten: ['Wholly other words', 'And these too'],
        'a-phone-number': ['One', 'Two', 'Three', '+32 11 127 262'],
      },
      nl: {
        agrees: ['One', 'Two'],
        rewritten: ['One', 'Two'],
        'a-phone-number': ['One', 'Two', 'Three', '+31 41 239 960'],
      },
    });

    const reading = blockReading({ rows, store: 'be', unitsOf });
    expect(reading.rows.map((one) => [one.page, one.share])).toEqual([
      ['rewritten', 0],
      ['a-phone-number', 0.75],
      ['agrees', 1],
    ]);
  });

  // Two pages of equal share must not swap places between two builds, so the tie is
  // broken on the page key. The repo's repeat list breaks its own tie the same way.
  it('breaks a tie on the page key, so the order never wobbles', () => {
    const rows = [
      row('second', { nl: 'second', be: 'second' }),
      row('first', { nl: 'first', be: 'first' }),
    ];
    const unitsOf = units({
      be: { first: ['a', 'b'], second: ['a', 'b'] },
      nl: { first: ['a', 'x'], second: ['a', 'y'] },
    });

    expect(blockReading({ rows, store: 'be', unitsOf }).rows.map((one) => one.page)).toEqual([
      'first',
      'second',
    ]);
  });

  // A page the log has not compared on one side is **unmeasured**, and it sorts after
  // every page that was measured. It has no share, because a share of zero would
  // accuse it of diverging when what happened is that nobody looked.
  it('says a page it could not measure is unmeasured, and never calls it diverged', () => {
    const rows = [
      row('measured', { nl: 'measured', be: 'measured' }),
      row('no-report', { nl: 'no-report', be: 'no-report' }),
    ];
    const unitsOf = units({ be: { measured: ['a'], 'no-report': ['a'] }, nl: { measured: ['b'] } });

    expect(
      blockReading({ rows, store: 'be', unitsOf }).rows.map((one) => [
        one.page,
        one.kind,
        one.share,
      ]),
    ).toEqual([
      ['measured', 'diverged', 0],
      ['no-report', 'unmeasured', null],
    ]);
  });

  // The ticket's opening sentence: an editor of `be` sees which pages `nl` has that
  // they have not. It is the opposite direction of absence from the row above, and
  // the two must not read as one thing — `pergola` is a page `be` wrote and `nl` did
  // not, `blog` is a page `be` has yet to build.
  it('lists the pages the sibling has and this store has not', () => {
    const rows = [row('pergola', { be: 'pergola' }), row('blog', { nl: 'blog' })];

    const absent = (page, kind) => ({
      page,
      kind,
      sibling: null,
      share: null,
      units: null,
      found: null,
      flattening: 0,
    });

    expect(blockReading({ rows, store: 'be', unitsOf: () => null }).rows).toEqual([
      absent('pergola', 'sibling-absent'),
      absent('blog', 'only-in-sibling'),
    ]);
    // And the mirror of it from `nl`, because the reading belongs to no one store.
    expect(blockReading({ rows, store: 'nl', unitsOf: () => null }).rows).toEqual([
      absent('blog', 'sibling-absent'),
      absent('pergola', 'only-in-sibling'),
    ]);
  });

  // The reading states the side it compares, so that an editor never reads a
  // production divergence as a migration defect. The answer is **production**, and it
  // is a value here rather than a sentence in a component, because a sentence can
  // drift from the comparison it describes.
  it('says which side it compares, and the answer is production', () => {
    const reading = blockReading({
      rows: [row('carport', { be: 'carport' })],
      store: 'be',
      unitsOf: () => null,
    });

    expect(reading.side).toBe('production');
    expect(reading.store).toBe('be');
    expect(reading.sibling).toBe('nl');
    expect(reading.language).toBe('nl');
  });

  // The list is **not a census**, and it carries the evidence rather than only the
  // claim. A page no sitemap declares is absent from the list entirely, and the
  // carried-over cells are the pages that were already found that way — so the count
  // of them is what makes "this list is not everything" a falsifiable sentence
  // instead of a disclaimer.
  it('says it is not a census, and counts the pages no sitemap declares', () => {
    const rows = [
      row('carport', { nl: 'carport', be: 'carport' }),
      row('showrooms', { nl: 'showrooms' }, 'carried-over'),
      row('vloeren', { nl: 'vloeren' }, 'carried-over'),
    ];

    expect(blockReading({ rows, store: 'nl', unitsOf: () => null }).census).toEqual({
      carriedOver: 2,
    });
    // Counted in **this** store and not across the block: a carried-over cell of the
    // sibling is not a gap in the reader's own page list.
    expect(blockReading({ rows, store: 'be', unitsOf: () => null }).census).toEqual({
      carriedOver: 0,
    });
  });

  // A store in no block gets no reading at all, rather than an empty one. An empty
  // reading is a panel that draws itself and says nothing, which is what "half
  // working" looks like on `de` and `uk`.
  it('gives a store in no block no reading at all', () => {
    const rows = [row('carport', { de: 'carport', uk: 'carport' })];

    expect(blockReading({ rows, store: 'de', unitsOf: () => null })).toBe(null);
    expect(blockReading({ rows, store: 'uk', unitsOf: () => null })).toBe(null);
  });
});

/**
 * The pages the migration flattened, lifted to the top (ticket 07).
 *
 * 42 page pairs of the 246 carry a store difference production had and the new site has
 * not — the warranty scope, the delivery area. It is the reading this list is now for, so
 * it is **met and not hunted for**: the pairs sort ahead of the share, which ranks how far
 * two stores drifted apart and says nothing about what the migration lost.
 */
describe('the pages the migration flattened', () => {
  const rows = [
    row('drifted', { nl: 'drifted', be: 'drifted' }),
    row('garantie', { nl: 'garantie', be: 'garantie' }),
    row('levergebied', { nl: 'levergebied', be: 'levergebied' }),
  ];
  const unitsOf = units({
    be: { drifted: ['a', 'b', 'c', 'd'], garantie: ['a', 'b'], levergebied: ['a', 'b'] },
    nl: { drifted: ['a', 'x', 'y', 'z'], garantie: ['a', 'q'], levergebied: ['a', 'q'] },
  });
  const flatteningOn = (page) => ({ garantie: 2, levergebied: 5 })[page] ?? 0;

  it('lifts them above the pages that merely drifted apart', () => {
    // `drifted` has the worst share by a distance and it is not what the migration lost.
    const reading = blockReading({ rows, store: 'be', unitsOf, flatteningOn });

    expect(reading.rows.map((one) => one.page)).toEqual(['levergebied', 'garantie', 'drifted']);
  });

  it('counts the flattened units of the block, so the list can say what the order is for', () => {
    const reading = blockReading({ rows, store: 'be', unitsOf, flatteningOn });

    expect(reading.shared.map((one) => one.flattening)).toEqual([5, 2, 0]);
    expect(reading.flattening).toBe(7);
  });

  it('claims none of it where nothing was read for it', () => {
    // The default direction is *nothing was flattened*, and it is the safe one: the
    // opposite would have the list assert a lost store difference on every page in it.
    const reading = blockReading({ rows, store: 'be', unitsOf });

    expect(reading.flattening).toBe(0);
    expect(reading.rows.map((one) => one.page)).toEqual(['drifted', 'garantie', 'levergebied']);
  });
});
