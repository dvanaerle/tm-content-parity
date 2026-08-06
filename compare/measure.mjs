/**
 * The regression gate: read `data/reports/` and print the numbers the map keeps.
 *
 *   node compare/measure.mjs [store]
 *
 * Spec 32 requires the comparison to be re-measured and written into the map
 * after every phase, and ticket 28 forbids measuring a second change against a
 * baseline the first one already moved. So this reads reports rather than
 * recomputing anything: it measures whatever `30-compare.mjs` last wrote.
 *
 * The median is over **comparable** pages only. A page that cannot be compared
 * carries no findings by design (ticket 07), so counting its zero would drag the
 * median down for a reason that has nothing to do with the rules.
 */

import { readdir, readFile } from 'node:fs/promises';

const REPORTS = new URL('../data/reports/', import.meta.url);

/**
 * @param {number[]} values
 * @returns {number}
 */
export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * @param {import('./contract.mjs').PageReport[]} reports
 */
export function measure(reports) {
  const comparable = reports.filter((report) => report.comparable);
  /** @type {Record<string, number>} */
  const byClass = {};
  let findings = 0;
  let shown = 0;
  let clean = 0;

  for (const report of comparable) {
    findings += report.summary.total;
    shown += report.summary.shown;
    if (report.summary.shown === 0) clean += 1;
    for (const [cls, count] of Object.entries(report.summary.byClass)) {
      byClass[cls] = (byClass[cls] ?? 0) + count;
    }
  }
  return {
    crawled: reports.length,
    comparable: comparable.length,
    findings,
    shown,
    medianShown: median(comparable.map((report) => report.summary.shown)),
    medianTotal: median(comparable.map((report) => report.summary.total)),
    cleanPages: clean,
    byClass,
  };
}

if (process.argv[1]?.endsWith('measure.mjs')) {
  const only = process.argv[2];
  const names = (await readdir(REPORTS)).filter((name) => name.endsWith('.json'));
  const reports = [];
  for (const name of names) {
    const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
    if (only && report.store !== only) continue;
    reports.push(report);
  }

  const result = measure(reports);
  const { FINDING_CLASSES } = await import('./vocabulary.mjs');

  console.log(`store            ${only ?? '(all)'}`);
  console.log(`crawled          ${result.crawled}`);
  console.log(`comparable       ${result.comparable}`);
  console.log(`findings         ${result.findings}`);
  console.log(`shown            ${result.shown}`);
  console.log(`median shown     ${result.medianShown} a page`);
  console.log(`median total     ${result.medianTotal} a page`);
  console.log(`pages with none  ${result.cleanPages}`);
  console.log('\nby class:');

  const rows = Object.entries(result.byClass).sort((a, b) => b[1] - a[1]);
  for (const [cls, count] of rows) {
    const shown = FINDING_CLASSES[cls]?.shown ? 'shown ' : 'hidden';
    const share = result.findings ? ((count / result.findings) * 100).toFixed(1) : '0.0';
    console.log(`  ${String(count).padStart(6)}  ${share.padStart(5)}%  ${shown}  ${cls}`);
  }
}
