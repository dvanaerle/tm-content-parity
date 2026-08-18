/**
 * What the word diff costs the content view, in LCS cells (ticket 68).
 *
 * `crawl/probes/` holds crawl measurements. This measures `web/`, so it lives here.
 * It is evidence and never an import.
 *
 * It counts three states of the same corpus:
 *
 * - **before** — every two-sided row diffed with a full table, which is what the
 *   content view did: it passed no `equal` prop, so two identical strings got a
 *   table, and those rows are the longest on the page.
 * - **equal skipped** — the first saving on its own, so the number is banked before
 *   the trim and the cap touch it.
 * - **after** — the trim and the cap as well. A capped row costs no cell at all.
 *
 * Run it after `compare/30-compare.mjs`:
 *
 *   node web/probes/probe-diff-cost.mjs
 *   node web/probes/probe-diff-cost.mjs nl__privacy-beleid
 */

import { readdir, readFile } from 'node:fs/promises';
import { DIFF_CELL_CAP, diffCost, tokenCount } from '../../compare/worddiff.mjs';

const REPORTS = new URL('../../data/reports/', import.meta.url);

/** @param {number[]} numbers @param {number} share */
function quantile(numbers, share) {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const at = Math.min(sorted.length - 1, Math.floor(share * sorted.length));
  return sorted[at];
}

/** @param {number[]} numbers */
const median = (numbers) => {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

/**
 * One report's rows, measured.
 *
 * @param {object} report
 */
function measure(report) {
  const prodUnits = report.sides.production.elements;
  const newUnits = report.sides.new.elements;

  const page = {
    twoSided: 0,
    equal: 0,
    capped: 0,
    before: 0,
    equalSkipped: 0,
    after: 0,
    /** @type {number[]} */ full: [],
    /** @type {number[]} */ trimmed: [],
    /** @type {number[]} */ tokens: [],
    worstRow: 0,
    cappedClasses: new Set(),
  };

  for (const row of report.rows) {
    if (row.prod === null || row.new === null) continue;
    // Tickets 116 and 120: a `regrouped` row is two-sided and is never word-diffed — the
    // words are identical and only the seams moved. Costing it would price a comparison the
    // view does not run, against a side that is one member of a run.
    if (row.prodRun || row.newRun) continue;
    const prod = prodUnits[row.prod];
    const next = newUnits[row.new];
    if (!prod || !next) continue;

    page.twoSided += 1;

    const full = tokenCount(prod.norm) * tokenCount(next.norm);
    page.full.push(full);
    page.tokens.push(tokenCount(prod.norm), tokenCount(next.norm));
    page.before += full;
    page.worstRow = Math.max(page.worstRow, full);

    const equal = prod.norm === next.norm;
    if (equal) {
      page.equal += 1;
      continue;
    }
    page.equalSkipped += full;

    const cost = diffCost(prod.norm, next.norm);
    page.trimmed.push(cost.cells);
    if (cost.capped) {
      page.capped += 1;
      page.cappedClasses.add(row.class ?? 'gelijk');
      continue;
    }
    page.after += cost.cells;
  }

  return page;
}

const files = (await readdir(REPORTS)).filter((name) => name.endsWith('.json'));
const only = process.argv[2];

const total = {
  reports: 0,
  twoSided: 0,
  equal: 0,
  capped: 0,
  before: 0,
  equalSkipped: 0,
  after: 0,
  /** @type {number[]} */ full: [],
  /** @type {number[]} */ trimmed: [],
  /** @type {number[]} */ tokens: [],
  /** @type {{ file: string, before: number, after: number, rows: number }[]} */ pages: [],
  cappedClasses: new Set(),
};

for (const file of files) {
  if (only && !file.startsWith(only)) continue;
  const report = JSON.parse(await readFile(new URL(file, REPORTS), 'utf8'));
  if (!report.sides?.production?.elements) continue;

  const page = measure(report);
  total.reports += 1;
  total.twoSided += page.twoSided;
  total.equal += page.equal;
  total.capped += page.capped;
  total.before += page.before;
  total.equalSkipped += page.equalSkipped;
  total.after += page.after;
  total.full.push(...page.full);
  total.trimmed.push(...page.trimmed);
  total.tokens.push(...page.tokens);
  for (const cls of page.cappedClasses) total.cappedClasses.add(cls);
  total.pages.push({ file, before: page.before, after: page.after, rows: page.twoSided });
}

const percent = (part, whole) => (whole === 0 ? 0 : Math.round((1 - part / whole) * 1000) / 10);
const thousands = (number) => number.toLocaleString('en-GB');

console.log(
  `\nReports: ${total.reports}. Two-sided rows: ${thousands(total.twoSided)}, of which ${thousands(total.equal)} already equal.`,
);
console.log(
  `Cap: ${thousands(DIFF_CELL_CAP)} cells. It catches ${total.capped} rows (${((100 * total.capped) / Math.max(1, total.twoSided)).toFixed(2)}%), classes: ${[...total.cappedClasses].join(', ') || 'none'}.`,
);

console.log('\nLCS cells over the corpus');
console.log(`  before                 ${thousands(total.before)}`);
console.log(
  `  equal rows skipped     ${thousands(total.equalSkipped)}  (−${percent(total.equalSkipped, total.before)}%)`,
);
console.log(
  `  + trim and cap         ${thousands(total.after)}  (−${percent(total.after, total.before)}% of before)`,
);

console.log('\nn · m for one row, untrimmed');
console.log(
  `  median ${median(total.full)}, p95 ${quantile(total.full, 0.95)}, p99 ${quantile(total.full, 0.99)}, max ${thousands(Math.max(0, ...total.full))}`,
);
console.log('n · m for one row, after the trim — the number the cap reads');
console.log(
  `  median ${median(total.trimmed)}, p95 ${quantile(total.trimmed, 0.95)}, p99 ${quantile(total.trimmed, 0.99)}, max ${thousands(Math.max(0, ...total.trimmed))}`,
);
console.log('tokens, one side');
console.log(
  `  median ${median(total.tokens)}, p95 ${quantile(total.tokens, 0.95)}, p99 ${quantile(total.tokens, 0.99)}, max ${thousands(Math.max(0, ...total.tokens))}`,
);

console.log('\nThe five worst pages before, and what they cost after');
for (const page of total.pages.sort((a, b) => b.before - a.before).slice(0, 5)) {
  console.log(
    `  ${page.file.replace('.json', '').padEnd(46)} ${thousands(page.before).padStart(10)} → ${thousands(page.after).padStart(8)}  (−${percent(page.after, page.before)}%, ${page.rows} rows)`,
  );
}
console.log();
