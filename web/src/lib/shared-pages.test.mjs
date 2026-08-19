import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { recordLayoutFrom } from '../../../overrides/record-layout.mjs';
import { isSharedPage, sharedPageIndex } from './shared-pages.mjs';

/**
 * A corpus of seed rows, in the shape `data/10-store-seeds.json` holds: a row per page and a
 * cell per store. Only the fields the pairing and the corpus check read are here.
 *
 * It carries an empty run log and no entries, so that a test which says nothing about ages or
 * about the layout does not have to spell them. `sharedPageIndex()` requires both, and the
 * tests that are about them pass their own after this spread.
 *
 * @param {Record<string, Record<string, string>>} pages Page key to store to path.
 */
const corpus = (pages) => ({
  runLog: [],
  notShared: [],
  rows: Object.entries(pages).map(([page, paths]) => ({
    page,
    stores: Object.fromEntries(Object.entries(paths).map(([store, path]) => [store, { path }])),
  })),
});

const DUTCH_BLOCK = {
  bedrijfsinformatie: { nl: 'bedrijfsinformatie', be: 'bedrijfsinformatie' },
  'algemene-voorwaarden': { nl: 'algemene-voorwaarden', be: 'algemene-voorwaarden' },
};

/** An entry as `recordLayoutFrom()` produces it. */
const entry = (store, page, record = 412, reason = 'Belgian legal text.') => ({
  store,
  page,
  record,
  reason,
  editor: 'd.aerle',
  writtenAt: '2026-08-19T09:05:00Z',
});

describe('what the record layout says about one store page', () => {
  it('reads an unlisted page with a sibling as shared', () => {
    const index = sharedPageIndex({ ...corpus(DUTCH_BLOCK), takenOn: '2026-08-19' });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
    expect(isSharedPage(index, { store: 'nl', page: 'bedrijfsinformatie' })).toBe(true);
  });

  // One entry unshares **both** sides. Sharing is a property of the pair: if `be`'s record
  // does not serve `nl`, then `nl`'s does not serve `be` either. It is why the grid only has
  // to be read from one store of the block.
  it('reads a listed page as not shared on either store of its block', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      notShared: [entry('be', 'algemene-voorwaarden')],
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'be', page: 'algemene-voorwaarden' })).toBe(false);
    expect(isSharedPage(index, { store: 'nl', page: 'algemene-voorwaarden' })).toBe(false);
    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });
});

describe('the day the grid was read', () => {
  const seen = (store, page, firstSeen) => ({ store, page, firstSeen });

  it('reads a page the reading cannot have seen as not shared', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      takenOn: '2026-08-19',
      runLog: [
        seen('be', 'bedrijfsinformatie', '2026-03-02T05:00:00.000Z-abc'),
        seen('be', 'algemene-voorwaarden', '2026-08-25T05:00:00.000Z-abc'),
      ],
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
    expect(isSharedPage(index, { store: 'be', page: 'algemene-voorwaarden' })).toBe(false);
  });

  // The page was first seen **on** the day the grid was read, so the reading saw it.
  it('reads a page first seen on the day itself as shared', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      takenOn: '2026-08-19',
      runLog: [seen('be', 'bedrijfsinformatie', '2026-08-19T23:59:00.000Z-abc')],
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });

  // The earliest sighting and not the latest: a finding that arrived last week on a page the
  // log has held since March must not withdraw the page's own age.
  it('asks the earliest sighting of the page, over every row that names it', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      takenOn: '2026-08-19',
      runLog: [
        seen('be', 'bedrijfsinformatie', '2026-08-30T05:00:00.000Z-abc'),
        seen('be', 'bedrijfsinformatie', '2026-03-02T05:00:00.000Z-def'),
      ],
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });

  // An empty table must never mean *everything is shared*, and this is the half of that rule
  // the rule itself holds: no reading, no sharing.
  it('shares nothing at all until the grid has been read', () => {
    const index = sharedPageIndex({ ...corpus(DUTCH_BLOCK), takenOn: null });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(false);
    expect(isSharedPage(index, { store: 'nl', page: 'bedrijfsinformatie' })).toBe(false);
  });
});

