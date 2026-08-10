import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { dropReason, unknownDropRules } from '../shared/drop-rules.mjs';
import {
  EXPECTED_PAGES,
  HREFLANG_STORE,
  STORES,
  buildSeedList,
  countByStore,
  countDisagreements,
  isContentPage,
  isProductPage,
  pageKey,
  schemaDisagreements,
  storePageOf,
} from './seed-list.mjs';

const url = (path) => `https://www.tuinmaximaal.nl/${path}`;

const NO_FILE = { nl: null, be: null, be_fr: null, de: null, fr: null, uk: null };

const candidate = ({ loc, alternates = {}, daily = [] }) => ({
  loc,
  alternates,
  changefreq: { ...NO_FILE, ...Object.fromEntries(daily.map((file) => [file, 'daily'])) },
});

const SIX = {
  'nl-NL': url('terrasoverkapping'),
  'nl-BE': 'https://www.tuinmaximaal.be/terrasoverkapping',
  'fr-BE': 'https://www.tuinmaximaal.be/fr/toit-de-terrasse',
  'de-DE': 'https://www.tuinmaximaal.de/terrassenueberdachung',
  'fr-FR': 'https://www.tuinmaximaal.fr/toit-de-terrasse',
  'en-GB': 'https://www.tuinmaximaal.co.uk/veranda',
};

describe('the store of a production url', () => {
  it('reads the store from the host', () => {
    expect(storePageOf('https://www.tuinmaximaal.de/showroom-berlin')).toEqual({
      store: 'de',
      path: 'showroom-berlin',
    });
  });

  it('splits be_fr from be by the path inside the Belgian host', () => {
    expect(storePageOf('https://www.tuinmaximaal.be/pergola')).toEqual({
      store: 'be',
      path: 'pergola',
    });
    expect(storePageOf('https://www.tuinmaximaal.be/fr/pergola')).toEqual({
      store: 'be_fr',
      path: 'fr/pergola',
    });
  });

  it('keeps the /fr/ prefix in the path, because both sides serve it there', () => {
    expect(storePageOf('https://www.tuinmaximaal.be/fr/')).toEqual({
      store: 'be_fr',
      path: 'fr/',
    });
  });

  it('does not read a store out of a host that is not one of the five', () => {
    expect(storePageOf('https://www.example.com/veranda')).toBeNull();
    expect(storePageOf('not a url')).toBeNull();
  });
});

describe('the two clauses of the content page rule', () => {
  it('keeps a page that carries fewer than six alternates and is never daily', () => {
    // The French and German stores mark their store-local content `never`. This
    // is the clause the old generator did not have, and 96 French pages with it.
    expect(
      isContentPage(
        candidate({
          loc: 'https://www.tuinmaximaal.fr/heavy-duty-veranda',
          alternates: { 'fr-BE': 'https://www.tuinmaximaal.be/fr/heavy-duty-veranda' },
        })
      )
    ).toBe(true);
  });

  it('keeps a page that carries all six alternates and is daily somewhere', () => {
    // A category page carries all six alternates. `/terrasoverkapping` is the
    // most important page on the site, and the alternate clause alone drops it.
    expect(isContentPage(candidate({ loc: url('terrasoverkapping'), alternates: SIX, daily: ['nl'] })))
      .toBe(true);
  });

  it('reads `daily` from any of the six files, not from the store\'s own', () => {
    // For four stores the NL file marks more of that store's pages `daily` than
    // the store's own file does. "Read the store's own sitemap" loses 72 pages.
    expect(
      isContentPage(
        candidate({ loc: 'https://www.tuinmaximaal.be/veranda', alternates: SIX, daily: ['nl'] })
      )
    ).toBe(true);
  });

  it('drops a page that carries all six alternates and is daily nowhere', () => {
    expect(isContentPage(candidate({ loc: url('een-product'), alternates: SIX }))).toBe(false);
  });

  it('needs both clauses: neither one alone keeps both pages', () => {
    const lowAlternates = candidate({
      loc: 'https://www.tuinmaximaal.fr/heavy-duty-veranda',
      alternates: { 'fr-BE': 'x' },
    });
    const category = candidate({ loc: url('terrasoverkapping'), alternates: SIX, daily: ['nl'] });

    const dailyOnly = (entry) => Object.values(entry.changefreq).includes('daily');
    const alternatesOnly = (entry) => Object.keys(entry.alternates).length < 6;

    expect(dailyOnly(lowAlternates)).toBe(false);
    expect(alternatesOnly(category)).toBe(false);
    expect([lowAlternates, category].every(isContentPage)).toBe(true);
  });
});

