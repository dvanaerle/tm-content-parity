/**
 * The reduction that turns 181 MB of production sitemap into evidence a reader
 * can check (ticket 52).
 *
 * This module is pure: sitemap xml in, extract out. It fetches nothing and it
 * writes nothing, so a test can read it.
 */

/** The six sitemaps. `be` and `be_fr` share a host and differ by the path. */
export const SITEMAP_SOURCES = {
  nl: 'https://www.tuinmaximaal.nl/sitemap.xml',
  be: 'https://www.tuinmaximaal.be/sitemap.xml',
  be_fr: 'https://www.tuinmaximaal.be/fr/sitemap.xml',
  de: 'https://www.tuinmaximaal.de/sitemap.xml',
  fr: 'https://www.tuinmaximaal.fr/sitemap.xml',
  uk: 'https://www.tuinmaximaal.co.uk/sitemap.xml',
};

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} SitemapFile */

/** The file order. It fixes the merge, so the output does not depend on it. */
export const SITEMAP_FILES = /** @type {SitemapFile[]} */ (Object.keys(SITEMAP_SOURCES));

/**
 * @typedef {object} SitemapUrl
 * @property {string} loc
 * @property {string} changefreq Empty when the block declares none.
 * @property {Record<string, string>} alternates hreflang code to url.
 */

/**
 * Read one sitemap file.
 *
 * A regex over `<url>` blocks, in the manner of `crawl/10-store-seeds.mjs`. The
 * files are flat `<urlset>` documents of one shape, and 30 MB through an xml
 * parser buys nothing here.
 *
 * @param {string} xml
 * @returns {SitemapUrl[]}
 */
export function parseSitemap(xml) {
  const urls = [];
  for (const block of xml.split('<url>').slice(1)) {
    const loc = block.match(/<loc>([^<]*)<\/loc>/)?.[1];
    if (!loc) continue;

    const alternates = {};
    for (const [, lang, href] of block.matchAll(/hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) {
      alternates[lang] = href;
    }

    urls.push({
      loc,
      changefreq: block.match(/<changefreq>([^<]*)<\/changefreq>/)?.[1] ?? '',
      alternates,
    });
  }
  return urls;
}

/** The six hreflang codes production declares. Their count is the rule below. */
const STORE_HREFLANG = ['nl-NL', 'nl-BE', 'fr-BE', 'de-DE', 'fr-FR', 'en-GB'];

/**
 * The candidate rule of ticket 50, without the product signature.
 *
 * A loc survives when it carries fewer than six alternates, or when one of the
 * six files marks it `daily`. Both clauses are necessary: `changefreq` alone
 * misses the pages that only one file marks, and the alternate count alone
 * drops the 19 category pages, which carry all six alternates.
 *
 * The product signature is **not** applied here. It is ticket 53's rule, and an
 * extract that has already applied it cannot be used to test it.
 *
 * @param {ExtractEntry} entry
 */
function isCandidate(entry) {
  const declared = STORE_HREFLANG.filter((lang) => entry.alternates[lang]).length;
  return declared < 6 || Object.values(entry.changefreq).includes('daily');
}

/**
 * @param {Record<string, string>} a
 * @param {Record<string, string>} b
 */
function sameAlternates(a, b) {
  const langs = Object.keys(a);
  return langs.length === Object.keys(b).length && langs.every((lang) => a[lang] === b[lang]);
}

/**
 * @typedef {object} ExtractEntry
 * @property {string} loc
 * @property {Record<SitemapFile, string | null>} changefreq
 * @property {Record<string, string>} alternates
 */

/**
 * @typedef {object} Extract
 * @property {Record<SitemapFile, number>} locs Every loc of each source file,
 *   including the ones the reduction drops. A reader tells a full fetch from a
 *   truncated one by this number.
 * @property {number} alternateConflicts Files that disagree about the alternates
 *   of one loc. One entry and not six copies is only correct while it is 0.
 * @property {ExtractEntry[]} entries
 */

/**
 * Merge the six files into one entry for each loc.
 *
 * One merged entry with six flags, not six copies: ticket 50 measured the
 * alternate blocks byte-identical in all six files, so six copies would be six
 * times the bytes for the same information. Only `changefreq` differs.
 *
 * @param {Record<string, string>} byFile The xml of each of the six files.
 */
export function reduceSitemaps(byFile) {
  const merged = new Map();
  const locs = /** @type {Record<SitemapFile, number>} */ ({});
  let alternateConflicts = 0;

  // The fixed file order, never the key order of the argument.
  for (const file of SITEMAP_FILES) {
    const urls = parseSitemap(byFile[file]);
    locs[file] = urls.length;

    for (const url of urls) {
      let entry = merged.get(url.loc);
      if (!entry) {
        entry = {
          loc: url.loc,
          changefreq: Object.fromEntries(SITEMAP_FILES.map((f) => [f, null])),
          alternates: url.alternates,
        };
        merged.set(url.loc, entry);
      } else if (!sameAlternates(entry.alternates, url.alternates)) {
        alternateConflicts++;
      }
      entry.changefreq[file] = url.changefreq;
    }
  }

  const entries = [...merged.values()]
    .filter(isCandidate)
    // Codepoint order, not `localeCompare`: the committed bytes must not depend
    // on the locale of the machine that ran the reduction.
    .sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));

  return { locs, alternateConflicts, entries };
}

