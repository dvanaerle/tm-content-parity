// THROWAWAY probe for ticket 70 — how much of the log is one authored block
// counted many times, and whether the log already folds it.
//
// `crawl/probes/` holds crawl measurements. This fetches nothing, and its decisive
// section measures `repeatsInStore()`, so it lives here — the placement rule is
// `probe-search-index.mjs`'s, next to it.
//
// Ticket 70's remaining half claims that a shared element — a block authored once
// and loaded on every page it is put on — arrives as one finding per page, so the
// roll-up counts one edit many times and "one fix closes many findings that nobody
// can see are the same thing". The ticket forbids building on that claim before it
// is measured, and it asks for two numbers that decide the roadmap:
//
//   1. what share of differing units is shared across pages — if the share is
//      small, the identity half is not worth building, and
//   2. whether *most* findings are shared-block findings, in which case the ticket
//      says stop, because that reorders the roadmap.
//
// ADR 0003 is the other caller. It listed "a content hash over regions across the
// corpus" as **not rejected — deferred to ticket 70**, needing "a corpus-wide pass
// and a measurement that waits for the new environment". This is that pass.
//
// It prints three sections, in the order the argument runs:
//
//   1. **the content key** — every finding keyed by its content rather than its
//      page: the check, the class, the two normalised sides and the detail. Two
//      pages carrying the same authored block land on one key. Per store, because a
//      page key is store-scoped and a block authored once in `nl` is a different
//      authored block from its `de` translation;
//   2. **what recurs** — a shared *block* and a shared *label* are not the same
//      claim, and the headline share does not distinguish them. Content of 60
//      characters or more counts as a block, which is ticket 138's cut, used here so
//      the two measurements can be read against each other;
//   3. **the fold that already exists** — `repeatsInStore()`, over the same corpus.
//      That is the question the first two sections turn out to serve: if the log
//      already groups a difference across pages, the ticket's complaint is about a
//      surface that shipped.
//
// **Section 1 is not an upper bound on section 3, and an earlier draft of this
// header said it was.** The content key here is *finer* than the shipped fold in two
// ways: it carries `check`, and it never crosses a store. `repeatsInStore()` carries
// neither term, so it folds strictly coarser and reaches further. The two sections
// answer different questions — how much content recurs at all, and how much the log
// already folds — and neither bounds the other.
//
// It is also finer than the finding id, which keys on `rule` as well. Two findings
// on one page that differ only in `rule` collapse to one key here, which can only
// *under*-count how much is shared. Small, and in the direction that argues against
// the ticket rather than for it.
//
// It needs no network and no Supabase: `data/reports/` holds the findings, and every
// key is a pure function of them. That matters, because the ticket's last box says
// the new environment answered HTTP 500 on all six hosts. It has since answered: the
// corpus this reads was built 2026-08-17, and the probe prints the vintage so the
// numbers cannot be quoted without their date.
//
// **A failed read is never zero.** Any failure exits non-zero with the reason.
//
//   node web/probes/probe-shared-regions.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
// `web/` reading `compare/` is the direction ADR 0001's arrow points, so these are
// ordinary imports and not a probe's exemption. They are the crown jewels rather
// than copies: `storeOfFile()` is ticket 60's rule for which store a report name
// belongs to, `isWork()` is ticket 118's rule for which classes reach the roll-up,
// and `repeatsInStore()` is ticket 81's grouping — the subject of section 3. Copying
// that last one here would let the probe agree with a version of the rule that does
// not exist, which is the whole of what section 3 is asked to establish.
import { storeOfFile } from '../../compare/contract.mjs';
import { isWork } from '../../compare/vocabulary.mjs';
import { repeatsInStore } from '../src/lib/view.mjs';

const ROOT = new URL('../../', import.meta.url);
const REPORTS = new URL('data/reports/', ROOT);
const OUT = new URL('data/probe-shared-regions.json', ROOT);

