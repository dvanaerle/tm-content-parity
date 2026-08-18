/**
 * THROWAWAY probe, kept as evidence. Ticket: 69.
 *
 * Ticket 69 asks one question before it asks for a rule: **after ticket 64 removed
 * the promo banner, how much of the duplication left inside the boundary is a
 * responsive copy?** Production sends the desktop and the mobile version of some
 * blocks in the same HTML, the extraction has no computed style, and so it reads
 * both. A rule by class convention is only worth building if the conventions carry
 * a measurable number of units.
 *
 * The probe does not decide. It reports, for every unit text that occurs more than
 * once inside the boundary, the class chain above each copy — so a convention that
 * hides one copy shows itself instead of being guessed at.
 *
 *   node crawl/probes/probe-responsive-duplicates.mjs
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { EXCLUDED_REGIONS } from '../../shared/excluded-regions.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';
import { collapse } from '../normalise.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-responsive-duplicates.json', import.meta.url);

/** Six stores, because a responsive convention is markup and must hold in all. */
const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

/**
 * The two pages ticket 69 measured — `/downloads` at 40 duplicated strings and a
 * category page at four — plus the two other category pages the region entries
 * were measured on, a home page and two CMS pages as controls.
 */
const PAGES = [
  'downloads',
  'overkapping',
  'carport',
  'veranda',
  '(home)',
  'betaalmethoden',
  'showroom-contact',
];

/** Tags whose text the extractor reads. Kept in step with `crawl/extract.mjs`. */
const TEXT_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption,th,td,a,button';

/** Never content, wherever it sits, and its text leaks into the unit above it. */
const NEVER_CONTENT = ['script', 'style', 'noscript'];

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

/**
 * @param {string} page
 * @returns {{ store: string, page: string, prodUrl: string, newUrl: string }[]}
 */
const cellsFor = (page) => {
  const row = seeds.rows.find((r) => r.page === page);
  if (!row) return [];
  return STORES.map((store) => ({ store, cell: row.stores?.[store] }))
    .filter(({ cell }) => cell?.prodUrl && cell?.newUrl)
    .map(({ store, cell }) => ({ store, page, prodUrl: cell.prodUrl, newUrl: cell.newUrl }));
};

/**
 * The boundary the extractor reads, with the committed regions already cut, so the
 * class chains below describe what the log actually holds and not what the page
 * sends.
 *
 * @param {string} html
 * @returns {import('node-html-parser').HTMLElement | null}
 */
function boundaryOf(html) {
  const root = parse(html, { closeAllByClosing: true });
  const body = root.querySelector('body');
  if (!body) return null;
  for (const selector of NEVER_CONTENT) {
    for (const node of body.querySelectorAll(selector)) node.remove();
  }
  const scope = root.querySelector('main') ?? body;
  for (const entry of EXCLUDED_REGIONS) {
    for (const node of scope.querySelectorAll(entry.selector)) node.remove();
  }
  return scope;
}

/**
 * @param {import('node-html-parser').HTMLElement} node
 * @param {import('node-html-parser').HTMLElement} stopAt
 * @returns {string[]} The class attributes from the node upwards, nearest first.
 */
function classChain(node, stopAt) {
  const chain = [];
  for (let at = node; at && at !== stopAt; at = at.parentNode) {
    const classes = at.getAttribute?.('class');
    if (classes) chain.push(collapse(classes));
  }
  return chain;
}

/**
 * @param {import('../../compare/contract.mjs').PageExtract} extract
 * @returns {string[]} Unit texts that occur more than once.
 */
function repeatedTexts(extract) {
  const counts = new Map();
  for (const unit of extract.elements) counts.set(unit.norm, (counts.get(unit.norm) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([text]) => text);
}

/**
 * @param {string} html
 * @param {import('../../compare/contract.mjs').PageExtract} extract
 */
function copiesOfRepeats(html, extract) {
  const scope = boundaryOf(html);
  if (!scope) return [];
  const byText = new Map();
  for (const node of scope.querySelectorAll(TEXT_TAGS)) {
    const text = collapse((node.structuredText ?? node.text ?? '').replaceAll('\n', ' '));
    if (!text) continue;
    if (!byText.has(text)) byText.set(text, []);
    byText.get(text).push(node);
  }

  return repeatedTexts(extract).map((text) => ({
    text,
    copies: (byText.get(text) ?? []).map((node) => ({
      tag: node.rawTagName.toLowerCase(),
      chain: classChain(node, scope),
    })),
  }));
}

/**
 * @param {string} side
 * @param {{ store: string, page: string }} where
 * @param {string} url
 */
async function measure(side, where, url) {
  const { status, html } = await fetchPage(url);
  const extract = extractPage(html, { ...where, side, url, status, onWarn: () => {} });
  return {
    side,
    url,
    status,
    units: extract.elements.length,
    repeats: copiesOfRepeats(html, extract),
  };
}

const results = [];
for (const page of PAGES) {
  for (const { store, prodUrl, newUrl } of cellsFor(page)) {
    const where = { store, page };
    for (const [side, url] of [
      ['production', prodUrl],
      ['new', newUrl],
    ]) {
      try {
        results.push({ store, page, ...(await measure(side, where, url)) });
        console.log(`${store}/${page} ${side}: ok`);
      } catch (error) {
        results.push({ store, page, side, url, error: String(error.message ?? error) });
        console.log(`${store}/${page} ${side}: ${error.message ?? error}`);
      }
    }
  }
}

await writeFile(
  OUT,
  `${JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2)}\n`,
);
console.log(`\nWrote ${OUT.pathname}`);
