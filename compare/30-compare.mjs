/**
 * The Axis A compare stage: two `PageExtract`s in, one `PageReport` out.
 *
 * Axis A is parity per store, production against the new site. Axis B — coverage,
 * NL against the other stores — is ticket 24 and is deliberately not here: the
 * two axes have separate bars and separate task lists, and summing them was ruled
 * out by ticket 11.
 *
 *   node compare/30-compare.mjs [store]
 *
 * Reads `data/extract/`, writes one report per store page into `data/reports/`.
 * This is also the unit the re-check service calls (ticket 10).
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FindingCollector, summarise } from './findings.mjs';
import { compareImages } from './images.mjs';
import { compareLinks } from './links.mjs';
import { diffRows, textFindings } from './text.mjs';

const EXTRACTS = new URL('../data/extract/', import.meta.url);
const REPORTS = new URL('../data/reports/', import.meta.url);
const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);
const LINK_STATUS = new URL('../data/link-status.json', import.meta.url);

/**
 * Ticket 07: the compare stage gates on `status === 200`, because a 404 page
 * still extracts — the 404 page has a `<main>`. Without the gate, the 42 NL pages
 * that answer 404 on production would each produce a wall of `structure`
 * findings that no editor can act on.
 *
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @returns {string | null} The reason it cannot be compared, or `null`.
 */
export function skipReason(production, next) {
  if (production.status !== 200 && next.status !== 200) {
    return `Neither side answers 200 (production ${production.status}, new ${next.status}).`;
  }
  if (production.status !== 200) {
    return `Production answers ${production.status}. The page exists only on the new site.`;
  }
  if (next.status !== 200) {
    return `The new site answers ${next.status}. The page has not been migrated.`;
  }
  return null;
}

/**
 * @param {object} input
 * @param {{ production: import('./contract.mjs').PageExtract, new: import('./contract.mjs').PageExtract }} input.sides
 * @param {Set<string>} [input.newSitePaths]
 * @param {Map<string, { status: number, hops: number }>} [input.statuses]
 * @returns {import('./contract.mjs').PageReport}
 */
export function comparePage({ sides, newSitePaths, statuses }) {
  const { production, new: next } = sides;
  const scope = { store: production.store, page: production.page };
  const reason = skipReason(production, next);

  if (reason) {
    return {
      ...scope,
      sides,
      comparable: false,
      skipReason: reason,
      findings: [],
      rows: [],
      summary: summarise([]),
      builtAt: new Date().toISOString(),
    };
  }

  const collector = new FindingCollector(scope);
  const aligned = diffRows(production, next);
  textFindings(aligned, collector);
  compareLinks({ production, new: next, collector, newSitePaths, statuses });
  compareImages(production, next, collector);

  const findings = collector.all();
  return {
    ...scope,
    sides,
    comparable: true,
    skipReason: null,
    findings,
    rows: aligned.map((row) => ({
      class: row.class,
      prod: row.prod ? row.prod.index : null,
      new: row.new ? row.new.index : null,
      score: row.score,
    })),
    summary: summarise(findings),
    builtAt: new Date().toISOString(),
  };
}

/**
 * `leakage` needs to know which live-domain paths exist as a page on the new
 * site. The seed file is the answer and needs no network: it already holds one
 * `newUrl` per store page.
 *
 * @param {any} seeds
 * @param {string} store
 * @returns {Set<string>}
 */
export function newSitePathsFor(seeds, store) {
  const paths = new Set();
  for (const row of seeds.rows) {
    const cell = row.stores?.[store];
    if (!cell?.newUrl) continue;
    paths.add(new URL(cell.newUrl).pathname.toLowerCase().replace(/\/+$/, ''));
  }
  return paths;
}

/**
 * @param {URL} dir
 * @returns {Promise<string[]>}
 */
async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...await jsonFiles(new URL(`${entry.name}/`, dir)));
    else if (entry.name.endsWith('.json')) out.push(fileURLToPath(new URL(entry.name, dir)));
  }
  return out;
}

/**
 * A page key can hold a slash (`faq/productinformatie`), and the report folder is
 * flat because `web/` reads it with one non-recursive listing. The store and the
 * page live inside the JSON, so the filename is storage and nothing else.
 *
 * @param {string} store
 * @param {string} page
 */
export function reportFilename(store, page) {
  return `${store}__${page.replaceAll('/', '__')}.json`;
}

/**
 * @param {URL} url
 * @returns {Promise<any | null>}
 */
async function readJson(url) {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch (error) {
    if (/** @type {any} */ (error).code === 'ENOENT') return null;
    throw error;
  }
}

if (process.argv[1]?.endsWith('30-compare.mjs')) {
  const only = process.argv[2];
  const seeds = await readJson(SEEDS);
  if (!seeds) throw new Error('No data/10-store-seeds.json. Run crawl/10-store-seeds.mjs first.');

  const rawStatuses = await readJson(LINK_STATUS);
  const statuses = rawStatuses ? new Map(Object.entries(rawStatuses)) : undefined;
  if (!statuses) {
    console.warn(
      'No data/link-status.json: broken-link and redirect are not checked. '
      + 'Run compare/link-status.mjs to add them.',
    );
  }

  /** @type {Map<string, Set<string>>} */
  const pathsByStore = new Map();
  await mkdir(fileURLToPath(REPORTS), { recursive: true });

  const files = await jsonFiles(only ? new URL(`${only}/`, EXTRACTS) : EXTRACTS);
  let comparable = 0;
  let findings = 0;
  let shown = 0;

  for (const file of files) {
    const sides = JSON.parse(await readFile(file, 'utf8'));
    const store = sides.production.store;
    if (!pathsByStore.has(store)) pathsByStore.set(store, newSitePathsFor(seeds, store));

    const report = comparePage({ sides, newSitePaths: pathsByStore.get(store), statuses });
    await writeFile(
      new URL(reportFilename(report.store, report.page), REPORTS),
      JSON.stringify(report),
    );

    if (report.comparable) comparable += 1;
    findings += report.summary.total;
    shown += report.summary.shown;
  }

  console.log(
    `${files.length} pages, ${comparable} comparable, `
    + `${findings} findings of which ${shown} shown by default.`,
  );
  console.log(`wrote ${fileURLToPath(REPORTS)}`);
}
