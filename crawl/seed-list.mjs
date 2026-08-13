/**
 * The rule that decides which production URL is a **content page** of which
 * **store**, and the build of the seed list from it (ticket 53).
 *
 * This module is pure: the sitemap extract and the previous seed list go in,
 * seed rows come out. It fetches nothing and it writes nothing, so a test can
 * read it. `crawl/10-store-seeds.mjs` is the run.
 *
 * The old generator kept `changefreq=daily` only. The `nl`, `be` and `uk`
 * stores mark their store-local content `daily`; the `de`, `fr` and `be_fr`
 * stores mark the same kind of content `never`. That one inconsistency is why
 * an editor of the French store saw one page in four (ticket 50).
 */

import { HOME, unanchoredKey, unsafeReason } from '../shared/page-key.mjs';
import { unknownDropRules } from '../shared/drop-rules.mjs';
import { STORES } from '../shared/stores.mjs';

/** @typedef {import('../shared/stores.mjs').Store} Store */

export { STORES };

/** Five hosts for six stores: `be` and `be_fr` share one. */
export const PROD_HOST = {
  'www.tuinmaximaal.nl': 'nl',
  'www.tuinmaximaal.be': 'be',
  'www.tuinmaximaal.de': 'de',
  'www.tuinmaximaal.fr': 'fr',
  'www.tuinmaximaal.co.uk': 'uk',
};

export const NEW_HOST = {
  nl: 'm2stagingnl.intern.systems',
  be: 'm2stagingbe.intern.systems',
  be_fr: 'm2stagingbe.intern.systems',
  de: 'm2stagingde.intern.systems',
  fr: 'm2stagingfr.intern.systems',
  uk: 'm2staginguk.intern.systems',
};

/**
 * The hreflang code of each store.
 *
 * The language groups follow from it and are written down nowhere else. Two
 * blocks carry the store-local content: `{be_fr, fr}` on 178 pages and
 * `{be, nl}` on 152. They are not the only two — sixteen shapes exist, and
 * `{de, nl, uk}` and `{de, uk}` are two of them. 87 German and 85 British
 * content pages declare no alternate at all, so hreflang can never reach them.
 */
export const HREFLANG_STORE = {
  'nl-NL': 'nl',
  'nl-BE': 'be',
  'fr-BE': 'be_fr',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'en-GB': 'uk',
};

/** The six codes. Their count is the first clause of the rule. */
export const STORE_HREFLANG = Object.keys(HREFLANG_STORE);

const NL_PREFIX = 'https://www.tuinmaximaal.nl/';

/** The path of the `be_fr` store inside the Belgian host. */
const BE_FR_PREFIX = 'fr/';

/**
 * The store of a production URL, and its path inside that store.
 *
 * `be` and `be_fr` share `www.tuinmaximaal.be`, and only the path separates
 * them. The prefix stays in the path, because both sides of the comparison
 * serve the French Belgian store under `/fr/`.
 *
 * @param {string} loc
 * @returns {{ store: Store, path: string } | null} `null` for a host that is
 *   not one of the five. Nothing in the log can be said about such a URL.
 */
