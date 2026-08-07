/**
 * THROWAWAY probe, kept as evidence. Ticket 64.
 *
 * `probe-promo-banner.mjs` answers what the selector matches, on three pages and
 * four controls. This one answers the number the ticket is about: **how many
 * findings the banner makes across the whole corpus, and how many leave.**
 *
 *   node crawl/probes/probe-promo-banner-corpus.mjs
 *
 * It measures the whole seed list, in every store, and it reports each store
 * separately. It does **not** re-crawl: nothing under `data/` is written except
 * this probe's own result. A re-crawl detaches overrides, which is ticket 67.
 *
 * The 7.7% in the ticket was 2,698 of 34,910, and ticket 62 took the corpus to
 * 34,559. Neither the count nor the share carries over, so both are measured here.
 *
 * Do not import this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { ABSOLUTE_MAX_UNITS, EXCLUDED_REGIONS } from '../../shared/excluded-regions.mjs';
import { comparePage, newSitePathsFor } from '../../compare/30-compare.mjs';
import { cellWithBothSides } from '../seed-rows.mjs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';
import { isExcludedPage } from '../excluded-pages.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const LINK_STATUS = new URL('../../data/link-status.json', import.meta.url);
const OUT = new URL('../../data/probe-promo-banner-corpus.json', import.meta.url);

const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];
const CONCURRENCY = 6;

/** The committed banner entry, at the ceiling, so a wide match measures instead of throwing. */
const BANNER = EXCLUDED_REGIONS
  .filter((entry) => entry.kind === 'legacy-only')
  .map((entry) => ({ ...entry, maxUnits: ABSOLUTE_MAX_UNITS }));

if (BANNER.length !== 1) throw new Error(`Expected one legacy-only entry, found ${BANNER.length}.`);

const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));

/**
 * The real statuses, so `broken-link` and `redirect` are counted the way the
 * report counts them. Without them the corpus total here would not be the corpus
 * total the log shows.
 */
const statuses = new Map(Object.entries(JSON.parse(await readFile(LINK_STATUS, 'utf8'))));

/** @type {Map<string, Set<string>>} */
const pathsByStore = new Map(STORES.map((store) => [store, newSitePathsFor(seeds, store)]));

/** @type {{store: string, page: string, prodUrl: string, newUrl: string}[]} */
const jobs = [];
for (const row of seeds.rows) {
  if (isExcludedPage(row.page)) continue;
  for (const store of STORES) {
    const cell = cellWithBothSides(row, store);
    if (cell) jobs.push({ store, page: row.page, prodUrl: cell.prodUrl, newUrl: cell.newUrl });
  }
}

console.log(`${jobs.length} store pages, ${STORES.length} stores.\n`);

/** @param {typeof jobs[number]} job */
async function run(job) {
  const hosts = { prodHost: new URL(job.prodUrl).host, newHost: new URL(job.newUrl).host };

  const measure = async (side, url) => {
    const response = await fetchPage(url);
    const context = {
      store: job.store, page: job.page, side, url, status: response.status, onWarn: () => {}, ...hosts,
    };
    return {
      kept: extractPage(response.html, { ...context, excludedRegions: [] }),
      cut: extractPage(response.html, { ...context, excludedRegions: BANNER }),
    };
  };

  const [production, next] = await Promise.all([
    measure('production', job.prodUrl),
    measure('new', job.newUrl),
  ]);

  const compare = (a, b) => comparePage({
    sides: { production: a, new: b },
    newSitePaths: pathsByStore.get(job.store),
    statuses,
  });
  const before = compare(production.kept, next.kept);
  const after = compare(production.cut, next.cut);

  const beforeIds = new Set(before.findings.map((f) => f.id));
  const afterIds = new Set(after.findings.map((f) => f.id));
  const gone = before.findings.filter((f) => !afterIds.has(f.id));
  const appeared = after.findings.filter((f) => !beforeIds.has(f.id));
  const region = production.cut.diagnostics.regionsExcluded[0];

  return {
    store: job.store,
    page: job.page,
    comparable: before.comparable,
    matches: region?.matches ?? 0,
    unitsRemoved: region?.units ?? 0,
    findingsBefore: before.findings.length,
    findingsAfter: after.findings.length,
    shownBefore: before.summary.shown,
    shownAfter: after.summary.shown,
    goneByClass: countBy(gone),
    appearedByClass: countBy(appeared),
    appearedRows: appeared.map((f) => ({ class: f.class, prod: f.prod, new: f.new })),
  };
}

