import { describe, expect, it } from 'vitest';

import { recordLayoutFrom } from '../../../overrides/record-layout.mjs';
import { daysSince, recordLayoutScreen } from './record-layout-screen.mjs';

const CORPUS = [
  { store: 'nl', page: 'bedrijfsinformatie', sibling: 'bedrijfsinformatie' },
  { store: 'be', page: 'bedrijfsinformatie', sibling: 'bedrijfsinformatie' },
  { store: 'be', page: 'algemene-voorwaarden', sibling: 'algemene-voorwaarden' },
  { store: 'be', page: 'be-only', sibling: null },
  { store: 'de', page: 'terrassenueberdachung', sibling: null },
];

const entry = (store, page, record = 412) => ({
  store,
  page,
  record,
  reason: 'Own record.',
  editor: 'd.aerle',
  writtenAt: '2026-08-19T09:05:00Z',
});

const NOW = new Date('2026-08-24T10:00:00Z');

const screen = (layout, now = NOW) => recordLayoutScreen({ layout, storePages: CORPUS, now });

describe('the age of the reading', () => {
  it('says how many whole days ago the grid was read', () => {
    expect(daysSince('2026-08-19', NOW)).toBe(5);
    expect(daysSince('2026-08-24', NOW)).toBe(0);
  });

  it('says nothing where there is no day to read', () => {
    expect(daysSince(null, NOW)).toBe(null);
    expect(daysSince('19 Aug 2026', NOW)).toBe(null);
  });
});

describe('what the screen leads with', () => {
  // An empty table must never read as *everything is shared*, and this is where the screen
  // learns to say so.
  it('grants nothing until the grid has been read', () => {
    const view = screen({ notShared: [], takenOn: null, readings: [] });

    expect(view.grants).toBe(false);
    expect(view.reading).toBe(null);
  });

  it('names the newest reading, its age and who took it', () => {
    const view = screen({
      notShared: [],
      takenOn: '2026-08-19',
      readings: [
        { takenOn: '2026-08-19', editor: 'd.aerle', writtenAt: '2026-08-19T09:00:00Z' },
        { takenOn: '2026-07-01', editor: 'someone', writtenAt: '2026-07-01T09:00:00Z' },
      ],
    });

    expect(view.grants).toBe(true);
    expect(view.reading).toEqual({ takenOn: '2026-08-19', days: 5, editor: 'd.aerle' });
  });
});

describe('the entries the screen lists', () => {
  const layout = {
    notShared: [entry('be', 'algemene-voorwaarden'), entry('nl', 'bedrijfsinformatie', 543)],
    takenOn: '2026-08-19',
    readings: [{ takenOn: '2026-08-19', editor: 'd.aerle', writtenAt: '2026-08-19T09:00:00Z' }],
  };

  // Store order is `STORES`' order — the order every table in the log uses — and never
  // alphabetical, which would put `be` before `nl`.
  it('puts them in store order and then page order', () => {
    expect(screen(layout).entries.map((one) => `${one.store}/${one.page}`)).toEqual([
      'nl/bedrijfsinformatie',
      'be/algemene-voorwaarden',
    ]);
  });

  it('carries the sibling page each entry is separate from', () => {
    expect(screen(layout).entries[0]?.sibling).toBe('bedrijfsinformatie');
  });
});

describe('an entry the corpus no longer holds', () => {
  const layout = {
    notShared: [entry('be', 'algemene-voorwaarden'), entry('fr', 'distributeurs', 611)],
    takenOn: '2026-08-19',
    readings: [{ takenOn: '2026-08-19', editor: 'd.aerle', writtenAt: '2026-08-19T09:00:00Z' }],
  };

  it('is a stray and not an entry', () => {
    const view = screen(layout);

    expect(view.strays.map((one) => one.page)).toEqual(['distributeurs']);
    expect(view.entries.map((one) => one.page)).toEqual(['algemene-voorwaarden']);
  });
});

describe('what the picker offers', () => {
  const dated = {
    notShared: [entry('be', 'algemene-voorwaarden')],
    takenOn: '2026-08-19',
    readings: [{ takenOn: '2026-08-19', editor: 'd.aerle', writtenAt: '2026-08-19T09:00:00Z' }],
  };

  // Nothing is typed, so the typo the committed file needed a build guard to catch cannot be
  // made — and a page already named is not offered twice.
  it('offers the store pages that have a sibling and are not named yet', () => {
    expect(screen(dated).addable.map((one) => `${one.store}/${one.page}`)).toEqual([
      'nl/bedrijfsinformatie',
      'be/bedrijfsinformatie',
    ]);
  });

  // A page with no sibling can never be shared, so it can never be unshared either. `de` and
  // `uk` are alone in their languages and never appear here at all.
  it('offers no page that has no sibling', () => {
    const offered = screen(dated).addable.map((one) => one.page);

    expect(offered).not.toContain('be-only');
    expect(offered).not.toContain('terrassenueberdachung');
  });
});

/**
 * The screen against the derivation, so that the events a press writes are the rows a reader
 * then sees. It is the same fit `shared-pages.test.mjs` asserts for the rule.
 */
describe('the derivation the screen reads', () => {
  const event = (id, at, extra) => ({
    id,
    createdAt: at,
    editor: 'd.aerle',
    kind: 'separate',
    store: 'be',
    page: 'algemene-voorwaarden',
    recordId: 412,
    reason: 'Own record.',
    takenOn: null,
    ...extra,
  });

  it('shows an entry a press added, and drops it when a press withdrew it', () => {
    const reading = event('r', '2026-08-19T09:00:00Z', {
      kind: 'reading',
      store: null,
      page: null,
      recordId: null,
      reason: null,
      takenOn: '2026-08-19',
    });

    const added = screen(recordLayoutFrom([reading, event('a', '2026-08-19T09:05:00Z')]));
    expect(added.entries.map((one) => one.page)).toEqual(['algemene-voorwaarden']);
    expect(added.addable.map((one) => one.page)).not.toContain('algemene-voorwaarden');

    const withdrawn = screen(
      recordLayoutFrom([
        reading,
        event('a', '2026-08-19T09:05:00Z'),
        event('b', '2026-08-20T09:00:00Z', {
          kind: 'shared',
          recordId: null,
          reason: 'The merge landed.',
        }),
      ]),
    );
    expect(withdrawn.entries).toEqual([]);
    expect(withdrawn.addable.map((one) => one.page)).toContain('algemene-voorwaarden');
  });
});
