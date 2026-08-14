// THROWAWAY probe for ticket 91 — what the nine meta classes would fire on today's corpus.
//
// Ticket 21 counted 130 meta findings and about 150 `no-route` findings over **373**
// comparable pages, on 2026-08-07. Step 03 took the corpus to **722**, so every number
// in ticket 58 is stale and two build tickets are waiting to carry them. This restates
// both against `data/extract/` and `data/reports/` as they stand.
//
// **It is not the producer.** Ticket 97 writes that, in `compare/meta.mjs`, and it does
// not import this file — nothing does, which is why nothing here is exported. The nine
// rules are re-stated below loosely, to get a count.
//
// **Two of the head's five rows cannot be measured here.** The panel has five rows
// (ticket 21) and the nine are *classes*, not rows. `keywords` and `metaTitle` have
// never been crawled, so they are not on disk; ticket 92 owns them and measured them
// from raw HTML instead. This measures the three rows that are on disk: title,
// description, and the derived `noindex` boolean.
//
// Reads `data/extract/` and `data/reports/` from disk. No network.
//
//   node crawl/probes/probe-meta-classes.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';

import { FINDING_CLASSES, visibilityOf } from '../../compare/contract.mjs';
import { tier2 } from '../../compare/match.mjs';
import { STORES } from '../../shared/stores.mjs';

const EXTRACTS = new URL('../../data/extract/', import.meta.url);
const REPORTS = new URL('../../data/reports/', import.meta.url);

/** The page ticket 93 is about: production's 404 page against the new site's 404 page. */
const NO_ROUTE = 'no-route';

/** The nine classes of ticket 21, in the order its table gives them. */
const META_CLASSES = [
  'meta-title-changed',
  'meta-title-lost',
  'meta-title-added',
  'meta-description-changed',
  'meta-description-lost',
  'meta-description-added',
  'meta-casing',
  'robots-index-lost',
  'robots-noindex-lost',
];

/**
 * `work` is what ticket 21 called *shown*, before ticket 75 and ADR 0005 replaced the
 * boolean with the visibility enum.
 *
 * Ticket 96 put all nine in `vocabulary.mjs`, so this asks the vocabulary rather than
 * keeping a second table of the same names. That matters beyond tidiness: a class
 * re-triaged there must not need a second edit here, and a hand-kept list would let this
 * probe and the log disagree about what counts. It also means the probe now **fails
 * loudly** if a name here is not a name there — `assertKnown()` below.
 */
const isMetaWork = (cls) => visibilityOf(cls) === 'work';

/**
 * The nine names in this file must be the nine in the vocabulary. `visibilityOf()`
 * answers `diagnostic` for a name it does not hold, so a typo would otherwise read as
 * "not work" and quietly shrink the count rather than stop the run.
 */
function assertKnown() {
  const missing = META_CLASSES.filter((cls) => !(cls in FINDING_CLASSES));
  if (missing.length) {
    throw new Error(`Not in the vocabulary: ${missing.join(', ')}. Ticket 96 owns that list.`);
  }
}

/**
 * The value of one head field, with the `''` of `display()` in `compare/meta.mjs`: an
 * empty tag is an absent one, or every empty title reads as a value both sides hold.
 *
 * @param {Record<string, unknown>} meta
 * @param {string} field
 * @returns {string | null}
 */
function metaValue(meta, field) {
  const value = meta?.[field];
  if (value === '' || value === undefined) return null;
  return /** @type {string | null} */ (value ?? null);
}

/**
 * One text row of the head. At most one class, which is what lets ticket 98 keep the
 * panel a five-row table.
 *
 * `meta-casing` is asked **before** the changed class and is one class across both
 * fields — it is the tier-2-only difference, a dropped trailing full stop or a case
 * change, and ticket 21 forbids `meta-title-changed` and `meta-description-changed`
 * from also claiming it.
 *
 * @param {'title' | 'description'} field
 * @param {string | null} prod
 * @param {string | null} next
 * @returns {string | null}
 */
function classifyField(field, prod, next) {
  if (prod === next) return null;
  if (prod === null) return `meta-${field}-added`;
  if (next === null) return `meta-${field}-lost`;
  if (tier2(prod) === tier2(next)) return 'meta-casing';
  return `meta-${field}-changed`;
}