describe('the product signature', () => {
  it('names a measurement in the last path segment', () => {
    expect(isProductPage('glazen-dakplaat-ongehard-2500mm-x-700mm')).toBe(true);
    expect(isProductPage('melkglas-dakplaat-ongehard-2500-mm-x-700-mm')).toBe(true);
    expect(isProductPage('fr/couper-une-plaque-de-toit-de-verre-2500mm-x-700mm-sur-mesure')).toBe(
      true
    );
    expect(isProductPage('sun-shading-screen-housing-set-of-2-5m-matt-white')).toBe(true);
    expect(isProductPage('50-metre-roll-of-black-rubber-for-beams')).toBe(true);
  });

  it('names a colour beside a finish, in either order', () => {
    expect(isProductPage('spuitbus-mat-wit')).toBe(true);
    expect(isProductPage('spruhdose-matt-weiss')).toBe(true);
    expect(isProductPage('fr/aerosol-blanc-mat')).toBe(true);
  });

  it('does not name a colour on its own', () => {
    // Production answers `cms-page-view` on this one. A content page may name a
    // colour; it does not name a colour and a finish.
    expect(isProductPage('black-veranda')).toBe(false);
  });

  it('does not name a number on its own', () => {
    expect(isProductPage('30000-terrasoverkappingen-en-schuifwanden-per-jaar')).toBe(false);
    expect(isProductPage('30000-verandas-and-sliding-walls-per-year')).toBe(false);
    expect(isProductPage('actievoorwaarden-10-korting-terrasoverkappingen')).toBe(false);
  });

  it('holds no store name, so it is the same rule in the six stores', () => {
    const source = readFileSync(new URL('./seed-list.mjs', import.meta.url), 'utf8');
    const signature = source.slice(
      source.indexOf('const MEASUREMENT'),
      source.indexOf('export function isProductPage') + 200
    );
    // The slice must hold the rule, or this test cannot fail.
    expect(signature).toContain('MEASUREMENT.test(segment)');
    for (const store of STORES) {
      expect(signature).not.toContain(`'${store}'`);
    }
  });

  it('beats both clauses of the rule', () => {
    expect(
      isContentPage(candidate({ loc: url('glazen-dakplaat-ongehard-2500mm-x-700mm'), daily: ['nl'] }))
    ).toBe(false);
  });
});

describe('the page key', () => {
  it('is the NL url key when production declares an nl-NL alternate', () => {
    expect(pageKey({ store: 'de', path: 'garantie-de', alternates: { 'nl-NL': url('garantie') } }))
      .toBe('garantie');
  });

  it('is the store and the path when there is no nl-NL alternate', () => {
    expect(pageKey({ store: 'fr', path: 'heavy-duty-veranda' })).toBe('(fr)heavy-duty-veranda');
  });

  it('never uses a colon, which NTFS reads as a stream separator', () => {
    expect(pageKey({ store: 'be_fr', path: 'fr/pergola' })).not.toContain(':');
  });

  it('is `(home)` for every store root, whatever the root declares', () => {
    // Four of the six roots would not find the home row on their own: `be/` and
    // `de/` declare no alternate, and `be/fr/` and `fr/` declare each other.
    expect(pageKey({ store: 'be', path: '' })).toBe('(home)');
    expect(pageKey({ store: 'de', path: '' })).toBe('(home)');
    expect(pageKey({ store: 'be_fr', path: 'fr/' })).toBe('(home)');
    expect(pageKey({ store: 'fr', path: '' })).toBe('(home)');
    expect(pageKey({ store: 'nl', path: '' })).toBe('(home)');
    expect(pageKey({ store: 'uk', path: '' })).toBe('(home)');
  });

  it('keeps the key of an anchored page byte for byte', () => {
    // Every stored finding, mute and review keys on this string, and the
    // override table is append-only, so a reformatted key can never be repaired.
    expect(pageKey({ store: 'nl', path: 'faq/montage' })).toBe('faq/montage');
  });
});

