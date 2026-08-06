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
 * The tally itself is `summariseReports()` in `findings.mjs`, beside the tally over
 * findings. This file is the command that prints it, and holds no rule of its own.
 */

import { readdir, readFile } from 'node:fs/promises';

import { FINDING_CLASSES } from './contract.mjs';
import { summariseReports } from './findings.mjs';

const REPORTS = new URL('../data/reports/', import.meta.url);

const only = process.argv[2];
const names = (await readdir(REPORTS)).filter((name) => name.endsWith('.json'));
const reports = [];
for (const name of names) {
  const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
  if (only && report.store !== only) continue;
  reports.push(report);
}

const result = summariseReports(reports);

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
  const visibility = FINDING_CLASSES[cls]?.shown ? 'shown ' : 'hidden';
  const share = result.findings ? ((count / result.findings) * 100).toFixed(1) : '0.0';
  console.log(`  ${String(count).padStart(6)}  ${share.padStart(5)}%  ${visibility}  ${cls}`);
}