/**
 * The robots row, off the derived boolean. The raw string is not on disk — ticket 21
 * asks for it and no crawl has run since.
 *
 * `robots-index-lost` is the severe direction: production is indexable and the new site
 * is `noindex`, so the page leaves Google.
 *
 * @param {boolean | undefined} prod
 * @param {boolean | undefined} next
 * @returns {string | null}
 */
function classifyRobots(prod, next) {
  const before = Boolean(prod);
  const after = Boolean(next);
  if (before === after) return null;
  return after ? 'robots-index-lost' : 'robots-noindex-lost';
}

/** @param {URL} dir */
async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await jsonFiles(new URL(`${entry.name}/`, dir))));
    else if (entry.name.endsWith('.json')) out.push(new URL(entry.name, dir));
  }
  return out;
}

const emptyRow = () => Object.fromEntries(META_CLASSES.map((cls) => [cls, 0]));

// ─── the meta walk, over `data/extract/` ────────────────────────────────────────────

assertKnown();

/** @type {Record<string, {crawled: number, comparable: number, classes: Record<string, number>, pagesWithMeta: number}>} */
const byStore = {};
/** Every firing of a class ticket 91 wants named rather than counted. */
const named = { 'robots-index-lost': [], 'robots-noindex-lost': [], lostAdded: [], casing: [] };
/** What `no-route` alone contributes to the meta counts, so ticket 93's removal can be netted off. */
const noRouteMeta = emptyRow();
/** The comparable set as the extracts give it, checked against the reports' below. */
const walked = new Set();

for (const store of STORES) {
  const row = { crawled: 0, comparable: 0, classes: emptyRow(), pagesWithMeta: 0 };
  byStore[store] = row;

  for (const file of await jsonFiles(new URL(`${store}/`, EXTRACTS))) {
    const { production, new: next } = JSON.parse(await readFile(file, 'utf8'));
    row.crawled += 1;
    if (production.status !== 200 || next.status !== 200) continue;
    row.comparable += 1;

    const page = production.page;
    walked.add(`${store}:${page}`);
    // One row, one class at most — which is the rule ticket 97 has to hold.
    const rows = [];
    for (const field of /** @type {const} */ (['title', 'description'])) {
      const prod = metaValue(production.meta, field);
      const value = metaValue(next.meta, field);
      const cls = classifyField(field, prod, value);
      if (cls) rows.push({ field, cls, prod, new: value });
    }
    const robots = classifyRobots(production.meta?.noindex, next.meta?.noindex);
    if (robots) rows.push({ field: 'robots', cls: robots, prod: null, new: null });

    if (rows.length) row.pagesWithMeta += 1;

    for (const { field, cls, prod, new: value } of rows) {
      row.classes[cls] += 1;
      if (page === NO_ROUTE) noRouteMeta[cls] += 1;
      if (cls === 'robots-index-lost' || cls === 'robots-noindex-lost') {
        named[cls].push({ store, page });
      }
      // The four ticket 21 expects to fire zero times. A non-zero count means a page
      // lost a title or a description since 2026-08-07 and wants naming.
      if (cls.endsWith('-lost') && cls.startsWith('meta-')) {
        named.lostAdded.push({ store, page, cls });
      }
      if (cls.endsWith('-added')) named.lostAdded.push({ store, page, cls });
      if (cls === 'meta-casing') named.casing.push({ store, page, field, prod, new: value });
    }
  }
}

// ─── the denominator and `no-route`, over `data/reports/` ───────────────────────────
//
// The findings are read rather than recomputed: ticket 28 forbids measuring a change
// against a baseline another change already moved, and `data/reports/` is what
// `30-compare.mjs` last wrote.
//
// It counts exactly as `summariseReports()` does — **comparable reports only**, off
// `report.summary` — because `measure.mjs` is the gate both ticket 93 and ticket 97 are
// read against, and a denominator that disagrees with the gate is not a denominator.
// The difference is real: 19 non-comparable reports each carry one `no-declared-alternate`,
// so counting every file gives 40,966 where the gate gives 40,947. (`data/snapshot.json`
// records the first of those two, which is a separate inconsistency and not this ticket's.)

/** @type {Record<string, {findings: number, work: number}>} */
const totals = {};
/** @type {Record<string, {findings: number, work: number, byClass: Record<string, number>}>} */
const noRoute = {};
for (const store of STORES) {
  totals[store] = { findings: 0, work: 0 };
  noRoute[store] = { findings: 0, work: 0, byClass: {} };
}