describe('the pages sharing can never reach', () => {
  it('reads a store in no language block as not shared', () => {
    const index = sharedPageIndex({
      ...corpus({ terrassenueberdachung: { de: 'terrassenueberdachung' } }),
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'de', page: 'terrassenueberdachung' })).toBe(false);
  });

  // No partner, so nothing to share with, whatever the layout omits.
  it('reads a page with no sibling page as not shared', () => {
    const index = sharedPageIndex({
      ...corpus({ 'be-only': { be: 'be-only' }, ...DUTCH_BLOCK }),
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'be', page: 'be-only' })).toBe(false);
  });
});

describe('an entry the corpus no longer holds', () => {
  const input = {
    ...corpus(DUTCH_BLOCK),
    notShared: [entry('be', 'algemene-voorwaarden'), entry('fr', 'distributeurs', 611)],
    takenOn: '2026-08-19',
  };

  // Housekeeping and not a failure: the screen names it. Under the committed file this was a
  // typo and failed the build; entries are picked out of the corpus now, so it is a page that
  // has since left it — and the record is one to disable in Magento.
  it('is named as a stray, and every one of them', () => {
    expect(sharedPageIndex(input).strays).toEqual([entry('fr', 'distributeurs', 611)]);
  });

  it('does not stop the rule answering the pages it does hold', () => {
    const index = sharedPageIndex(input);

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
    expect(isSharedPage(index, { store: 'be', page: 'algemene-voorwaarden' })).toBe(false);
  });
});

// The two inputs with no safe default. `npm run typecheck` reads no `.mjs` here, so the
// requirement is a check and not a type, and this is what says it still holds.
describe('the bounds that may not be left out', () => {
  it.each([
    ['the run log', { rows: [], notShared: [], takenOn: '2026-08-19' }],
    ['the record layout', { rows: [], runLog: [], takenOn: '2026-08-19' }],
  ])('refuses to answer at all without %s', (_what, input) => {
    expect(() => sharedPageIndex(input)).toThrow(/record layout and the run log/);
  });
});

/**
 * The rule against the corpus on disk, fed by the derivation the table will feed it. It is
 * what says the two halves fit: `recordLayoutFrom()`'s output is `sharedPageIndex()`'s input,
 * and nothing in between translates.
 */
describe('the derivation against the real corpus', () => {
  const seeds = JSON.parse(
    readFileSync(new URL('../../../data/10-store-seeds.json', import.meta.url), 'utf8'),
  );

  const eventsFor = (entries) => [
    {
      id: 'r1',
      createdAt: '2026-08-19T09:00:00Z',
      editor: 'd.aerle',
      kind: 'reading',
      store: null,
      page: null,
      recordId: null,
      reason: null,
      takenOn: '2026-08-19',
    },
    ...entries.map(([store, page, record], index) => ({
      id: `e${index}`,
      createdAt: `2026-08-19T09:0${index + 1}:00Z`,
      editor: 'd.aerle',
      kind: 'separate',
      store,
      page,
      recordId: record,
      reason: 'Own record.',
      takenOn: null,
    })),
  ];

  const indexFor = (entries) =>
    sharedPageIndex({ rows: seeds.rows, runLog: [], ...recordLayoutFrom(eventsFor(entries)) });

  // The complement's upper bound, and the number every entry cuts into. It is a **slice** of
  // the corpus of 2026-08-19 and it moves when the seed list does.
  it('shares 492 store pages under a reading with no entries', () => {
    const index = indexFor([]);

    expect(index.shared.size).toBe(492);
    expect(index.strays).toEqual([]);
  });

  it('withdraws both sides of a pair the layout names', () => {
    const index = indexFor([['be', 'bedrijfsinformatie', 543]]);

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(false);
    expect(isSharedPage(index, { store: 'nl', page: 'bedrijfsinformatie' })).toBe(false);
    expect(index.shared.size).toBe(490);
  });

  it('names an entry the corpus does not hold and goes on answering', () => {
    const index = indexFor([['be', 'a-page-magento-alone-knows', 999]]);

    expect(index.strays.map((one) => one.page)).toEqual(['a-page-magento-alone-knows']);
    expect(index.shared.size).toBe(492);
  });
});