/** Ticket 138's cut between a block of prose and a label. */
const BLOCK_MIN_CHARS = 60;

/**
 * The depth buckets, as one table. The label and the bound are written once
 * together, so a rename cannot decay away from the boundary it names.
 *
 * @type {ReadonlyArray<{ upTo: number, label: string }>}
 */
const DEPTHS = [
  { upTo: 1, label: '1' },
  { upTo: 2, label: '2' },
  { upTo: 5, label: '3-5' },
  { upTo: 10, label: '6-10' },
  { upTo: 25, label: '11-25' },
  { upTo: Infinity, label: '25+' },
];

/** @param {number} pages */
const depthOf = (pages) => DEPTHS.find((depth) => pages <= depth.upTo)?.label ?? '25+';

/**
 * How many pages a list of things-with-pages covers.
 *
 * One content key on N pages is N findings, because the count loop below adds one
 * page per report and a report is one page. So this is a finding count wherever the
 * list holds content keys.
 *
 * @param {ReadonlyArray<{ pages: Set<string> }>} list
 */
const pagesIn = (list) => list.reduce((total, entry) => total + entry.pages.size, 0);

/**
 * The depth histogram for anything that knows how many pages it spans.
 *
 * @param {ReadonlyArray<unknown>} items
 * @param {(item: any) => number} pagesOf
 * @param {(item: any) => number} weightOf  What one item contributes.
 * @returns {Record<string, number>}
 */
function byDepth(items, pagesOf, weightOf) {
  /** @type {Record<string, number>} */
  const tally = {};
  for (const item of items) {
    const label = depthOf(pagesOf(item));
    tally[label] = (tally[label] ?? 0) + weightOf(item);
  }
  return tally;
}

/** @param {number} part @param {number} whole */
const pct = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10);

/**
 * The finding id minus store, page and `rule`: what describes the **content**, and
 * nothing that says where it was found.
 *
 * @param {object} finding
 * @returns {string}
 */
function contentKey(finding) {
  return createHash('sha256')
    .update(
      JSON.stringify([finding.check, finding.class, finding.prod, finding.new, finding.detail]),
    )
    .digest('base64url')
    .slice(0, 16);
}

async function readReports() {
  const names = (await readdir(REPORTS)).filter((name) => name.endsWith('.json'));
  if (names.length === 0) throw new Error(`${REPORTS.pathname} holds no reports.`);

  const reports = [];
  for (const name of names) {
    const store = storeOfFile(name);
    if (!store) throw new Error(`${name}: no store claims this report name.`);
    const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
    reports.push({ name, store, report });
  }
  return reports;
}

const reports = await readReports();
const comparable = reports.filter(({ report }) => report.comparable);
if (comparable.length === 0) throw new Error('No comparable report. There is nothing to measure.');

const vintage = comparable
  .map(({ report }) => report.builtAt)
  .filter(Boolean)
  .sort();

// ---- 1. the content key

/** @type {Map<string, { store: string, pages: Set<string>, units: number, work: boolean, class: string, check: string, prod: string | null, new: string | null }>} */
const byContent = new Map();

let findings = 0;
let units = 0;

for (const { store, report } of comparable) {
  for (const finding of report.findings ?? []) {
    // A finding is grouped, so one finding is not one unit: `occurrences` says how
    // many positions on this page carry it. The roll-up the ticket complains about
    // sums findings, and the "differing units" the ticket asks about are positions,
    // so both are counted.
    const occurrences = finding.occurrences ?? 1;
    findings += 1;
    units += occurrences;

    const key = `${store}|${contentKey(finding)}`;
    const seen = byContent.get(key);
    if (seen) {
      seen.pages.add(report.page);
      seen.units += occurrences;
      continue;
    }
    byContent.set(key, {
      store,
      pages: new Set([report.page]),
      units: occurrences,
      work: isWork(finding.class),
      class: finding.class,
      check: finding.check,
      prod: finding.prod,
      new: finding.new,
    });
  }
}