describe('the language groups', () => {
  it('names one store for each of the six hreflang codes', () => {
    expect(HREFLANG_STORE).toEqual({
      'nl-NL': 'nl',
      'nl-BE': 'be',
      'fr-BE': 'be_fr',
      'de-DE': 'de',
      'fr-FR': 'fr',
      'en-GB': 'uk',
    });
  });

  // The groups are not written down anywhere: they follow from which stores
  // production puts in one alternate block. These read them back out of the
  // committed extract, so a change in production breaks the claim and not the
  // prose beside it.
  const shapesOfContentPages = () => {
    const extract = JSON.parse(
      readFileSync(new URL('../data/sitemap-extract.json', import.meta.url), 'utf8')
    );
    const shapes = new Map();
    for (const entry of extract.entries.filter(isContentPage)) {
      const stores = Object.keys(entry.alternates)
        .map((lang) => HREFLANG_STORE[lang])
        .filter(Boolean)
        .sort()
        .join(',');
      shapes.set(stores, (shapes.get(stores) ?? 0) + 1);
    }
    return shapes;
  };

  it('carries the store-local content in `{be_fr, fr}` and `{be, nl}`', () => {
    const shapes = shapesOfContentPages();
    const largest = [...shapes]
      .filter(([stores]) => stores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    expect(largest).toEqual([
      ['be_fr,fr', 178],
      ['be,nl', 152],
    ]);
  });

  it('reaches most of the German and British content through no alternate at all', () => {
    // hreflang can never find these pages, which is why the `changefreq` clause
    // is not enough on its own and the alternate clause is not enough either.
    const extract = JSON.parse(
      readFileSync(new URL('../data/sitemap-extract.json', import.meta.url), 'utf8')
    );
    const none = {};
    for (const entry of extract.entries.filter(isContentPage)) {
      if (Object.keys(entry.alternates).length) continue;
      const store = storePageOf(entry.loc).store;
      none[store] = (none[store] ?? 0) + 1;
    }
    expect(none).toEqual({ nl: 6, be: 5, be_fr: 1, de: 87, fr: 3, uk: 85 });
  });

  it('holds sixteen shapes of alternate block, and not four groups', () => {
    // Ticket 50 says `{nl, be}`, `{be_fr, fr}`, `{de}` and `{uk}`, and that no
    // other pairing exists. Against the extract of 2026-08-10 that is wrong:
    // `de,nl,uk` holds `serre`, `wintergarten` and `pergola`, and `de,uk` holds
    // `showroom-berlin`. It changes no rule here, and axis B must know it.
    expect(shapesOfContentPages().size).toBe(16);
  });
});

describe('the seed list', () => {
  const entries = [
    candidate({ loc: url('terrasoverkapping'), alternates: SIX, daily: ['nl'] }),
    candidate({
      loc: 'https://www.tuinmaximaal.de/terrassenueberdachung',
      alternates: SIX,
      daily: ['nl'],
    }),
    candidate({ loc: 'https://www.tuinmaximaal.fr/heavy-duty-veranda' }),
    candidate({ loc: url('spuitbus-mat-wit'), daily: ['nl'] }),
    candidate({ loc: 'https://www.example.com/veranda', daily: ['nl'] }),
  ];

  it('puts the six store views of one page in one row', () => {
    const { rows } = buildSeedList({ entries, carriedRows: [] });
    const row = rows.find((r) => r.page === 'terrasoverkapping');
    expect(row.stores.nl.prodUrl).toBe(url('terrasoverkapping'));
    expect(row.stores.de.prodUrl).toBe('https://www.tuinmaximaal.de/terrassenueberdachung');
    expect(row.stores.uk).toBeNull();
  });

  it('gives a page with no nl-NL alternate a row of its own store', () => {
    const { rows } = buildSeedList({ entries, carriedRows: [] });
    const row = rows.find((r) => r.page === '(fr)heavy-duty-veranda');
    expect(row.stores.fr.path).toBe('heavy-duty-veranda');
    expect(STORES.filter((store) => row.stores[store])).toEqual(['fr']);
  });

  it('swaps the host for the new-site url and changes nothing else', () => {
    const { rows } = buildSeedList({ entries, carriedRows: [] });
    expect(rows.find((r) => r.page === 'terrasoverkapping').stores.de.newUrl).toBe(
      'https://valanticde.intern.systems/terrassenueberdachung'
    );
  });

  it('says of each cell which clause admitted it', () => {
    const { rows } = buildSeedList({ entries, carriedRows: [] });
    expect(rows.find((r) => r.page === 'terrasoverkapping').stores.nl.provenance).toBe('sitemap-daily');
    expect(rows.find((r) => r.page === '(fr)heavy-duty-veranda').stores.fr.provenance).toBe(
      'sitemap-low-alternates'
    );
  });

  it('names every url that leaves the list, with the rule that took it', () => {
    const { dropped } = buildSeedList({ entries, carriedRows: [] });
    expect(dropped).toEqual([
      {
        loc: url('spuitbus-mat-wit'),
        store: 'nl',
        path: 'spuitbus-mat-wit',
        rule: 'product-signature',
      },
      {
        loc: 'https://www.example.com/veranda',
        store: null,
        path: 'veranda',
        rule: 'foreign-host',
      },
    ]);
  });

  it('gives every drop a rule the vocabulary explains', () => {
    // Ticket 56: the dashboard shows the reason. A rule with no reason is the
    // silent exclusion this ticket ends, so the producer cannot invent one.
    const { dropped } = buildSeedList({ entries, carriedRows: [] });
    expect(unknownDropRules(dropped)).toEqual([]);
    for (const entry of dropped) expect(dropReason(entry)).toBeTruthy();
  });

  it('says which page a collision lost to, because one sentence cannot hold it', () => {
    // Two locs of one store that claim the same NL counterpart. The reason for
    // the loser names the winner, so the reader does not have to find it.
    // Both German locs declare the same Dutch counterpart, so both want the row
    // `overkapping`. The nl store cannot collide this way: an nl loc is keyed on
    // its own path and never on an alternate.
    const twice = [
      candidate({
        loc: 'https://www.tuinmaximaal.de/ueberdachung',
        alternates: { 'nl-NL': url('overkapping') },
      }),
      candidate({
        loc: 'https://www.tuinmaximaal.de/ueberdachung-alt',
        alternates: { 'nl-NL': url('overkapping') },
      }),
    ];
    const [drop] = buildSeedList({ entries: twice, carriedRows: [] }).dropped;

    expect(drop.loc).toBe('https://www.tuinmaximaal.de/ueberdachung-alt');
    expect(drop.rule).toBe('duplicate-in-store');
    expect(dropReason(drop)).toContain('https://www.tuinmaximaal.de/ueberdachung');
  });

  it('re-admits a page the rule drops, when the committed list holds a row for it', () => {
    // Ticket 56: a wrong exclusion is reversed by editing a list, never by
    // crawling again. `spuitbus-mat-wit` matches the product signature and the
    // rule drops its loc. A row put back into `data/10-store-seeds.json` by hand
    // is carried over by the next run, so the correction survives.
    const carriedRows = [
      {
        page: 'spuitbus-mat-wit',
        stores: {
          nl: {
            path: 'spuitbus-mat-wit',
            prodUrl: url('spuitbus-mat-wit'),
            newUrl: '',
            provenance: 'sitemap-daily',
          },
          be: null,
          be_fr: null,
          de: null,
          fr: null,
          uk: null,
        },
      },
    ];
    const { rows, dropped } = buildSeedList({ entries, carriedRows });

    expect(dropped.map((entry) => entry.loc)).toContain(url('spuitbus-mat-wit'));
    expect(rows.find((r) => r.page === 'spuitbus-mat-wit').stores.nl.provenance).toBe('carried-over');
  });

  it('carries a page that no sitemap declares, and marks it as carried', () => {
    const carriedRows = [
      {
        page: 'blog',
        stores: {
          nl: { path: 'blog', prodUrl: url('blog'), newUrl: '', provenance: 'new-site-crawl' },
          be: null,
          be_fr: null,
          de: null,
          fr: null,
          uk: null,
        },
      },
    ];
    const { rows, carried } = buildSeedList({ entries, carriedRows });
    expect(carried).toBe(1);
    expect(rows.find((r) => r.page === 'blog').stores.nl).toEqual({
      path: 'blog',
      prodUrl: url('blog'),
      newUrl: 'https://valanticnl.intern.systems/blog',
      provenance: 'carried-over',
    });
  });

  it('does not carry a page the sitemap now declares', () => {
    const carriedRows = [
      {
        page: 'terrasoverkapping',
        stores: {
          nl: {
            path: 'terrasoverkapping',
            prodUrl: url('terrasoverkapping'),
            newUrl: '',
            provenance: 'prod-sitemap',
          },
          be: null,
          be_fr: null,
          de: null,
          fr: null,
          uk: null,
        },
      },
    ];
    const { rows, carried } = buildSeedList({ entries, carriedRows });
    expect(carried).toBe(0);
    expect(rows.find((r) => r.page === 'terrasoverkapping').stores.nl.provenance).toBe('sitemap-daily');
  });

  it('sorts by codepoint, so the bytes do not depend on the locale', () => {
    const { rows } = buildSeedList({ entries, carriedRows: [] });
    expect(rows.map((r) => r.page)).toEqual([...rows.map((r) => r.page)].sort());
  });
});

describe('the count guard', () => {
  it('says nothing when each store holds the number that was measured', () => {
    const counts = Object.fromEntries(
      STORES.map((store) => [store, { pages: EXPECTED_PAGES[store] }])
    );
    expect(countDisagreements(counts)).toEqual([]);
  });

  it('stops a store that yields no page at all', () => {
    const counts = Object.fromEntries(
      STORES.map((store) => [store, { pages: EXPECTED_PAGES[store] }])
    );
    counts.fr = { pages: 0 };
    expect(countDisagreements(counts)).toEqual(['fr: no page at all, and 123 were measured']);
  });

  it('stops the short list this ticket exists to fix', () => {
    const counts = Object.fromEntries(
      STORES.map((store) => [store, { pages: EXPECTED_PAGES[store] }])
    );
    counts.fr = { pages: 28 };
    expect(countDisagreements(counts)).toEqual(['fr: 28 pages, and 123 were measured']);
  });
});

describe('the seed schema', () => {
  const good = () => ({
    generated: '2026-08-10',
    dropped: [
      {
        loc: url('spuitbus-mat-wit'),
        store: 'nl',
        path: 'spuitbus-mat-wit',
        rule: 'product-signature',
      },
    ],
    rows: [
      {
        page: 'garantie',
        stores: {
          nl: {
            path: 'garantie',
            prodUrl: url('garantie'),
            newUrl: 'https://valanticnl.intern.systems/garantie',
            provenance: 'sitemap-daily',
          },
          be: null,
          be_fr: null,
          de: null,
          fr: null,
          uk: null,
        },
      },
    ],
  });

  it('accepts a list that keeps it', () => {
    expect(schemaDisagreements(good())).toEqual([]);
  });

  it('refuses a row with no store at all', () => {
    const seeds = good();
    seeds.rows[0].stores.nl = null;
    expect(schemaDisagreements(seeds)).toContain('garantie: the row holds no store at all');
  });

  it('refuses a row that does not hold the six stores', () => {
    const seeds = good();
    delete seeds.rows[0].stores.uk;
    expect(schemaDisagreements(seeds)).toContain(
      'garantie: the row does not hold exactly the six stores'
    );
  });

  it('refuses a new-site url that is not the host swap of the path', () => {
    const seeds = good();
    seeds.rows[0].stores.nl.newUrl = 'https://valanticnl.intern.systems/iets-anders';
    expect(schemaDisagreements(seeds)).toContain(
      'garantie/nl: the new url is not the host swap of the path'
    );
  });

  it('refuses a production url that belongs to another store', () => {
    const seeds = good();
    seeds.rows[0].stores.nl.prodUrl = 'https://www.tuinmaximaal.de/garantie';
    expect(schemaDisagreements(seeds)).toContain(
      'garantie/nl: the production url is not of this store'
    );
  });

  it('refuses a colon in a page key', () => {
    const seeds = good();
    seeds.rows[0].page = 'fr:heavy-duty-veranda';
    expect(schemaDisagreements(seeds)).toContain(
      'fr:heavy-duty-veranda: a colon is not a safe page key'
    );
  });

  it('refuses a double underscore in a page key', () => {
    const seeds = good();
    seeds.rows[0].page = 'fr__heavy-duty-veranda';
    expect(schemaDisagreements(seeds)).toContain(
      'fr__heavy-duty-veranda: a double underscore is not a safe page key'
    );
  });

  it('refuses two rows with one key', () => {
    const seeds = good();
    seeds.rows.push(structuredClone(seeds.rows[0]));
    expect(schemaDisagreements(seeds)).toContain('garantie: two rows hold this key');
  });

  // Ticket 56. The drop list is the surface: it is what the dashboard shows for
  // the pages the seed rule never admitted, so it keeps a schema of its own.
  it('refuses a drop count where the drop list belongs', () => {
    const seeds = good();
    seeds.dropped = 105;
    expect(schemaDisagreements(seeds)).toContain(
      '`dropped` is not an array. It is the list of URLs that left the list.'
    );
  });

  it('refuses a drop whose rule no vocabulary explains', () => {
    const seeds = good();
    seeds.dropped[0].rule = 'looked-wrong';
    expect(schemaDisagreements(seeds)).toContain(
      `${url('spuitbus-mat-wit')}: no reason for rule \`looked-wrong\``
    );
  });

  it('refuses a drop that names no path', () => {
    const seeds = good();
    delete seeds.dropped[0].path;
    expect(schemaDisagreements(seeds)).toContain('a drop has no `path`');
  });

  it('refuses a drop whose store is not one of the six', () => {
    const seeds = good();
    seeds.dropped[0].store = 'nl-NL';
    expect(schemaDisagreements(seeds)).toContain(
      `${url('spuitbus-mat-wit')}: \`store\` is not one of the six, and not null`
    );
  });

  it('accepts a drop of no store, because a foreign host belongs to none', () => {
    const seeds = good();
    seeds.dropped[0] = {
      loc: 'https://www.example.com/veranda',
      store: null,
      path: 'veranda',
      rule: 'foreign-host',
    };
    expect(schemaDisagreements(seeds)).toEqual([]);
  });
});

describe('the committed seed list', () => {
  const seeds = JSON.parse(
    readFileSync(new URL('../data/10-store-seeds.json', import.meta.url), 'utf8')
  );

  it('keeps the schema', () => {
    expect(schemaDisagreements(seeds)).toEqual([]);
  });

  it('holds the page count that was measured, for each of the six stores', () => {
    const counts = countByStore(seeds.rows);
    expect(Object.fromEntries(STORES.map((store) => [store, counts[store].pages]))).toEqual(
      EXPECTED_PAGES
    );
  });

  it('keeps the NL store at exactly 181 pages', () => {
    // 133 are found by the rule and 48 are in no sitemap at all. If NL moves,
    // the rule is wrong.
    const counts = countByStore(seeds.rows);
    expect(counts.nl.pages).toBe(181);
    expect((counts.nl['sitemap-daily'] ?? 0) + (counts.nl['sitemap-low-alternates'] ?? 0)).toBe(133);
    expect(counts.nl['carried-over']).toBe(48);
  });

  it('carries the 49 pages that no sitemap declares, and no more', () => {
    const carried = seeds.rows.flatMap((row) =>
      STORES.filter((store) => row.stores[store]?.provenance === 'carried-over')
    );
    expect(carried.length).toBe(49);
  });

  it('holds no status, because the seed list is a page list', () => {
    for (const row of seeds.rows) {
      for (const store of STORES) {
        expect(row.stores[store] ?? {}).not.toHaveProperty('prodStatus');
        expect(row.stores[store] ?? {}).not.toHaveProperty('prodMaintenance');
      }
    }
  });
});