/** The comparable set as the reports declare it, to check the extract walk against. */
const comparablePages = new Set();

for (const name of (await readdir(REPORTS)).filter((n) => n.endsWith('.json'))) {
  const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
  const store = report.store;
  if (!totals[store] || !report.comparable) continue;
  comparablePages.add(`${store}:${report.page}`);

  totals[store].findings += report.summary.total;
  totals[store].work += report.summary.work;

  if (report.page !== NO_ROUTE) continue;
  noRoute[store].findings = report.summary.total;
  noRoute[store].work = report.summary.work;
  noRoute[store].byClass = report.summary.byClass;
}

// The meta walk gates on "both sides 200" and the reports gate on `comparable`, which
// also drops an excluded page. The two agree today, and the probe says so rather than
// leaving the agreement to be assumed: if a later exclusion parts them, the meta count
// would be over a corpus the denominator is not.
const onlyWalked = [...walked].filter((key) => !comparablePages.has(key));
const onlyReported = [...comparablePages].filter((key) => !walked.has(key));
if (onlyWalked.length || onlyReported.length) {
  console.warn(
    `WARNING: the comparable sets differ. ` +
      `Extract-only: ${JSON.stringify(onlyWalked)}. Report-only: ${JSON.stringify(onlyReported)}.`,
  );
}

// ─── the report ─────────────────────────────────────────────────────────────────────

const sum = (pick) => STORES.reduce((n, store) => n + pick(store), 0);
const pad = (value, width) => String(value).padStart(width);

const crawled = sum((s) => byStore[s].crawled);
const comparable = sum((s) => byStore[s].comparable);
const allFindings = sum((s) => totals[s].findings);
const allWork = sum((s) => totals[s].work);

const metaTotal = (store) => META_CLASSES.reduce((n, cls) => n + byStore[store].classes[cls], 0);
const metaWork = (store) =>
  META_CLASSES.reduce((n, cls) => n + (isMetaWork(cls) ? byStore[store].classes[cls] : 0), 0);

const grandMeta = sum(metaTotal);
const grandMetaWork = sum(metaWork);
const noRouteMetaTotal = META_CLASSES.reduce((n, cls) => n + noRouteMeta[cls], 0);

const L = [];
L.push(`corpus            data/extract/ and data/reports/`);
L.push(`extract files     ${crawled}`);
L.push(`comparable        ${comparable}   (both sides 200)`);
L.push(`findings today    ${allFindings}`);
L.push(`work today        ${allWork}   (ticket 21 called this "shown")`);

const W = 26;
L.push(`\n=== THE NINE CLASSES, PER STORE ===\n`);
L.push(`${'class'.padEnd(W)}${STORES.map((s) => pad(s, 8)).join('')}${pad('total', 9)}`);
L.push('-'.repeat(W + STORES.length * 8 + 9));
for (const cls of META_CLASSES) {
  const row = STORES.map((s) => pad(byStore[s].classes[cls], 8)).join('');
  L.push(
    `${cls.padEnd(W)}${row}${pad(
      sum((s) => byStore[s].classes[cls]),
      9,
    )}`,
  );
}
L.push('-'.repeat(W + STORES.length * 8 + 9));
L.push(
  `${'meta findings'.padEnd(W)}${STORES.map((s) => pad(metaTotal(s), 8)).join('')}${pad(grandMeta, 9)}`,
);
L.push(
  `${'  ...of them work'.padEnd(W)}${STORES.map((s) => pad(metaWork(s), 8)).join('')}${pad(grandMetaWork, 9)}`,
);
L.push(
  `${'pages compared'.padEnd(W)}${STORES.map((s) => pad(byStore[s].comparable, 8)).join('')}${pad(comparable, 9)}`,
);
L.push(
  `${'pages with a meta row'.padEnd(W)}${STORES.map((s) => pad(byStore[s].pagesWithMeta, 8)).join('')}${pad(
    sum((s) => byStore[s].pagesWithMeta),
    9,
  )}`,
);
L.push(
  `${'pages with none'.padEnd(W)}${STORES.map((s) => pad(byStore[s].comparable - byStore[s].pagesWithMeta, 8)).join('')}${pad(comparable - sum((s) => byStore[s].pagesWithMeta), 9)}`,
);