const entries = [...byContent.values()];
const shared = entries.filter((entry) => entry.pages.size > 1);

const sharedFindings = pagesIn(shared);
const sharedUnits = shared.reduce((total, entry) => total + entry.units, 0);
const workFindings = pagesIn(entries.filter((entry) => entry.work));
const sharedWork = pagesIn(shared.filter((entry) => entry.work));

/** @param {(entry: typeof entries[number]) => string} of */
const tally = (of) => {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const entry of shared) counts[of(entry)] = (counts[of(entry)] ?? 0) + entry.pages.size;
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
};

// ---- 2. what recurs

const lengthOf = (entry) => Math.max((entry.prod ?? '').length, (entry.new ?? '').length);
const hasNoContent = (entry) => entry.prod === null && entry.new === null;

const pageLevel = shared.filter(hasNoContent);
const blocks = shared.filter((entry) => !hasNoContent(entry) && lengthOf(entry) >= BLOCK_MIN_CHARS);
const labels = shared.filter((entry) => !hasNoContent(entry) && lengthOf(entry) < BLOCK_MIN_CHARS);

const deepestBlocks = [...blocks].sort((a, b) => b.pages.size - a.pages.size);
const deepestShared = [...shared].sort((a, b) => b.pages.size - a.pages.size);

// ---- 3. the fold that already exists
//
// `loadSummaries()` keeps the `work` classes only before the dashboard groups them,
// so the probe filters the same way. Anything else would measure a list the surface
// never builds.

const workPages = comparable.map(({ store, report }) => ({
  store,
  page: report.page,
  findings: (report.findings ?? []).filter((finding) => isWork(finding.class)),
}));
const repeats = repeatsInStore(workPages);
const multiPage = repeats.filter((repeat) => repeat.on.length > 1);

// ---- the report

const result = {
  measuredAt: new Date().toISOString(),
  corpus: {
    reports: reports.length,
    comparable: comparable.length,
    builtAt: { earliest: vintage[0] ?? null, latest: vintage.at(-1) ?? null },
  },
  contentKey: {
    findings,
    units,
    distinctKeys: entries.length,
    sharedFindings,
    sharedFindingsPct: pct(sharedFindings, findings),
    sharedUnits,
    sharedUnitsPct: pct(sharedUnits, units),
    workFindings,
    sharedWork,
    sharedWorkPct: pct(sharedWork, workFindings),
    findingsByDepth: byDepth(
      entries,
      (entry) => entry.pages.size,
      (entry) => entry.pages.size,
    ),
    sharedByCheck: tally((entry) => entry.check),
    sharedByClass: tally((entry) => entry.class),
  },
  recurrence: {
    blockMinChars: BLOCK_MIN_CHARS,
    pageLevelFindings: pagesIn(pageLevel),
    labelFindings: pagesIn(labels),
    blockFindings: pagesIn(blocks),
    blockPctOfShared: pct(pagesIn(blocks), sharedFindings),
    blockPctOfAll: pct(pagesIn(blocks), findings),
    blockKeys: blocks.length,
    blockKeysOn10Plus: blocks.filter((entry) => entry.pages.size >= 10).length,
    blockKeysOn25Plus: blocks.filter((entry) => entry.pages.size >= 25).length,
    deepestBlocks: deepestBlocks.slice(0, 20).map((entry) => ({
      store: entry.store,
      pages: entry.pages.size,
      class: entry.class,
      text: (entry.new ?? entry.prod ?? '').slice(0, 90),
    })),
    deepestShared: deepestShared.slice(0, 20).map((entry) => ({
      store: entry.store,
      pages: entry.pages.size,
      class: entry.class,
      text: (entry.new ?? entry.prod ?? '(null)').slice(0, 60),
    })),
  },
  repeats: {
    workFindings: workPages.reduce((total, page) => total + page.findings.length, 0),
    rows: repeats.length,
    multiPageRows: multiPage.length,
    findingsFolded: multiPage.reduce((total, repeat) => total + repeat.on.length, 0),
    deepest: repeats[0]?.on.length ?? 0,
    rowsByDepth: byDepth(
      repeats,
      (repeat) => repeat.on.length,
      () => 1,
    ),
    deepestRows: repeats.slice(0, 25).map((repeat) => ({
      pages: repeat.on.length,
      stores: repeat.stores,
      class: repeat.class,
      text: (repeat.new ?? repeat.prod ?? '').slice(0, 60),
    })),
  },
};

