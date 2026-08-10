import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  SITEMAP_FILES,
  buildManifest,
  manifestDisagreements,
  parseSitemap,
  reduceSitemaps,
  serialiseExtract,
} from './sitemap-extract.mjs';

const ALL_SIX = {
  'nl-NL': 'https://www.tuinmaximaal.nl/p',
  'nl-BE': 'https://www.tuinmaximaal.be/p',
  'fr-BE': 'https://www.tuinmaximaal.be/fr/p',
  'de-DE': 'https://www.tuinmaximaal.de/p',
  'fr-FR': 'https://www.tuinmaximaal.fr/p',
  'en-GB': 'https://www.tuinmaximaal.co.uk/p',
};

const url = (loc, changefreq, alternates = {}) =>
  [
    '<url>',
    `<loc>${loc}</loc>`,
    `<changefreq>${changefreq}</changefreq>`,
    '<priority>0.5</priority>',
    ...Object.entries(alternates).map(
      ([lang, href]) => `<xhtml:link hreflang="${lang}" rel="alternate" href="${href}"/>`
    ),
    '</url>',
  ].join('\n');

const sitemap = (...blocks) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...blocks,
    '</urlset>',
  ].join('\n');

/** The same file in all six slots, so a test can vary one slot only. */
const sixFiles = (xml) => Object.fromEntries(SITEMAP_FILES.map((file) => [file, xml]));

describe('parseSitemap', () => {
  it('reads the loc, the changefreq and the alternates of each block', () => {
    const entries = parseSitemap(
      sitemap(url('https://www.tuinmaximaal.nl/p', 'never', ALL_SIX), url('https://x/q', 'daily'))
    );
    expect(entries).toEqual([
      { loc: 'https://www.tuinmaximaal.nl/p', changefreq: 'never', alternates: ALL_SIX },
      { loc: 'https://x/q', changefreq: 'daily', alternates: {} },
    ]);
  });
});

describe('reduceSitemaps', () => {
  it('gives one entry for a loc, with the changefreq of each of the six files', () => {
    // The one thing that differs between the files. `nl`, `be` and `uk` mark
    // store-local content `daily`; `de`, `fr` and `be_fr` mark the same kind of
    // content `never`. Ticket 53 reads that difference, so it must survive.
    const files = sixFiles(sitemap(url('https://x/p', 'never')));
    files.nl = sitemap(url('https://x/p', 'daily'));

    expect(reduceSitemaps(files).entries).toEqual([
      {
        loc: 'https://x/p',
        changefreq: { nl: 'daily', be: 'never', be_fr: 'never', de: 'never', fr: 'never', uk: 'never' },
        alternates: {},
      },
    ]);
  });

  it('drops a loc that carries all six alternates and is never daily', () => {
    // The product signature of ticket 50: exactly 4,444 locs of each store carry
    // all six alternates, and those are the product pages. Dropping them is what
    // takes 181 MB down to a few hundred kilobytes.
    expect(reduceSitemaps(sixFiles(sitemap(url('https://x/p', 'never', ALL_SIX)))).entries).toEqual(
      []
    );
  });

  it('keeps a loc that carries all six alternates but is daily in one file', () => {
    // The 19 category pages. `alternates < 6` alone drops them, which is why
    // ticket 50 says both clauses are necessary. The nl file marks them daily
    // and the store's own file does not, so one file is enough.
    const files = sixFiles(sitemap(url('https://x/veranda', 'never', ALL_SIX)));
    files.nl = sitemap(url('https://x/veranda', 'daily', ALL_SIX));

    expect(reduceSitemaps(files).entries.map((e) => e.loc)).toEqual(['https://x/veranda']);
  });

  it('sorts the entries by loc, whatever order the files arrive in', () => {
    // The extract is committed, so a second run over the same source must give
    // the same bytes. Neither the order inside a file nor the key order of the
    // argument may reach the output.
    const files = sixFiles(sitemap(url('https://x/b', 'daily'), url('https://x/a', 'daily')));
    const reversed = Object.fromEntries(Object.entries(files).reverse());

    expect(reduceSitemaps(files).entries.map((e) => e.loc)).toEqual(['https://x/a', 'https://x/b']);
    expect(reduceSitemaps(reversed)).toEqual(reduceSitemaps(files));
  });

  it('counts every loc of each source file, including the ones it drops', () => {
    // The reduction throws away 26,664 product locs of each file. The count of
    // what was there is the only way a reader can tell a full fetch from a
    // truncated one, so it is kept even though the entries are not.
    const files = sixFiles(sitemap(url('https://x/p', 'never', ALL_SIX), url('https://x/q', 'daily')));
    files.nl = sitemap(url('https://x/q', 'daily'));

    expect(reduceSitemaps(files).locs).toEqual({
      nl: 1,
      be: 2,
      be_fr: 2,
      de: 2,
      fr: 2,
      uk: 2,
    });
  });

  it('counts the files that disagree about the alternates of one loc', () => {
    // "One entry, not six copies" is only correct because ticket 50 measured the
    // alternate blocks byte-identical in all six files. The merge keeps the
    // first block and drops five, so the count of disagreements is what makes
    // that assumption checkable instead of load-bearing and invisible.
    const files = sixFiles(sitemap(url('https://x/p', 'daily', { 'nl-NL': 'https://a' })));
    files.uk = sitemap(url('https://x/p', 'daily', { 'nl-NL': 'https://b' }));

    const extract = reduceSitemaps(files);
    expect(extract.alternateConflicts).toBe(1);
    expect(extract.entries[0].alternates).toEqual({ 'nl-NL': 'https://a' });
  });
});

