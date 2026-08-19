/**
 * A full crawl of one store: every seed page, both sides, into `data/extract/`.
 *
 *   node crawl/21-crawl-store.mjs <store> [--force]
 *
 * `20-extract.mjs` is the unit and it is not re-implemented here; this file only
 * decides the order, the concurrency and what to do with a failure.
 *
 * Ticket 04: production can be in maintenance mode with no warning, and a run
 * that records the maintenance page records phantom defects on every page. So a
 * `MaintenanceError` **aborts the whole run**. Any other failure is recorded
 * against its page and the run continues, because one broken page must not cost
 * the other 180.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exclusionReason, isExcludedPage } from '../shared/excluded-pages.mjs';
import { cellWithBothSides } from '../shared/seed-rows.mjs';
import { MaintenanceError } from './fetch-page.mjs';
import { extractStorePage } from './20-extract.mjs';

const CONCURRENCY = 6;
const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);
const EXTRACTS = new URL('../data/extract/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);

/**
 * The failure log is per store. One fixed filename made every run erase the
 * record of the store before it, so the six stores hold one record between them
 * and the last run wins.
 *
 * @param {string} store
 */
export function failuresFilename(store) {
  return `extract-failures-${store}.json`;
}

/**
 * One store's crawl. Every boundary it crosses — the seed file, the network, and
 * the two directories it writes — is an argument with a default, so a test can
 * drive a whole run without a network or the committed corpus.
 *
 * @param {object} input
 * @param {string} input.store
 * @param {boolean} [input.force] Re-extract a page that already has an extract on disk.
 * @param {{ rows: any[] } | null} [input.seeds] Defaults to `data/10-store-seeds.json`.
 * @param {typeof extractStorePage} [input.extract]
 * @param {URL} [input.extracts] Directory of one file per page, both sides.
 * @param {URL} [input.failuresDir]
 * @returns {Promise<{ aborted: MaintenanceError | null, jobs: number, written: number, failures: Array<{ page: string, error: string }> }>}
 */
export async function crawlStore({
  store,
  force = false,
  seeds,
  extract = extractStorePage,
  extracts = EXTRACTS,
  failuresDir = DATA,
}) {
  const rows = (seeds ?? JSON.parse(await readFile(SEEDS, 'utf8'))).rows;
  const jobs = [];
  const skipped = [];

  for (const row of rows) {
    const cell = cellWithBothSides(row, store);
    if (!cell) continue;

    if (isExcludedPage(row.page)) {
      skipped.push({ page: row.page, reason: exclusionReason(row.page) });
      continue;
    }
    jobs.push({ store, page: row.page, prodUrl: cell.prodUrl, newUrl: cell.newUrl });
  }

  console.log(`${store}: ${jobs.length} pages, ${skipped.length} excluded from the log.`);

  /** @type {Array<{ page: string, error: string }>} */
  const failures = [];
  let done = 0;
  let written = 0;
  let aborted = null;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length && !aborted) {
      const job = jobs[cursor];
      cursor += 1;
      const out = new URL(`${store}/${job.page}.json`, extracts);

      try {
        if (!force && (await exists(out))) {
          done += 1;
          continue;
        }
        const sides = await extract(job);
        await mkdir(dirname(fileURLToPath(out)), { recursive: true });
        await writeFile(out, JSON.stringify(sides));
        written += 1;
      } catch (error) {
        if (error instanceof MaintenanceError) {
          aborted = error;
          return;
        }
        failures.push({ page: job.page, error: /** @type {Error} */ (error).message });
      }
      done += 1;
      if (done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // Before the abort below. The log records the run that just happened, and an
  // aborted run is one: leaving the previous run's file on disk makes it describe
  // a run that is no longer the last (ticket 93).
  const failuresFile = new URL(failuresFilename(store), failuresDir);
  await writeFile(
    failuresFile,
    JSON.stringify({ store, at: new Date().toISOString(), failures }, null, 2),
  );

  if (aborted) {
    console.error(`\nABORTED. ${aborted.message}`);
    console.error('Production is in maintenance mode. Every page this run recorded is suspect.');
    return { aborted, jobs: jobs.length, written, failures };
  }

  console.log(
    `\n${written} written, ${jobs.length - failures.length} usable, ${failures.length} failed.`,
  );
  for (const failure of failures.slice(0, 20)) console.log(`  ${failure.page}: ${failure.error}`);
  if (failures.length > 20)
    console.log(`  … and ${failures.length - 20} more, in ${fileURLToPath(failuresFile)}`);

  return { aborted: null, jobs: jobs.length, written, failures };
}

/** @param {URL} url */
async function exists(url) {
  try {
    await stat(url);
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1]?.endsWith('21-crawl-store.mjs')) {
  const [store, ...flags] = process.argv.slice(2);
  if (!store) {
    console.error('usage: node crawl/21-crawl-store.mjs <store> [--force]');
    process.exit(2);
  }
  const { aborted } = await crawlStore({ store, force: flags.includes('--force') });
  if (aborted) process.exit(1);
}