await writeFile(OUT, `${JSON.stringify(result, null, 2)}\n`);

console.log(
  `corpus: ${reports.length} reports, ${comparable.length} comparable, built ${result.corpus.builtAt.earliest?.slice(0, 10)}`,
);

console.log('\n=== 1. the content key ===');
console.log(`findings ${findings} over ${entries.length} distinct content keys`);
console.log(`  shared with another page: ${sharedFindings} (${pct(sharedFindings, findings)}%)`);
console.log(`  units shared:            ${sharedUnits} of ${units} (${pct(sharedUnits, units)}%)`);
console.log(
  `  work findings shared:    ${sharedWork} of ${workFindings} (${pct(sharedWork, workFindings)}%)`,
);
console.log('findings by how many pages carry the same content:');
for (const { label } of DEPTHS) {
  const count = result.contentKey.findingsByDepth[label] ?? 0;
  console.log(
    `  ${label.padStart(6)} pages: ${String(count).padStart(6)}  ${pct(count, findings)}%`,
  );
}

console.log('\n=== 2. what recurs ===');
console.log(
  `  page-level (no content):   ${String(pagesIn(pageLevel)).padStart(6)}  ${pct(pagesIn(pageLevel), sharedFindings)}% of shared`,
);
console.log(
  `  labels (<${BLOCK_MIN_CHARS} chars):         ${String(pagesIn(labels)).padStart(6)}  ${pct(pagesIn(labels), sharedFindings)}% of shared`,
);
console.log(
  `  blocks (>=${BLOCK_MIN_CHARS} chars):        ${String(pagesIn(blocks)).padStart(6)}  ${pct(pagesIn(blocks), sharedFindings)}% of shared = ${pct(pagesIn(blocks), findings)}% of all findings`,
);
console.log(
  `  block keys: ${blocks.length}, of which ${result.recurrence.blockKeysOn10Plus} reach 10+ pages and ${result.recurrence.blockKeysOn25Plus} reach 25+`,
);
console.log('deepest block keys:');
for (const entry of result.recurrence.deepestBlocks.slice(0, 8)) {
  console.log(
    `  ${entry.store.padEnd(6)}${String(entry.pages).padStart(4)}p  ${entry.class.padEnd(14)}${JSON.stringify(entry.text.slice(0, 56))}`,
  );
}

console.log('\n=== 3. the fold that already exists (repeatsInStore) ===');
console.log(`work findings ${result.repeats.workFindings} -> ${repeats.length} rows`);
console.log(
  `  rows spanning >1 page: ${multiPage.length}, folding ${result.repeats.findingsFolded} findings`,
);
console.log(`  deepest row: ${result.repeats.deepest} pages`);
console.log('rows by pages spanned:');
for (const { label } of DEPTHS) {
  console.log(
    `  ${label.padStart(6)}: ${String(result.repeats.rowsByDepth[label] ?? 0).padStart(6)}`,
  );
}
console.log('deepest rows, as the surface shows them worst-first:');
for (const row of result.repeats.deepestRows.slice(0, 12)) {
  console.log(
    `  ${String(row.pages).padStart(4)}p  ${row.stores.join('+').padEnd(9)}${row.class.padEnd(14)}${JSON.stringify(row.text.slice(0, 50))}`,
  );
}

console.log(`\nwritten to ${OUT.pathname}`);
