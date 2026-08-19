import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { NOT_SHARED_PAGES, TAKEN_ON } from './not-shared-pages.mjs';
import { isSharedPage, sharedPageIndex } from './shared-pages.mjs';

/**
 * A corpus of seed rows, in the shape `data/10-store-seeds.json` holds: a row per page and
 * a cell per store. Only the fields the pairing and the resolution read are here.
 *
 * @param {Record<string, Record<string, string>>} pages Page key to store to path.
 */
const corpus = (pages) => ({
  rows: Object.entries(pages).map(([page, paths]) => ({
    page,
    stores: Object.fromEntries(Object.entries(paths).map(([store, path]) => [store, { path }])),
  })),
});

const DUTCH_BLOCK = {
  bedrijfsinformatie: { nl: 'bedrijfsinformatie', be: 'bedrijfsinformatie' },
  'algemene-voorwaarden': { nl: 'algemene-voorwaarden', be: 'algemene-voorwaarden' },
};

const entry = (key, record = 1, reason = 'Own record.') => ({ key, record, reason });

describe('what the shared-page file says about one store page', () => {
  it('reads an unlisted page with a sibling as shared', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      notShared: [],
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
    expect(isSharedPage(index, { store: 'nl', page: 'bedrijfsinformatie' })).toBe(true);
  });

  // One entry unshares **both** sides. Sharing is a property of the pair: if `be`'s
  // record does not serve `nl`, then `nl`'s does not serve `be` either. It is why the
  // grid reading only had to be compiled from the Belgian store.
  it('reads a listed page as not shared on either store of its block', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      notShared: [entry('be/algemene-voorwaarden', 412, 'Belgian legal text.')],
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'be', page: 'algemene-voorwaarden' })).toBe(false);
    expect(isSharedPage(index, { store: 'nl', page: 'algemene-voorwaarden' })).toBe(false);
    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });
});

describe('the date the file was taken', () => {
  const listed = { notShared: [], takenOn: '2026-08-19' };

  const seen = (store, page, firstSeen) => ({ store, page, firstSeen });

  it('reads a page the grid cannot have seen as not shared', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      ...listed,
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
      ...listed,
      runLog: [seen('be', 'bedrijfsinformatie', '2026-08-19T23:59:00.000Z-abc')],
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });

  // The earliest sighting and not the latest: a finding that arrived last week on a page
  // the log has held since March must not withdraw the page's own age.
  it('asks the earliest sighting of the page, over every row that names it', () => {
    const index = sharedPageIndex({
      ...corpus(DUTCH_BLOCK),
      ...listed,
      runLog: [
        seen('be', 'bedrijfsinformatie', '2026-08-30T05:00:00.000Z-abc'),
        seen('be', 'bedrijfsinformatie', '2026-03-02T05:00:00.000Z-def'),
      ],
    });

    expect(isSharedPage(index, { store: 'be', page: 'bedrijfsinformatie' })).toBe(true);
  });

  it('shares nothing at all while the file carries no date', () => {
    const index = sharedPageIndex({ ...corpus(DUTCH_BLOCK), notShared: [], takenOn: null });

    expect(index.shared.size).toBe(0);
  });
});

describe('the pages sharing can never reach', () => {
  it('reads a store in no language block as not shared', () => {
    const index = sharedPageIndex({
      ...corpus({ terrassenueberdachung: { de: 'terrassenueberdachung' } }),
      notShared: [],
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'de', page: 'terrassenueberdachung' })).toBe(false);
  });

  // No partner, so nothing to share with, whatever the file omits.
  it('reads a page with no sibling page as not shared', () => {
    const index = sharedPageIndex({
      ...corpus({ 'be-only': { be: 'be-only' }, ...DUTCH_BLOCK }),
      notShared: [],
      takenOn: '2026-08-19',
    });

    expect(isSharedPage(index, { store: 'be', page: 'be-only' })).toBe(false);
  });
});

describe('resolving a key onto a store page', () => {
  const FRENCH_BLOCK = {
    'conditions-generales': { be_fr: 'fr/conditions-generales', fr: 'conditions-generales' },
    livraison: { be_fr: 'fr/livraison', fr: 'livraison' },
  };

  // The `fr/` prefix is a host artefact, so both spellings of the key name one page. It is
  // the **only** normalisation there is.
  it.each(['be_fr/conditions-generales', 'be_fr/fr/conditions-generales'])(
    'takes the fr/ prefix off a be_fr key, spelled %s',
    (key) => {
      const index = sharedPageIndex({
        ...corpus(FRENCH_BLOCK),
        notShared: [entry(key, 509)],
        takenOn: '2026-08-19',
      });

      expect(index.unresolvable).toEqual([]);
      expect(isSharedPage(index, { store: 'be_fr', page: 'conditions-generales' })).toBe(false);
      expect(isSharedPage(index, { store: 'be_fr', page: 'livraison' })).toBe(true);
    },
  );

  // A suffix is never stripped. Both unresolvable keys in the first grid reading carried
  // `-n-v-t` and named records to be disabled; resolving one onto the live page would mark
  // a genuinely shared page as unshared and withdraw a permission in silence.
  it('names every key that resolves to no store page, and never the first alone', () => {
    const index = sharedPageIndex({
      ...corpus(FRENCH_BLOCK),
      notShared: [entry('fr/distributeurs-n-v-t'), entry('fr/formulaire-retrait')],
      takenOn: '2026-08-19',
    });

    expect(index.unresolvable).toEqual([
      'fr/distributeurs-n-v-t: no store page in the corpus',
      'fr/formulaire-retrait: no store page in the corpus',
    ]);
  });

  it('raises when asked a question while a key resolves to nothing', () => {
    const index = sharedPageIndex({
      ...corpus(FRENCH_BLOCK),
      notShared: [entry('fr/formulaire-retrait')],
      takenOn: '2026-08-19',
    });

    expect(() => isSharedPage(index, { store: 'fr', page: 'livraison' })).toThrow(
      /formulaire-retrait/,
    );
  });
});

/**
 * The committed file, against the corpus on disk. This is the half that **fails the
 * build**: `npm test` gates it, and the check needs data on disk, in the manner of
 * `shared/drop-rules.test.mjs`'s committed measurement.
 */
describe('the committed shared-page file', () => {
  const seeds = JSON.parse(
    readFileSync(new URL('../../../data/10-store-seeds.json', import.meta.url), 'utf8'),
  );

  it('resolves every key onto a store page in the corpus', () => {
    expect(sharedPageIndex({ rows: seeds.rows }).unresolvable).toEqual([]);
  });

  it('gives every entry a record id and a reason a reader can use', () => {
    for (const entry of NOT_SHARED_PAGES) {
      expect(Number.isInteger(entry.record)).toBe(true);
      expect(entry.reason.length).toBeGreaterThan(10);
    }
  });

  it('names each store page once', () => {
    const keys = NOT_SHARED_PAGES.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // The date and the entries arrive together, and this is why: a **dated** file with no
  // entries is the most permissive sentence in the feature — every page of both blocks is
  // shared — and an **undated** file with entries is a fact nobody can date. Neither is a
  // state a hand edit should be able to reach.
  it('carries a date exactly when it carries entries', () => {
    if (TAKEN_ON !== null) expect(TAKEN_ON).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TAKEN_ON === null).toBe(NOT_SHARED_PAGES.length === 0);
  });
});