export function storePageOf(loc) {
  let url;
  try {
    url = new URL(loc);
  } catch {
    return null;
  }
  const host = PROD_HOST[url.host];
  if (!host) return null;

  const path = url.pathname.replace(/^\//, '');
  const store = host === 'be' && path.startsWith(BE_FR_PREFIX) ? 'be_fr' : host;
  return { store: /** @type {Store} */ (store), path };
}

/**
 * The path of any URL, including one of a host the log does not know. A drop
 * record carries a path even when it carries no store, so the reader of the
 * dashboard sees a page name and not only a hostname.
 *
 * @param {string} loc
 * @returns {string}
 */
const pathOf = (loc) => {
  try {
    return new URL(loc).pathname.replace(/^\//, '');
  } catch {
    return loc;
  }
};

/** The store root, which is that store's home page. */
export const homePath = (/** @type {Store} */ store) => (store === 'be_fr' ? BE_FR_PREFIX : '');

const lastSegment = (/** @type {string} */ path) =>
  path.replace(/\/+$/, '').split('/').pop() ?? '';

/**
 * A measurement in the last path segment: a number joined to a unit of length.
 *
 * `glazen-dakplaat-ongehard-2500mm-x-700mm`, `melkglas-…-2500-mm-x-700-mm` and
 * `sun-shading-screen-housing-set-of-2-5m-matt-white` are three spellings of the
 * same thing. A content page names no dimension.
 */
const MEASUREMENT = /(^|-)\d+(-\d+)?-?(mm|cm|metre|meter|m)(-|$)/;

const COLOUR =
  'white|black|anthracite|anthacite|wit|zwart|antraciet|weiss|schwarz|anthrazit|blanc|noir';

/**
 * A colour beside a finish, in either order: `spuitbus-mat-wit`,
 * `spruhdose-matt-weiss`, `aerosol-blanc-mat`.
 *
 * The colour alone is not the signature. `black-veranda` is a British content
 * page, and production says so: it answers with `cms-page-view` on the body.
 * A page that names a colour **and** a finish is naming a variant of an article.
 */
const COLOUR_FINISH = new RegExp(
  `(^|-)(mat|matt)-(${COLOUR})(-|$)|(^|-)(${COLOUR})-(mat|matt)(-|$)`
);

/**
 * The product signature. It is general and it holds no store name.
 *
 * The British store is the only store where the alternate clause admits product
 * pages, and a branch for one store is the asymmetry that made ticket 50. So the
 * signature is lexical and it is the same rule everywhere.
 *
 * Measured against production, which names the two kinds on the `<body>`:
 * `crawl/probes/probe-product-signature.mjs` read all 876 candidates and found
 * 105 `catalog-product-view` pages. This signature names those 105 and none of
 * the other 771.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isProductPage(path) {
  const segment = lastSegment(path);
  return MEASUREMENT.test(segment) || COLOUR_FINISH.test(segment);
}

/**
 * @typedef {object} Candidate
 * @property {string} loc
 * @property {Record<string, string>} alternates hreflang code to url.
 * @property {Record<string, string | null>} changefreq The value in each of the
 *   six sitemap files, `null` where that file does not hold the loc.
 */

/** How many of the six store hreflang codes a loc declares. */
export const alternateCount = (/** @type {Record<string, string>} */ alternates) =>
  STORE_HREFLANG.filter((lang) => alternates[lang]).length;

/** Whether any of the six files marks the loc `daily`. */
export const markedDaily = (/** @type {Record<string, string | null>} */ changefreq) =>
  Object.values(changefreq).includes('daily');

/**
 * The content page rule of ticket 50.
 *
 *     (alternates < 6  OR  changefreq=daily in any of the six files)
 *     AND NOT a product signature
 *
 * Both clauses of the first half are necessary. `changefreq` alone gives 32
 * French pages, because five of the six files mark French content `never`. The
 * alternate count alone drops the 19 category pages, because a category page
 * carries all six alternates and `/terrasoverkapping` is the most important page
 * on the site.
 *
 * @param {Candidate} candidate
 * @returns {boolean}
 */
export function isContentPage({ loc, alternates, changefreq }) {
  const page = storePageOf(loc);
  if (!page) return false;
  if (isProductPage(page.path)) return false;
  return alternateCount(alternates) < 6 || markedDaily(changefreq);
}

/**
 * Which clause admitted the page. It is the cell's provenance, so the reason a
 * page is in the list lives in the data and not in a code comment.
 *
 * @param {Candidate} candidate
 * @returns {'sitemap-daily' | 'sitemap-low-alternates'}
 */
export const provenanceOf = ({ changefreq }) =>
  markedDaily(changefreq) ? 'sitemap-daily' : 'sitemap-low-alternates';

/**
 * The key of the row a store page belongs to.
 *
 * A page that production declares in Dutch is keyed on its **NL url key**, and
 * the six store views of it are one row. A page with no `nl-NL` alternate is
 * **unanchored**: it is a page of its own store, and it is keyed on its store
 * and its path. More than half of the pages are of the second kind.
 *
 * `shared/page-key.mjs` owns the shape: the sentinel is a parenthesis, the store
 * roots are the home row whatever they declare, and `unsafeReason()` says which
 * characters a key may not hold. This function is the producer, and it is the
 * only other place that writes the form.
 *
 * @param {{ store: Store, path: string, alternates?: Record<string, string> }} input
 * @returns {string}
 */
export function pageKey({ store, path, alternates = {} }) {
  if (path === homePath(store)) return HOME;

  const nl = store === 'nl' ? `${NL_PREFIX}${path}` : alternates['nl-NL'];
  if (nl?.startsWith(NL_PREFIX)) return nl.slice(NL_PREFIX.length) || HOME;

  return unanchoredKey(store, path);
}

/** The new site is a host swap of production. Nothing else changes. */
export const newUrl = (/** @type {Store} */ store, /** @type {string} */ path) =>
  `https://${NEW_HOST[store]}/${path}`;

/**
 * @typedef {object} Cell
 * @property {string} path
 * @property {string} prodUrl
 * @property {string} newUrl
 * @property {string} provenance Which clause of the rule admitted the cell, or
 *   `carried-over`. `CONTEXT.md` gives the word.
 */

/**
 * @typedef {object} SeedRow
 * @property {string} page
 * @property {Record<Store, Cell | null>} stores
 */

const emptyRow = (/** @type {string} */ page) => ({
  page,
  stores: /** @type {Record<Store, Cell | null>} */ (
    Object.fromEntries(STORES.map((store) => [store, null]))
  ),
});

/**
 * One URL that left the list, and the rule that took it.
 *
 * The rule is a **name**, and `shared/drop-rules.mjs` holds its words. The
 * dashboard shows the reason, so the reason must be correctable without a new
 * seed list: the name in the committed data does not move when the sentence is
 * rewritten. `detail` is what one sentence cannot hold, such as which page a
 * collision lost to.
 *
 * The store is on the record, because the dashboard is per store (ticket 38). A
 * URL of a host that is not one of the five belongs to no store, and its store
 * is `null`.
 *
 * @typedef {object} DropRecord
 * @property {string} loc
 * @property {Store | null} store
 * @property {string} path
 * @property {string} rule A key of `DROP_RULES`.
 * @property {string} [detail]
 */

/**
 * Build the seed list.
 *
 * @param {object} input
 * @param {Candidate[]} input.entries The candidates of `data/sitemap-extract.json`.
 * @param {SeedRow[]} input.carriedRows The rows of the committed seed list. The
 *   49 store pages that no sitemap declares are carried from here: the generator
 *   that first found them read an input that no longer exists, so no rule can
 *   find them again.
 * @returns {{
 *   rows: SeedRow[],
 *   dropped: DropRecord[],
 *   collisions: { page: string, store: Store, kept: string, dropped: string }[],
 *   carried: number,
 * }}
 */
export function buildSeedList({ entries, carriedRows = [] }) {
  const pages = new Map();
  const dropped = [];
  const collisions = [];

  const rowFor = (/** @type {string} */ key) =>
    pages.get(key) ?? pages.set(key, emptyRow(key)).get(key);

  for (const entry of entries) {
    const page = storePageOf(entry.loc);
    if (!page) {
      dropped.push({
        loc: entry.loc,
        store: null,
        path: pathOf(entry.loc),
        rule: 'foreign-host',
      });
      continue;
    }
    if (!isContentPage(entry)) {
      dropped.push({
        loc: entry.loc,
        store: page.store,
        path: page.path,
        rule: isProductPage(page.path) ? 'product-signature' : 'six-alternates-never-daily',
      });
      continue;
    }

    const key = pageKey({ ...page, alternates: entry.alternates });
    const row = rowFor(key);
    const cell = {
      path: page.path,
      prodUrl: entry.loc,
      newUrl: newUrl(page.store, page.path),
      provenance: provenanceOf(entry),
    };

    // Two locs of one store that claim the same NL counterpart. The first wins,
    // so the output does not depend on the order, and the loser is named.
    const seated = row.stores[page.store];
    if (seated) {
      collisions.push({
        page: key,
        store: page.store,
        kept: seated.prodUrl,
        dropped: cell.prodUrl,
      });
      dropped.push({
        loc: entry.loc,
        store: page.store,
        path: page.path,
        rule: 'duplicate-in-store',
        detail: `The ${page.store} store already holds \`${key}\`, at ${seated.prodUrl}.`,
      });
      continue;
    }
    row.stores[page.store] = cell;
  }

  const present = new Set();
  for (const row of pages.values()) {
    for (const store of STORES) {
      const cell = row.stores[store];
      if (cell) present.add(`${store} ${cell.path}`);
    }
  }

  let carried = 0;
  for (const row of carriedRows) {
    for (const store of STORES) {
      const cell = row.stores?.[store];
      if (!cell?.prodUrl) continue;
      if (present.has(`${store} ${cell.path}`)) continue;
      const target = rowFor(row.page);
      if (target.stores[store]) continue;
      target.stores[store] = {
        path: cell.path,
        prodUrl: cell.prodUrl,
        newUrl: newUrl(store, cell.path),
        provenance: 'carried-over',
      };
      carried++;
    }
  }

  // Codepoint order, never `localeCompare`: the committed bytes must not depend
  // on the locale of the machine that ran the generator.
  const rows = [...pages.values()].sort((a, b) => (a.page < b.page ? -1 : a.page > b.page ? 1 : 0));

  return { rows, dropped, collisions, carried };
}

/**
 * The pages of each store, and how many of them each provenance brought.
 *
 * @param {SeedRow[]} rows
 * @returns {Record<string, { pages: number } & Record<string, number>>}
 */
export function countByStore(rows) {
  /** @type {Record<string, { pages: number } & Record<string, number>>} */
  const counts = {};
  for (const store of STORES) {
    const cells = rows.map((row) => row.stores[store]).filter(Boolean);
    counts[store] = { pages: cells.length };
    for (const cell of cells) {
      counts[store][cell.provenance] = (counts[store][cell.provenance] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * The page count of each store, measured on 2026-08-10 against the committed
 * sitemap extract and the 49 carried rows.
 *
 * The NL number is the one that must not move. Ticket 50 matched all 181 rows of
 * the committed list against the new rule: 133 are found by it, 48 are in no
 * sitemap at all, and none are new. If NL moves, the rule is wrong.
 */
export const EXPECTED_PAGES = { nl: 181, be: 131, be_fr: 122, de: 134, fr: 123, uk: 129 };

/** How far a store may drift from the measurement before the run stops. */
const TOLERANCE = 0.15;

/**
 * Every store whose count says the run went wrong. A silent short list is the
 * defect this ticket exists to fix, so the generator writes nothing when this
 * is not empty.
 *
 * @param {Record<string, { pages: number }>} counts
 * @returns {string[]}
 */
export function countDisagreements(counts) {
  const said = [];
  for (const store of STORES) {
    const pages = counts[store]?.pages ?? 0;
    const expected = EXPECTED_PAGES[store];
    if (pages === 0) {
      said.push(`${store}: no page at all, and ${expected} were measured`);
      continue;
    }
    if (Math.abs(pages - expected) > expected * TOLERANCE) {
      said.push(`${store}: ${pages} pages, and ${expected} were measured`);
    }
  }
  return said;
}

/**
 * Everything the seed schema promises and this list does not keep.
 *
 * Six stages read the seed list and no test has ever read its shape. The
 * generator asks this of its own output before it writes.
 *
 * @param {any} seeds
 * @returns {string[]}
 */
export function schemaDisagreements(seeds) {
  const said = [];
  if (!seeds || typeof seeds !== 'object') return ['the seed list is not an object'];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(seeds.generated ?? '')) {
    said.push('`generated` is not an ISO date');
  }
  // Ticket 56: the drop list is data and not a count, so the schema check holds
  // it to the same promise the rows keep. A drop that names no rule, or a rule
  // that no vocabulary explains, is a page excluded without a reason.
  if (!Array.isArray(seeds.dropped)) {
    said.push('`dropped` is not an array. It is the list of URLs that left the list.');
  } else {
    for (const entry of seeds.dropped) {
      for (const field of ['loc', 'path', 'rule']) {
        if (typeof entry?.[field] !== 'string') said.push(`a drop has no \`${field}\``);
      }
      if (entry?.store !== null && !STORES.includes(entry?.store)) {
        said.push(`${entry?.loc}: \`store\` is not one of the six, and not null`);
      }
    }
    said.push(...unknownDropRules(seeds.dropped.filter((entry) => typeof entry?.rule === 'string')));
  }

  if (!Array.isArray(seeds.rows)) return [...said, '`rows` is not an array'];

  const seen = new Set();
  for (const row of seeds.rows) {
    if (typeof row?.page !== 'string' || !row.page) {
      said.push('a row has no `page`');
      continue;
    }
    const unsafe = unsafeReason(row.page);
    if (unsafe) said.push(`${row.page}: ${unsafe}`);
    if (seen.has(row.page)) said.push(`${row.page}: two rows hold this key`);
    seen.add(row.page);

    const stores = Object.keys(row.stores ?? {});
    if (stores.length !== STORES.length || stores.some((s) => !STORES.includes(s))) {
      said.push(`${row.page}: the row does not hold exactly the six stores`);
    }
    if (STORES.every((store) => !row.stores?.[store])) {
      said.push(`${row.page}: the row holds no store at all`);
    }
    for (const store of STORES) {
      const cell = row.stores?.[store];
      if (cell === null || cell === undefined) continue;
      for (const field of ['path', 'prodUrl', 'newUrl', 'provenance']) {
        if (typeof cell[field] !== 'string') said.push(`${row.page}/${store}: no \`${field}\``);
      }
      if (typeof cell.path === 'string' && cell.newUrl !== newUrl(store, cell.path)) {
        said.push(`${row.page}/${store}: the new url is not the host swap of the path`);
      }
      if (typeof cell.prodUrl === 'string' && storePageOf(cell.prodUrl)?.store !== store) {
        said.push(`${row.page}/${store}: the production url is not of this store`);
      }
    }
  }
  return said;
}
