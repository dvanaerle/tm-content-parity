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
//   node crawl/probes/probe-91-meta-classes.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';

import { CHECKS, FINDING_CLASSES, isWork, visibilityOf } from '../../compare/contract.mjs';
import { tier2 } from '../../compare/match.mjs';
import { STORES } from '../../shared/stores.mjs';

const EXTRACTS = new URL('../../data/extract/', import.meta.url);
const REPORTS = new URL('../../data/reports/', import.meta.url);
const OUT = new URL('../../data/probe-91-meta-classes.json', import.meta.url);

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

/** The robots row's two classes, named once so the three sites that want them agree. */
const ROBOTS_CLASSES = ['robots-index-lost', 'robots-noindex-lost'];

/**
 * The four ticket 21 expects to fire zero times. Named rather than recovered from the
 * `-lost` / `-added` suffix: the suffixes are not the head's to own, so a later
 * `nav-item-added` would read as one of these four and be named in the wrong table.
 */
const LOST_ADDED_CLASSES = [
  'meta-title-lost',
  'meta-title-added',
  'meta-description-lost',
  'meta-description-added',
];

/**
 * The nine names in this file must be the nine in the vocabulary. `visibilityOf()`
 * answers `diagnostic` for a name it does not hold, so a typo would otherwise read as
 * "not work" and quietly shrink the count rather than stop the run.
 *
 * The two subset arrays are checked against the nine for the same reason one step further
 * in: a typo there is not counted wrong, it is *named* wrong — the class fires, the total
 * is right, and the by-name table the two build tickets read is quietly short a row.
 */