const share = (n, d) => (d ? ((n / d) * 100).toFixed(2) : '0.00');
L.push(`\n=== THE SHARE ===`);
L.push(`meta findings              ${grandMeta}`);
L.push(`  of them work             ${grandMetaWork}`);
L.push(`work findings today        ${allWork}`);
// Ticket 21's ratio is the meta **total** over shown, not the meta-work subset: it read
// 130 / 23,961. The two agree only while both `-added` classes fire zero, so the
// numerator is the total here and the work-only ratio is printed beside it.
L.push(`share of work              ${share(grandMeta, allWork)}%   (ticket 21: 0.54%)`);
L.push(`  ...work numerator only   ${share(grandMetaWork, allWork)}%`);
L.push(`share of all findings      ${share(grandMeta, allFindings)}%`);
L.push(
  `pages with no meta row     ${share(comparable - sum((s) => byStore[s].pagesWithMeta), comparable)}%   (ticket 21: 68%)`,
);

// The counts are derived, never typed in: this probe exists because typed-in figures go
// stale, and a literal here would go stale on the next crawl exactly as ticket 21's did.
const noRoutePages = STORES.filter((store) => walked.has(`${store}:${NO_ROUTE}`)).length;
L.push(`\n=== WHAT no-route CONTRIBUTES TO THE META COUNTS ===`);
L.push(`(ticket 93 removes these ${noRoutePages} pages before ticket 97 measures again)`);
for (const cls of META_CLASSES) {
  if (noRouteMeta[cls]) L.push(`  ${pad(noRouteMeta[cls], 5)}  ${cls}`);
}
L.push(`  ${pad(noRouteMetaTotal, 5)}  total`);
L.push(
  `  ${pad(grandMeta - noRouteMetaTotal, 5)}  meta findings on the ${comparable - noRoutePages} pages that remain`,
);

L.push(`\n=== ROBOTS, BY NAME ===`);
for (const cls of ['robots-index-lost', 'robots-noindex-lost']) {
  L.push(`  ${cls}: ${named[cls].length}`);
  for (const hit of named[cls]) L.push(`    ${hit.store.padEnd(6)} ${hit.page}`);
}

L.push(`\n=== meta-casing, BY NAME ===`);
L.push(`(the tier-2-only difference the two changed classes must not also claim)`);
for (const hit of named.casing) {
  L.push(`  ${hit.store.padEnd(6)} ${hit.field.padEnd(12)} ${hit.page}`);
  L.push(`    prod ${JSON.stringify(hit.prod)}`);
  L.push(`    new  ${JSON.stringify(hit.new)}`);
}

L.push(`\n=== THE FOUR lost/added CLASSES ===`);
L.push(`  ${named.lostAdded.length} firings (ticket 21 expects 0)`);
for (const hit of named.lostAdded)
  L.push(`    ${hit.store.padEnd(6)} ${hit.cls.padEnd(26)} ${hit.page}`);

L.push(`\n=== no-route, PER STORE ===\n`);
L.push(`${'store'.padEnd(10)}${pad('findings', 10)}${pad('work', 8)}`);
L.push('-'.repeat(28));
for (const store of STORES) {
  L.push(`${store.padEnd(10)}${pad(noRoute[store].findings, 10)}${pad(noRoute[store].work, 8)}`);
}
L.push('-'.repeat(28));
L.push(
  `${'total'.padEnd(10)}${pad(
    sum((s) => noRoute[s].findings),
    10,
  )}${pad(
    sum((s) => noRoute[s].work),
    8,
  )}`,
);
L.push(
  `\nas a share of today: ${share(
    sum((s) => noRoute[s].findings),
    allFindings,
  )}% of findings, ${share(
    sum((s) => noRoute[s].work),
    allWork,
  )}% of work`,
);

L.push(`\n=== no-route, BY CLASS (nl, as the example) ===`);
for (const [cls, n] of Object.entries(noRoute.nl.byClass).sort((a, b) => b[1] - a[1])) {
  L.push(`  ${pad(n, 5)}  ${visibilityOf(cls).padEnd(11)}  ${cls}`);
}

const report = L.join('\n');
console.log(report);

await writeFile(
  new URL('../../data/probe-meta-classes.json', import.meta.url),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      corpus: { crawled, comparable, findings: allFindings, work: allWork },
      byStore,
      meta: { total: grandMeta, work: grandMetaWork, noRouteContribution: noRouteMeta },
      named,
      noRoute,
    },
    null,
    2,
  ),
);
console.log(`\nwrote data/probe-meta-classes.json`);