/**
 * @param {Record<string, string>} alternates
 */
function orderedAlternates(alternates) {
  const known = STORE_HREFLANG.filter((lang) => lang in alternates);
  const rest = Object.keys(alternates)
    .filter((lang) => !STORE_HREFLANG.includes(lang))
    .sort();
  return Object.fromEntries([...known, ...rest].map((lang) => [lang, alternates[lang]]));
}

/**
 * The committed bytes.
 *
 * One entry on one line, so that a review of the extract reads as a list of
 * pages and a git diff names the page that changed.
 *
 * @param {Extract} extract
 * @returns {string}
 */
export function serialiseExtract(extract) {
  const line = (entry) =>
    JSON.stringify({
      loc: entry.loc,
      changefreq: Object.fromEntries(SITEMAP_FILES.map((f) => [f, entry.changefreq[f] ?? null])),
      alternates: orderedAlternates(entry.alternates),
    });

  const locs = JSON.stringify(Object.fromEntries(SITEMAP_FILES.map((f) => [f, extract.locs[f]])));
  const list = extract.entries.length
    ? `[\n${extract.entries.map(line).join(',\n')}\n  ]`
    : '[]';

  return [
    '{',
    `  "locs": ${locs},`,
    `  "alternateConflicts": ${extract.alternateConflicts},`,
    `  "entries": ${list}`,
    '}',
    '',
  ].join('\n');
}

/**
 * @param {Extract} extract
 * @param {SitemapFile} file
 */
const keptIn = (extract, file) =>
  extract.entries.filter((entry) => entry.changefreq[file] !== null).length;

/**
 * The record of the fetch, beside the extract it produced.
 *
 * The extract carries no date, because it must be a function of its source
 * alone. The manifest is where the date belongs: it is the record of one fetch,
 * and a reader a year from now checks the numbers in the log against it.
 *
 * @param {object} input
 * @param {string} input.fetchedAt
 * @param {{ file: SitemapFile, url: string, status: number, bytes: number }[]} input.sources
 * @param {Extract} input.extract
 */
export function buildManifest({ fetchedAt, sources, extract }) {
  return {
    fetchedAt,
    entries: extract.entries.length,
    sources: sources.map(({ file, url, status, bytes }) => ({
      file,
      url,
      status,
      bytes,
      locs: extract.locs[file],
      kept: keptIn(extract, file),
    })),
  };
}

/**
 * Every count in the manifest that the extract does not bear out.
 *
 * @param {ReturnType<typeof buildManifest>} manifest
 * @param {Extract} extract
 * @returns {string[]}
 */
export function manifestDisagreements(manifest, extract) {
  const said = [];
  if (manifest.entries !== extract.entries.length) {
    said.push(
      `entries: the manifest says ${manifest.entries}, the extract holds ${extract.entries.length}`
    );
  }
  for (const source of manifest.sources) {
    if (source.locs !== extract.locs[source.file]) {
      said.push(
        `${source.file}: the manifest says ${source.locs} locs, the extract holds ${extract.locs[source.file]}`
      );
    }
    const kept = keptIn(extract, source.file);
    if (source.kept !== kept) {
      said.push(`${source.file}: the manifest says ${source.kept} kept, the extract holds ${kept}`);
    }
  }
  return said;
}