describe('serialiseExtract', () => {
  const extract = reduceSitemaps(
    sixFiles(sitemap(url('https://x/b', 'daily', { 'nl-NL': 'https://x/a' }), url('https://x/a', 'daily')))
  );

  it('writes one entry on one line, so a review reads the diff', () => {
    // The extract is committed and a human reviews it. A pretty-printed array
    // buries one changed page in nine lines of alternates; a line for each page
    // makes the git diff name the page that changed.
    const lines = serialiseExtract(extract).split('\n');
    expect(lines.filter((line) => line.startsWith('{"loc"'))).toHaveLength(2);
  });

  it('parses back to the extract it was made from', () => {
    expect(JSON.parse(serialiseExtract(extract))).toEqual(extract);
  });
});

describe('buildManifest', () => {
  const extract = reduceSitemaps(
    sixFiles(sitemap(url('https://x/p', 'never', ALL_SIX), url('https://x/q', 'daily')))
  );
  const sources = SITEMAP_FILES.map((file) => ({
    file,
    url: `https://${file}/sitemap.xml`,
    status: 200,
    bytes: 1234,
  }));

  it('records the fetch beside the counts the extract can be checked against', () => {
    const manifest = buildManifest({ fetchedAt: '2026-08-10', sources, extract });
    expect(manifest.fetchedAt).toBe('2026-08-10');
    expect(manifest.entries).toBe(1);
    expect(manifest.sources[0]).toEqual({
      file: 'nl',
      url: 'https://nl/sitemap.xml',
      status: 200,
      bytes: 1234,
      locs: 2,
      kept: 1,
    });
  });

  it('names each count the extract does not bear out', () => {
    // The two files are committed side by side and a hand can edit either one.
    // A manifest that claims a count the extract does not hold is the exact
    // shape of a short extract from a failed fetch, so it is checked.
    const manifest = buildManifest({ fetchedAt: '2026-08-10', sources, extract });
    expect(manifestDisagreements(manifest, extract)).toEqual([]);

    manifest.entries = 99;
    manifest.sources[2].kept = 7;
    expect(manifestDisagreements(manifest, extract)).toEqual([
      'entries: the manifest says 99, the extract holds 1',
      'be_fr: the manifest says 7 kept, the extract holds 1',
    ]);
  });
});

describe('the committed evidence', () => {
  const read = (name) =>
    JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
  const extract = read('sitemap-extract.json');
  const manifest = read('sitemap-manifest.json');

  it('agrees with the manifest beside it', () => {
    // Ticket 52: a reader a year from now checks every number in the log against
    // the production data it came from. That only holds while the two files are
    // the same measurement.
    expect(manifestDisagreements(manifest, extract)).toEqual([]);
  });

  it('records all six sitemaps, each answering 200', () => {
    expect(manifest.sources.map((s) => s.file)).toEqual(SITEMAP_FILES);
    expect(manifest.sources.map((s) => s.status)).toEqual(SITEMAP_FILES.map(() => 200));
    // A short extract from a failed fetch is the defect this file exists to
    // stop. Each source is about 30 MB and holds about 27,000 locs.
    for (const source of manifest.sources) {
      expect(source.bytes).toBeGreaterThan(20e6);
      expect(source.locs).toBeGreaterThan(20000);
    }
  });

  it('is the bytes the reduction gives, so the file was not edited by hand', () => {
    expect(serialiseExtract(extract)).toBe(
      readFileSync(new URL('../data/sitemap-extract.json', import.meta.url), 'utf8')
    );
  });
});