function assertKnown() {
  const missing = META_CLASSES.filter((cls) => !(cls in FINDING_CLASSES));
  if (missing.length) {
    throw new Error(`Not in the vocabulary: ${missing.join(', ')}. Ticket 96 owns that list.`);
  }
  const strays = [...ROBOTS_CLASSES, ...LOST_ADDED_CLASSES].filter(
    (cls) => !META_CLASSES.includes(cls),
  );
  if (strays.length) {
    throw new Error(`Named but not one of the nine: ${strays.join(', ')}.`);
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
 * The `noindex` of one side, read at the disk boundary so the classifier below can take a
 * boolean and nothing else.
 *
 * An absent field throws rather than coercing. `PageMeta` declares it non-nullable and
 * all 888 sides on disk hold a boolean, so this cannot fire today — but the `Boolean()`
 * this replaces read an absent field as *indexable*, which would invent a
 * `robots-index-lost` or hide one, and that is the silent-shrink failure `assertKnown()`
 * exists to stop.
 *
 * @param {Record<string, unknown> | undefined} meta
 * @param {string} where
 * @returns {boolean}
 */
function metaNoindex(meta, where) {
  const value = meta?.noindex;
  if (value === true || value === false) return value;
  throw new Error(`${where}: noindex is ${JSON.stringify(value)}, not a boolean.`);
}

/**
 * The robots row, off the derived boolean. The raw string is not on disk — ticket 21
 * asks for it and no crawl has run since.
 *
 * `robots-index-lost` is the severe direction: production is indexable and the new site
 * is `noindex`, so the page leaves Google.
 *
 * @param {boolean} prod
 * @param {boolean} next
 * @returns {string | null}
 */
function classifyRobots(prod, next) {
  if (prod === next) return null;
  return next ? 'robots-index-lost' : 'robots-noindex-lost';
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
    const { production, new: newSite } = JSON.parse(await readFile(file, 'utf8'));
    row.crawled += 1;
    if (production.status !== 200 || newSite.status !== 200) continue;
    row.comparable += 1;

    const page = production.page;
    walked.add(`${store}:${page}`);
    // One row, one class at most — which is the rule ticket 97 has to hold.
    const rows = [];
    for (const field of /** @type {const} */ (['title', 'description'])) {
      const prod = metaValue(production.meta, field);
      const next = metaValue(newSite.meta, field);
      const cls = classifyField(field, prod, next);
      if (cls) rows.push({ field, cls, prod, next });
    }
    const where = `${store}:${page}`;
    const robots = classifyRobots(
      metaNoindex(production.meta, `${where} (production)`),
      metaNoindex(newSite.meta, `${where} (new site)`),
    );
    if (robots) rows.push({ field: 'robots', cls: robots, prod: null, next: null });

    if (rows.length) row.pagesWithMeta += 1;

    for (const { field, cls, prod, next } of rows) {
      row.classes[cls] += 1;
      if (page === NO_ROUTE) noRouteMeta[cls] += 1;
      if (ROBOTS_CLASSES.includes(cls)) named[cls].push({ store, page });
      // A non-zero count here means a page lost or gained a title or a description since
      // 2026-08-07 and wants naming.
      if (LOST_ADDED_CLASSES.includes(cls)) named.lostAdded.push({ store, page, cls });
      if (cls === 'meta-casing') named.casing.push({ store, page, field, prod, next });
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

// `CHECKS` comes from the vocabulary for the same reason the nine classes do: a second
// hand-kept table of the same names would let this probe and the log disagree.
//
// `meta` is **not** empty today — it holds 349 `no-declared-alternate` findings, so ticket
// 97 does not create the check, it adds the head rows to one that already fires. That
// matters for 97's gate, which reads `measure.mjs nl`, and `nl` is the one store where the
// existing `meta` count is 0. All 349 are `diagnostic`, so none is in `work`.

/** @type {Record<string, {findings: number, work: number, byCheck: Record<string, number>}>} */
const totals = {};
/** @type {Record<string, {findings: number, work: number, byClass: Record<string, number>}>} */
const noRoute = {};
for (const store of STORES) {
  totals[store] = { findings: 0, work: 0, byCheck: Object.fromEntries(CHECKS.map((c) => [c, 0])) };
  noRoute[store] = { findings: 0, work: 0, byClass: {} };
}

/** The comparable set as the reports declare it, to check the extract walk against. */
const comparablePages = new Set();
/** Reports for a store `shared/stores.mjs` does not hold. Skipping one silently would
 *  shrink the denominator below the gate's, which is the one thing it may not do. */
const unknownStores = new Set();

for (const name of (await readdir(REPORTS)).filter((n) => n.endsWith('.json'))) {
  const report = JSON.parse(await readFile(new URL(name, REPORTS), 'utf8'));
  const store = report.store;
  if (!(store in totals)) {
    unknownStores.add(store);
    continue;
  }
  if (!report.comparable) continue;
  comparablePages.add(`${store}:${report.page}`);

  totals[store].findings += report.summary.total;
  totals[store].work += report.summary.work;
  // `byCheck` is the baseline ticket 97's gate is read against: it adds the head rows and
  // must leave text, links and images where they are.
  for (const check of CHECKS) totals[store].byCheck[check] += report.summary.byCheck[check] ?? 0;

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
// This throws where the set mismatch above only warns, and the difference is deliberate:
// a parted comparable set makes the meta count and the denominator describe slightly
// different corpora, which is worth saying out loud but still leaves both readable, while
// a skipped store puts the denominator *under* the one `measure.mjs` prints — and a
// denominator that disagrees with the gate is not a denominator.
if (unknownStores.size) {
  throw new Error(
    `Reports for ${[...unknownStores].join(', ')}, which shared/stores.mjs does not hold. ` +
      `Skipping them would put the denominator under the one measure.mjs reads.`,
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

/**
 * `work` is what ticket 21 called *shown*, before ticket 75 and ADR 0005 replaced the
 * boolean with the visibility enum.
 *
 * Ticket 96 put all nine in `vocabulary.mjs`, so this asks the vocabulary rather than
 * keeping a second table of the same names. That matters beyond tidiness: a class
 * re-triaged there must not need a second edit here, and a hand-kept list would let this
 * probe and the log disagree about what counts. It also means the probe **fails loudly**
 * if a name here is not a name there — `assertKnown()` above.
 */
const metaWork = (store) =>
  META_CLASSES.reduce((n, cls) => n + (isWork(cls) ? byStore[store].classes[cls] : 0), 0);

const grandMeta = sum(metaTotal);
const grandMetaWork = sum(metaWork);
const noRouteMetaTotal = META_CLASSES.reduce((n, cls) => n + noRouteMeta[cls], 0);

const lines = [];
lines.push(`corpus            data/extract/ and data/reports/`);
lines.push(`extract files     ${crawled}`);
lines.push(`comparable        ${comparable}   (both sides 200)`);
lines.push(`findings today    ${allFindings}`);
lines.push(`work today        ${allWork}   (ticket 21 called this "shown")`);

const LABEL_W = 26;
const RULE = '-'.repeat(LABEL_W + STORES.length * 8 + 9);

/**
 * One `label / per-store / total` row. The total is always the sum of the cells beside
 * it, so no row can be read against a differently-derived total.
 *
 * @param {string} label
 * @param {(store: string) => number} pick
 */
const storeRow = (label, pick) =>
  `${label.padEnd(LABEL_W)}${STORES.map((s) => pad(pick(s), 8)).join('')}${pad(sum(pick), 9)}`;

lines.push(`\n=== THE NINE CLASSES, PER STORE ===\n`);
lines.push(`${'class'.padEnd(LABEL_W)}${STORES.map((s) => pad(s, 8)).join('')}${pad('total', 9)}`);
lines.push(RULE);
for (const cls of META_CLASSES) {
  lines.push(storeRow(cls, (s) => byStore[s].classes[cls]));
}
lines.push(RULE);
lines.push(storeRow('meta findings', metaTotal));
lines.push(storeRow('  ...of them work', metaWork));
lines.push(storeRow('pages compared', (s) => byStore[s].comparable));
lines.push(storeRow('pages with a meta row', (s) => byStore[s].pagesWithMeta));
lines.push(storeRow('pages with none', (s) => byStore[s].comparable - byStore[s].pagesWithMeta));

// The baseline the two gates are read against. Ticket 97 adds a fourth check and its gate
// is `measure.mjs nl` plus "text, link and image counts are unmoved"; ticket 93 removes
// six pages and reads the same figures per store. Both are derived here so neither ticket
// carries a typed-in number that the next crawl makes stale.
lines.push(`\n=== THE GATE BASELINE, PER STORE ===\n`);
lines.push(
  `${'measure.mjs'.padEnd(LABEL_W)}${STORES.map((s) => pad(s, 8)).join('')}${pad('total', 9)}`,
);
lines.push(RULE);
lines.push(storeRow('findings', (s) => totals[s].findings));
lines.push(storeRow('work', (s) => totals[s].work));
for (const check of CHECKS) {
  lines.push(storeRow(`  ${check}`, (s) => totals[s].byCheck[check]));
}
// Every finding must fall under one of the four names above, or the baseline is short of
// the one the gate reads and the ticket would be measured against a number nothing prints.
const unattributed = sum(
  (s) => totals[s].findings - CHECKS.reduce((n, c) => n + totals[s].byCheck[c], 0),
);
if (unattributed !== 0) {
  throw new Error(`${unattributed} findings carry a check outside ${CHECKS.join(', ')}.`);
}

// What the gate will print once the head rows land: the meta findings join `work`, so the
// denominator moves with the numerator and the share is not today's 0.90%.
lines.push(
  `\nafter ticket 97: meta check ${sum((s) => totals[s].byCheck.meta)} + ${grandMeta} = ` +
    `${sum((s) => totals[s].byCheck.meta) + grandMeta} findings, ` +
    `work ${allWork} + ${grandMetaWork} = ${allWork + grandMetaWork}, ` +
    `meta share ${((grandMeta / (allWork + grandMetaWork)) * 100).toFixed(2)}%`,
);

const share = (n, d) => (d ? ((n / d) * 100).toFixed(2) : '0.00');
lines.push(`\n=== THE SHARE ===`);
lines.push(`meta findings              ${grandMeta}`);
lines.push(`  of them work             ${grandMetaWork}`);
lines.push(`work findings today        ${allWork}`);
// Ticket 21's ratio is the meta **total** over shown, not the meta-work subset: it read
// 130 / 23,961. The two agree only while both `-added` classes fire zero, so the
// numerator is the total here and the work-only ratio is printed beside it.
lines.push(`share of work              ${share(grandMeta, allWork)}%   (ticket 21: 0.54%)`);
lines.push(`  ...work numerator only   ${share(grandMetaWork, allWork)}%`);
lines.push(`share of all findings      ${share(grandMeta, allFindings)}%`);
lines.push(
  `pages with no meta row     ${share(comparable - sum((s) => byStore[s].pagesWithMeta), comparable)}%   (ticket 21: 68%)`,
);

// The counts are derived, never typed in: this probe exists because typed-in figures go
// stale, and a literal here would go stale on the next crawl exactly as ticket 21's did.
const noRoutePages = STORES.filter((store) => walked.has(`${store}:${NO_ROUTE}`)).length;
lines.push(`\n=== WHAT no-route CONTRIBUTES TO THE META COUNTS ===`);
lines.push(`(ticket 93 removes these ${noRoutePages} pages before ticket 97 measures again)`);
for (const cls of META_CLASSES) {
  if (noRouteMeta[cls]) lines.push(`  ${pad(noRouteMeta[cls], 5)}  ${cls}`);
}
lines.push(`  ${pad(noRouteMetaTotal, 5)}  total`);
lines.push(
  `  ${pad(grandMeta - noRouteMetaTotal, 5)}  meta findings on the ${comparable - noRoutePages} pages that remain`,
);

lines.push(`\n=== ROBOTS, BY NAME ===`);
for (const cls of ROBOTS_CLASSES) {
  lines.push(`  ${cls}: ${named[cls].length}`);
  for (const hit of named[cls]) lines.push(`    ${hit.store.padEnd(6)} ${hit.page}`);
}

lines.push(`\n=== meta-casing, BY NAME ===`);
lines.push(`(the tier-2-only difference the two changed classes must not also claim)`);
for (const hit of named.casing) {
  lines.push(`  ${hit.store.padEnd(6)} ${hit.field.padEnd(12)} ${hit.page}`);
  lines.push(`    prod ${JSON.stringify(hit.prod)}`);
  lines.push(`    new  ${JSON.stringify(hit.next)}`);
}

lines.push(`\n=== THE FOUR lost/added CLASSES ===`);
lines.push(`  ${named.lostAdded.length} firings (ticket 21 expects 0)`);
for (const hit of named.lostAdded)
  lines.push(`    ${hit.store.padEnd(6)} ${hit.cls.padEnd(26)} ${hit.page}`);

lines.push(`\n=== no-route, PER STORE ===\n`);
lines.push(`${'store'.padEnd(10)}${pad('findings', 10)}${pad('work', 8)}`);
lines.push('-'.repeat(28));
for (const store of STORES) {
  lines.push(
    `${store.padEnd(10)}${pad(noRoute[store].findings, 10)}${pad(noRoute[store].work, 8)}`,
  );
}
lines.push('-'.repeat(28));
lines.push(
  `${'total'.padEnd(10)}${pad(
    sum((s) => noRoute[s].findings),
    10,
  )}${pad(
    sum((s) => noRoute[s].work),
    8,
  )}`,
);
lines.push(
  `\nas a share of today: ${share(
    sum((s) => noRoute[s].findings),
    allFindings,
  )}% of findings, ${share(
    sum((s) => noRoute[s].work),
    allWork,
  )}% of work`,
);

lines.push(`\n=== no-route, BY CLASS (nl, as the example) ===`);
for (const [cls, n] of Object.entries(noRoute.nl.byClass).sort((a, b) => b[1] - a[1])) {
  lines.push(`  ${pad(n, 5)}  ${visibilityOf(cls).padEnd(11)}  ${cls}`);
}

console.log(lines.join('\n'));

await writeFile(
  OUT,
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
console.log(`\nwrote ${OUT.pathname}`);
