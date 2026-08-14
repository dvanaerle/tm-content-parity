/**
 * THROWAWAY probe, kept as evidence. Ticket 54.
 *
 * Ticket 50 measured the navigation and the footer of three production stores
 * against the page set the new rule finds, and the French store scored 88.5%
 * where the old rule scored 40.4%. That measurement was made against a set that
 * only existed inside ticket 50's session. Ticket 53 then built the real seed
 * list, and 54 has to show that the number survived the build.
 *
 *   node crawl/probes/probe-navigation-coverage.mjs [store...]
 *
 * The store's production home page is read once and every internal link in its
 * navigation and its footer is looked up in `data/10-store-seeds.json`. It reads
 * **production only**, so it does not wait for the new site.
 *
 * A navigation crawl is a **floor and not an answer**: ticket 50 found 11 pages
 * in the set that are in no navigation and no footer. The number says the pages
 * an editor can reach are in the log; it does not say the log holds nothing else.
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';

import { fetchPage } from '../fetch-page.mjs';
import { PROD_HOST, homePath, storePageOf } from '../seed-list.mjs';
import { STORES } from '../../shared/stores.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-navigation-coverage.json', import.meta.url);

/**
 * The production host of each store. `PROD_HOST` maps the other way and holds
 * five hosts for six stores, so inverting it alone leaves `be_fr` undefined: the
 * two Belgian stores share a host and only the path separates them.
 */
const HOST_OF = {
  ...Object.fromEntries(Object.entries(PROD_HOST).map(([host, store]) => [store, host])),
  be_fr: 'www.tuinmaximaal.be',
};

/**
 * The navigation and the footer, and nothing between them. `<main>` is the
 * content boundary everywhere else in the log; here it is the part to ignore,
 * because a link inside the content is not a page an editor navigates to.
 */
const CHROME = ['header', 'nav', 'footer', '[class*="page-header"]', '[class*="page-footer"]'];

/**
 * A chrome link that was never a candidate for the log, so counting it in the
 * denominator would measure the wrong thing.
 *
 * Two kinds, and neither is a judgement about this store. A **file** is an asset
 * and not a page. An **application route** — the account, the cart, the checkout,
 * the dealer login — is Magento's own, and `CONTEXT.md` puts an application page
 * outside the log by definition, which is the same ground ticket 19 excluded the
 * configurator on.
 *
 * Both counts are reported, so the denominator is a stated choice and not a
 * silent one.
 */
const NOT_A_PAGE = [
  /\.(pdf|jpe?g|png|svg|webp|zip|docx?|xlsx?)$/i,
  /^(media|static)\//,
  /^(customer|checkout|dealer|sales|wishlist|newsletter\/subscriber)(\/|$)/,
];

/**
 * The rules are anchored at the store root, and `be_fr` is the one store whose
 * root is not `/`. Its paths carry the `fr/` prefix, so `fr/checkout/cart` read
 * as a content page and four Magento routes landed in its denominator. Ticket 55.
 *
 * @param {string} path
 * @param {string} store
 */
const isNotAPage = (path, store) => {
  const root = homePath(store);
  const relative = path.startsWith(root) ? path.slice(root.length) : path;
  return NOT_A_PAGE.some((rule) => rule.test(relative));
};

/** The paths the chrome of one production page links to, inside the same store. */
function chromePaths(html, store) {
  const root = parse(html, { closeAllByClosing: true });
  const base = `https://${HOST_OF[store]}/${homePath(store)}`;
  const paths = new Set();

  for (const selector of CHROME) {
    for (const region of root.querySelectorAll(selector)) {
      for (const anchor of region.querySelectorAll('a[href]')) {
        const href = anchor.getAttribute('href') ?? '';
        if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;

        let url;
        try {
          url = new URL(href, base);
        } catch {
          continue;
        }
        const found = storePageOf(url.href);
        // A link out of the store is a different defect, and ticket 49 owns it.
        if (found?.store !== store) continue;
        paths.add(found.path.replace(/\/+$/, ''));
      }
    }
  }
  return [...paths].sort();
}

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
const stores = process.argv.slice(2).filter((name) => STORES.includes(name));
if (!stores.length) stores.push('fr');

const report = {};

for (const store of stores) {
  const inSeeds = new Set(
    seeds.rows
      .map((row) => row.stores?.[store]?.path)
      .filter((path) => typeof path === 'string')
      .map((path) => path.replace(/\/+$/, '')),
  );

  const home = `https://${HOST_OF[store]}/${homePath(store)}`;
  const page = await fetchPage(home);
  if (page.status !== 200) throw new Error(`${home} answered ${page.status}`);

  const all = chromePaths(page.html, store);
  const notPages = all.filter((path) => isNotAPage(path, store));
  const candidates = all.filter((path) => !isNotAPage(path, store));
  const missing = candidates.filter((path) => !inSeeds.has(path));
  const found = candidates.length - missing.length;
  // A store whose chrome yields no candidate is a broken read, not 0% coverage.
  // Without this the report says `NaN` and reads like a measurement.
  if (!candidates.length) throw new Error(`${store}: the chrome of ${home} holds no page link`);

  report[store] = {
    home,
    chromePaths: all.length,
    notPages,
    candidates: candidates.length,
    // The list, not only the count. Ticket 22 exists because 451 numbers were
    // recorded and nobody could check them.
    candidatePaths: candidates,
    found,
    coverage: Number(((found / candidates.length) * 100).toFixed(1)),
    seedPages: inSeeds.size,
    missing,
  };

  console.log(
    `${store}: ${found} of ${candidates.length} content-page candidates in the seed list — ` +
      `${report[store].coverage}%`,
  );
  console.log(
    `  ${all.length} chrome paths, of which ${notPages.length} are a file or an application route`,
  );
  for (const path of missing) console.log(`  missing: /${path}`);
}

await writeFile(OUT, JSON.stringify({ at: new Date().toISOString(), stores: report }, null, 2));
console.log(`\nwrote ${OUT.pathname}`);
