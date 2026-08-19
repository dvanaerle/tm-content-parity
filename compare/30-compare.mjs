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

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { unanchoredStore } from '../shared/page-key.mjs';
import {
  findingSetHash,
  newObservationId,
  observationForRun,
  reportFilename,
} from './contract.mjs';
import { FindingCollector, summarise } from './findings.mjs';
import { compareImages } from './images.mjs';
import { compareLinks } from './links.mjs';
import { CoverageTally, coverageDelta, coverageLines } from './region-coverage.mjs';
import { nextRunLog, readRunLog, RUN_LOG, writeRunLog } from './run-log.mjs';
import { diffRows, textFindings } from './text.mjs';

const EXTRACTS = new URL('../data/extract/', import.meta.url);
const REPORTS = new URL('../data/reports/', import.meta.url);
const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);
const LINK_STATUS = new URL('../data/link-status.json', import.meta.url);
const SNAPSHOT = new URL('../data/snapshot.json', import.meta.url);

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
 * What production's **sitemap metadata** says about the page, rather than what
 * either page holds.
 *
 * An unanchored page has no `nl-NL` alternate, so production never says which
 * Dutch page is its counterpart. That is a defect of the metadata and not a
 * content difference, and `CONTEXT.md` insists the two are not named as one: the
 * page is comparable on axis A, which needs no Dutch page, and it is absent from
 * axis B by definition.
 *
 * It is emitted whether or not the page is comparable, because the alternate is
 * missing either way. **No view states it yet.** `Ledger.jsx` renders the "not
 * comparable" panel before any finding, so on a one-sided page nothing shows it,
 * and on a comparable page it sits behind the diagnostics control. The record has
 * to exist before a view can read it; tickets 20 and 56 own that surface.
 *
 * @param {{ store: import('./contract.mjs').Store, page: string }} scope
 * @param {FindingCollector} collector
 */
export function metadataFindings(scope, collector) {
  if (!unanchoredStore(scope.page)) return;
  collector.add({ class: 'no-declared-alternate', prod: null, new: null });
}

/**
 * @param {object} input
 * @param {{ production: import('./contract.mjs').PageExtract, new: import('./contract.mjs').PageExtract }} input.sides
 * @param {Set<string>} [input.newSitePaths]
 * @param {Map<string, { status: number, hops: number }>} [input.statuses]
 * @param {string} [input.observationId]  One per run. The batch below passes one id for
 *                                        the whole build; the re-check service passes one
 *                                        per request.
 * @returns {import('./contract.mjs').PageReport}
 */
export function comparePage({ sides, newSitePaths, statuses, observationId = newObservationId() }) {
  const { production, new: next } = sides;
  const scope = { store: production.store, page: production.page };
  const reason = skipReason(production, next);

  if (reason) {
    const collector = new FindingCollector(scope);
    metadataFindings(scope, collector);
    const metadata = collector.all();
    return {
      ...scope,
      sides,
      comparable: false,
      skipReason: reason,
      findings: metadata,
      rows: [],
      summary: summarise(metadata),
      observationId,
      findingSetHash: findingSetHash(metadata),
      builtAt: new Date().toISOString(),
    };
  }

  const collector = new FindingCollector(scope);
  metadataFindings(scope, collector);
  const aligned = diffRows(production, next);
  textFindings(aligned, collector);
  compareLinks({ production, new: next, collector, newSitePaths, statuses });
  compareImages(production, next, collector);

  const findings = collector.all();
  // Ticket 34: a `DiffRow` holds the position in the `elements` array, and the
  // shared document-order counter is no longer that number — it runs over images
  // and links too. The browser reads the unit back with `elements[row.prod]`.
  const prodAt = positionsIn(production.elements);
  const newAt = positionsIn(next.elements);

  return {
    ...scope,
    sides,
    comparable: true,
    skipReason: null,
    findings,
    rows: aligned.map((row) => wireRow(row, prodAt, newAt)),
    summary: summarise(findings),
    observationId,
    findingSetHash: findingSetHash(findings),
    builtAt: new Date().toISOString(),
  };
}

/**
 * One aligned row as the report carries it: the units reduced to their position in each
 * side's `elements` array, which is what the browser reads them back with.
 *
 * @param {import('./text.mjs').AlignedRow} row
 * @param {Map<import('./contract.mjs').ContentUnit, number>} prodAt
 * @param {Map<import('./contract.mjs').ContentUnit, number>} newAt
 * @returns {import('./contract.mjs').DiffRow}
 */
function wireRow(row, prodAt, newAt) {
  const wire = {
    class: row.class,
    prod: row.prod ? prodAt.get(row.prod) : null,
    new: row.new ? newAt.get(row.new) : null,
    score: row.score,
    finding: row.finding ?? null,
  };
  // Tickets 116 and 120: written on a `regrouped` row and on no other, and one of the two at
  // most, so the key is absent rather than null on the 30-odd thousand rows that hold no run.
  // See `DiffRow`.
  if (row.prodRun) wire.prodRun = row.prodRun.map((unit) => prodAt.get(unit));
  if (row.newRun) wire.newRun = row.newRun.map((unit) => newAt.get(unit));
  return wire;
}

/**
 * @param {import('./contract.mjs').ContentUnit[]} units
 * @returns {Map<import('./contract.mjs').ContentUnit, number>}
 */