/** @param {{class: string}[]} findings */
function countBy(findings) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const finding of findings) out[finding.class] = (out[finding.class] ?? 0) + 1;
  return out;
}

/** A small pool: 448 pages against production, and production is a live shop. */
const rows = [];
let done = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const job = queue.shift();
    try {
      rows.push(await run(job));
    } catch (error) {
      rows.push({ store: job.store, page: job.page, error: `${error.name}: ${error.message}` });
    }
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
  }
}));

// --- The tables the ticket asks for ---------------------------------------
const ok = rows.filter((row) => !row.error);
const failed = rows.filter((row) => row.error);

const sum = (list, key) => list.reduce((total, row) => total + (row[key] ?? 0), 0);
const total = (list) => ({
  pages: list.length,
  comparable: list.filter((row) => row.comparable).length,
  pagesWithBanner: list.filter((row) => row.matches > 0).length,
  findingsBefore: sum(list, 'findingsBefore'),
  findingsAfter: sum(list, 'findingsAfter'),
  shownBefore: sum(list, 'shownBefore'),
  shownAfter: sum(list, 'shownAfter'),
  gone: sum(list, 'findingsBefore') - sum(list, 'findingsAfter'),
  appeared: list.reduce((n, row) => n + Object.values(row.appearedByClass ?? {}).reduce((a, b) => a + b, 0), 0),
});

const corpus = total(ok);
const byStore = Object.fromEntries(STORES.map((store) => [store, total(ok.filter((row) => row.store === store))]));

const goneByClass = {};
for (const row of ok) {
  for (const [cls, n] of Object.entries(row.goneByClass ?? {})) goneByClass[cls] = (goneByClass[cls] ?? 0) + n;
}

console.log(`\ncorpus: ${corpus.pages} pages, ${corpus.comparable} comparable, `
  + `banner on ${corpus.pagesWithBanner}.`);
console.log(`findings ${corpus.findingsBefore} → ${corpus.findingsAfter} `
  + `(${corpus.gone} gone, ${(100 * corpus.gone / corpus.findingsBefore).toFixed(1)}%), `
  + `shown ${corpus.shownBefore} → ${corpus.shownAfter}.`);
console.log(`appeared: ${corpus.appeared}`);

console.log('\nby store:');
for (const store of STORES) {
  const t = byStore[store];
  console.log(
    `  ${store.padEnd(6)} pages=${String(t.pages).padStart(3)} banner=${String(t.pagesWithBanner).padStart(3)} `
    + `findings ${String(t.findingsBefore).padStart(6)} → ${String(t.findingsAfter).padStart(6)} `
    + `(${String(t.gone).padStart(5)} gone) appeared=${t.appeared}`
  );
}

console.log('\ngone by class:');
for (const [cls, n] of Object.entries(goneByClass).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cls.padEnd(16)} ${n}`);
}

const wideMatch = ok.filter((row) => row.matches > 0 && row.matches !== 2);
console.log(`\npages where the banner did not match exactly twice: ${wideMatch.length}`);
for (const row of wideMatch.slice(0, 20)) console.log(`  ${row.store} ${row.page} matches=${row.matches}`);

const withAppeared = ok.filter((row) => row.appeared > 0 || Object.keys(row.appearedByClass ?? {}).length);
console.log(`pages where a finding appeared: ${withAppeared.length}`);
for (const row of withAppeared.slice(0, 20)) {
  console.log(`  ${row.store} ${row.page}`, JSON.stringify(row.appearedRows));
}

console.log(`\nfetch failures: ${failed.length}`);
for (const row of failed.slice(0, 20)) console.log(`  ${row.store} ${row.page} — ${row.error.slice(0, 100)}`);

await writeFile(OUT, JSON.stringify({
  selector: BANNER[0].selector, at: new Date().toISOString(), corpus, byStore, goneByClass, rows,
}, null, 2));
console.log(`\nwrote ${OUT.pathname}`);
