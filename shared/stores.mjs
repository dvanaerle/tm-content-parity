/**
 * The six store views, the language each one speaks, and nothing else.
 *
 * `crawl/` builds the seed list against them and `compare/` reads a store out of
 * a report filename against them. Two stages, thus `shared/`: pure, and it
 * imports nothing. See ADR 0001.
 *
 * One list. The log's most load-bearing piece of vocabulary must not be able to
 * drift between two copies of itself.
 *
 * `HREFLANG_STORE` below is here for a second reason, and a weaker one at the
 * time it arrived: only `crawl/` read it, but `web/` is about to derive the
 * language blocks from it and `web/` cannot import `crawl/`. It came first so
 * that the surface which needs it is a small change. See ADR 0001.
 *
 * The hosts, the sitemap urls and the `fr/` path prefix are **not** here. They
 * are crawl concerns and they stay in `crawl/seed-list.mjs`. The language fact
 * moved alone.
 */

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} Store */

/** @typedef {'nl-NL' | 'nl-BE' | 'fr-BE' | 'de-DE' | 'fr-FR' | 'en-GB'} Hreflang */

/** In the order every table in the log uses. */
export const STORES = /** @type {Store[]} */ (['nl', 'be', 'be_fr', 'de', 'fr', 'uk']);

/**
 * The hreflang code of each store.
 *
 * The language groups follow from it and are written down nowhere else. Two
 * blocks carry the store-local content: `{be_fr, fr}` on 178 pages and
 * `{be, nl}` on 152. They are not the only two — sixteen shapes exist, and
 * `{de, nl, uk}` and `{de, uk}` are two of them. 87 German and 85 British
 * content pages declare no alternate at all, so hreflang can never reach them.
 *
 * @type {Record<Hreflang, Store>}
 */
export const HREFLANG_STORE = {
  'nl-NL': 'nl',
  'nl-BE': 'be',
  'fr-BE': 'be_fr',
  'de-DE': 'de',
  'fr-FR': 'fr',
  'en-GB': 'uk',
};

/**
 * The six codes, in the order production declares them.
 *
 * Their count is the first clause of the seed list's candidate rule, and their
 * order is the order `crawl/sitemap-extract.mjs` writes an entry's alternates
 * in, so it is in `data/sitemap-extract.json` and not a matter of taste.
 */
export const STORE_HREFLANG = /** @type {Hreflang[]} */ (Object.keys(HREFLANG_STORE));