function positionsIn(units) {
  return new Map(units.map((unit, at) => [unit, at]));
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
    if (entry.isDirectory()) out.push(...(await jsonFiles(new URL(`${entry.name}/`, dir))));
    else if (entry.name.endsWith('.json')) out.push(fileURLToPath(new URL(entry.name, dir)));
  }
  return out;
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

/**
 * The newest modification time among the files, as an ISO 8601 stamp, or `''` for none.
 *
 * A file is written after the fetch it records, so this is at or after the newest
 * `fetchedAt` in the corpus — the upper bound `observationForRun()` asks for, and it costs
 * one `stat()` per page instead of parsing 33 MB of extracts a second time for one date.
 *
 * @param {string[]} files
 * @returns {Promise<string>}
 */
async function newestWrite(files) {
  const times = await Promise.all(files.map(async (file) => (await stat(file)).mtimeMs));
  return times.length ? new Date(Math.max(...times)).toISOString() : '';
}

if (process.argv[1]?.endsWith('30-compare.mjs')) {
  const only = process.argv[2];
  const seeds = await readJson(SEEDS);
  if (!seeds) throw new Error('No data/10-store-seeds.json. Run crawl/10-store-seeds.mjs first.');

  const rawStatuses = await readJson(LINK_STATUS);
  const statuses = rawStatuses ? new Map(Object.entries(rawStatuses)) : undefined;
  if (!statuses) {
    console.warn(
      'No data/link-status.json: broken-link and redirect are not checked. ' +
        'Run compare/link-status.mjs to add them.',
    );
  }

  /** @type {Map<string, Set<string>>} */
  const pathsByStore = new Map();
  await mkdir(fileURLToPath(REPORTS), { recursive: true });

  // Read before the write below overwrites it. This is the only copy of the
  // previous run's excluded-region coverage.
  const previous = await readJson(SNAPSHOT);

  // The index the run log leaves behind is keyed on the finding id, and the ids of this
  // run do not exist until the loop below has run. So it is read here and written after.
  const previousLog = await readRunLog();

  const files = await jsonFiles(only ? new URL(`${only}/`, EXTRACTS) : EXTRACTS);

  // One build is one observation, so every report of this run carries the same id — and a
  // run that re-compares extracts nobody re-fetched carries the **previous** run's, so
  // that changing a rule cannot contradict a fix claim. `observationForRun()` is the rule
  // and says why the bound is a modification time rather than a `fetchedAt`.
  const observationId = observationForRun({
    previous: previousLog?.observationId ?? '',
    crawledAt: await newestWrite(files),
  });

  const coverage = new CoverageTally();
  /** @type {import('./contract.mjs').FindingRef[]} */
  const snapshot = [];
  /** @type {Set<string>} */
  const covered = new Set();
  let comparable = 0;
  let findings = 0;
  let work = 0;

  for (const file of files) {
    const sides = JSON.parse(await readFile(file, 'utf8'));
    const store = sides.production.store;
    if (!pathsByStore.has(store)) pathsByStore.set(store, newSitePathsFor(seeds, store));

    coverage.addPage({
      production: sides.production.diagnostics?.regionsExcluded,
      new: sides.new.diagnostics?.regionsExcluded,
    });

    const report = comparePage({
      sides,
      newSitePaths: pathsByStore.get(store),
      statuses,
      observationId,
    });
    await writeFile(
      new URL(reportFilename(report.store, report.page), REPORTS),
      JSON.stringify(report),
    );

    // The stores this run actually looked at, taken from the reports rather than from the
    // argument: `only` is absent on a full run, and *not looked at* is what the index has
    // to tell apart from *gone*.
    covered.add(report.store);
    for (const finding of report.findings) {
      snapshot.push({
        id: finding.id,
        store: finding.store,
        page: finding.page,
        class: finding.class,
      });
    }

    if (report.comparable) comparable += 1;
    findings += report.summary.total;
    work += report.summary.work;
  }

  // `regions` is what the next run compares against, so it is written whether or
  // not this run could compare itself with the run before.
  const current = { store: only ?? null, regions: coverage.all() };
  const regionsChanged = coverageDelta(previous, current);

  await writeFile(
    SNAPSHOT,
    JSON.stringify(
      {
        observationId,
        builtAt: new Date().toISOString(),
        store: current.store,
        pages: files.length,
        comparable,
        findings,
        work,
        regions: current.regions,
        regionsChanged,
      },
      null,
      2,
    ),
  );

  // After the reports and after the snapshot, because a run that aborts before here must
  // leave the previous index whole rather than half a run's worth of first-seen dates.
  const runLog = nextRunLog({
    previous: previousLog,
    snapshot,
    observationId,
    covered: [...covered],
  });
  await writeRunLog(runLog);

  console.log(
    `${files.length} pages, ${comparable} comparable, ` +
      `${findings} findings of which ${work} count as work.`,
  );
  // Ticket 64: an entry that stopped matching is one line, and it is here rather
  // than 2,600 rows down in the report.
  for (const line of coverageLines(regionsChanged)) console.log(`region coverage: ${line}`);
  console.log(
    `observation ${observationId}` +
      (observationId === previousLog?.observationId
        ? ' — carried over, nothing crawled since it, so no fix claim is contradicted'
        : ''),
  );
  console.log(
    `run log: ${runLog.rows.length} ids, ` +
      `${runLog.rows.filter((row) => !row.seen).length} no longer seen ` +
      `(${fileURLToPath(RUN_LOG)})`,
  );
  console.log(`wrote ${fileURLToPath(REPORTS)}`);
}
