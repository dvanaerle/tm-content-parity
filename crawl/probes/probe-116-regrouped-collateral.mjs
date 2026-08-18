// THROWAWAY probe for ticket 116 — what the `regrouped` pass absorbs, and what it costs.
//
// The ticket has two acceptance criteria that are numbers and not behaviour, and both gate
// the change rather than describe it:
//
//   *"Per-store counts before and after are in the answer … **No class outside `copy`,
//   `text-missing` and `restructured` may move.**"*
//
//   *"**The re-pairing collateral is counted before this lands.** Run the pipeline with and
//   without the pass, diff the finding ids, count the live overrides that fall off the
//   difference. The number goes in the answer whatever it is; per `PRD.md`'s
//   *Classification* rule … it may refuse the change."*
//
// So this is the measurement, committed beside the answer it produced.
//
// **What plays the part of "without the pass": `data/reports/` on disk.** Nothing else has
// to be built. Those files were written by the pipeline as it stood before this ticket, from
// the very extracts in `data/extract/`, so re-running `comparePage()` over the same extracts
// with the pass in place gives the two sides of one comparison — and the only thing that
// differs between them is the pass. A second crawl could not have said that: it would also
// pick up any real change on the two sites, and could not then tell an absorbed finding from
// a Tuesday. It is the trick `probe-86-heading-level-denominator.mjs` used, one step further:
// 86 could re-run `summarise()` alone because a visibility moves no finding; this ticket
// moves findings, so the whole page is compared.
//
// **The two inputs the rebuild needs, or it measures the wrong thing.** `newSitePaths` and
// `link-status.json` are what `leakage`, `broken-link` and `redirect` are decided from. A
// rebuild without them silently drops those three classes, and the run then reports a wall
// of link movement that this ticket had nothing to do with. They are read here exactly as
// `30-compare.mjs` reads them.
//
// **Run it before the pass is built into `data/reports/`, never after.** Once the reports are
// rebuilt both sides are the same code and the diff is empty — which looks like a clean
// result and measures nothing. The figures in the ticket answer were taken on 2026-08-18
// over 816 extracts against 816 reports, with the override log dumped the same morning
// (1,618 rows).
//
// **A failed read is never zero.** A report that cannot be read or parsed stops the probe:
// skipping one would report a smaller diff by reading less of the corpus.
//
//   node crawl/probes/probe-116-regrouped-collateral.mjs
import { readdir, readFile } from 'node:fs/promises';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. It reads the real
// rules rather than copying them: `comparePage()` is the subject, `latestByKey()` is ticket
// 09's precedence rule, and `reportFilename()` is ticket 60's.
import { comparePage, newSitePathsFor } from '../../compare/30-compare.mjs';
import { reportFilename } from '../../compare/contract.mjs';
import { isWork } from '../../compare/vocabulary.mjs';
import { latestByKey } from '../../overrides/state.mjs';

const DATA = new URL('../../data/', import.meta.url);
const EXTRACTS = new URL('extract/', DATA);
const REPORTS = new URL('reports/', DATA);

/** The class this ticket adds. Named once. */
const SUBJECT = 'regrouped';

/**
 * The classes the ticket permits to move, and the whole of the permission. `regrouped`
 * arrives; `copy` and `text-missing` are what it absorbs; `restructured` moves because the
 * greedy pass now sees a different set of leftovers, which is the re-pairing this probe
 * counts. Anything else moving is a defect in the diff.
 */
const MAY_MOVE = new Set([SUBJECT, 'copy', 'text-missing', 'restructured']);

/** The pages the ticket names as the regressions that matter. */
const REGRESSIONS = [
  ['be_fr', '(be_fr)fr/avantages'],
  ['be_fr', '(be_fr)fr/faq/collecte-livraison'],
  ['nl', 'proefpakket/succes'],
];

/**
 * @param {URL} dir
 * @returns {Promise<URL[]>}
 */
async function jsonFiles(dir) {
  /** @type {URL[]} */
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await jsonFiles(new URL(`${entry.name}/`, dir))));
    else if (entry.name.endsWith('.json')) out.push(new URL(entry.name, dir));
  }
  return out;
}

/** @param {URL} url */
const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));

/**
 * The live override state: the latest event per key, with `cleared` removed. It is ticket
 * 09's rule, from ticket 09's own module.
 *
 * The dump is the app's table in the wire's snake case, so it is mapped to what
 * `overrides/state.mjs` reads. Only the terms of the key and the two fields printed below
 * are mapped; a probe that mapped the whole row would be a second copy of the port.
 *
 * @returns {Promise<Map<string, { editor: string, action: string, store: string, page: string,
 *   findingId: string | null }>>}
 */
async function liveOverrides() {
  const names = (await readdir(DATA)).filter(
    (name) => name.startsWith('overrides-backup-') && name.endsWith('.json'),
  );
  if (names.length === 0) {
    throw new Error(
      'No data/overrides-backup-*.json. Run `node overrides/dump.mjs` with the two ' +
        'PUBLIC_SUPABASE_* values from web/.env.local.',
    );
  }
  // The newest dump by name, which sorts chronologically: the file name carries an ISO
  // timestamp. An old dump would undercount the collateral, and quietly.
  const newest = names.sort().at(-1);
  const rows = await readJson(new URL(newest, DATA));
  console.log(`override log: ${newest}, ${rows.length} rows.`);

  const events = rows.map((row) => ({
    id: String(row.id),
    createdAt: row.created_at,
    editor: row.editor,
    scope: row.scope,
    action: row.action,
    store: row.store,
    page: row.page,
    findingId: row.finding_id,
    class: row.class,
  }));

  const live = new Map();
  for (const [key, event] of latestByKey(events)) {
    if (event.action === 'cleared') continue;
    live.set(key, event);
  }
  return live;
}

/** @param {Map<string, number>} tally */
const sorted = (tally) => [...tally].sort((a, b) => b[1] - a[1]);

/**
 * @param {Map<string, number>} tally
 * @param {string} key
 * @param {number} [by]
 */
const bump = (tally, key, by = 1) => tally.set(key, (tally.get(key) ?? 0) + by);

async function main() {
  const seeds = await readJson(new URL('10-store-seeds.json', DATA));
  const rawStatuses = await readJson(new URL('link-status.json', DATA));
  const statuses = new Map(Object.entries(rawStatuses));
  const live = await liveOverrides();

  /** @type {Map<string, Set<string>>} */
  const pathsByStore = new Map();
  /** @type {Map<string, { instances: number, before: Map<string, number>, after: Map<string, number>, pages: number }>} */
  const perStore = new Map();
  /** @type {Map<string, [number, number]>} */
  const corpus = new Map();
  /** @type {Array<{ store: string, page: string, id: string, cls: string, absorbed: boolean }>} */
  const gone = [];
  /** @type {string[]} */
  const notes = [];
  let comparable = 0;
  let appeared = 0;

  const files = await jsonFiles(EXTRACTS);
  for (const file of files) {
    const sides = await readJson(file);
    const store = sides.production.store;
    if (!pathsByStore.has(store)) pathsByStore.set(store, newSitePathsFor(seeds, store));

    const after = comparePage({
      sides,
      newSitePaths: pathsByStore.get(store),
      statuses,
      // One id, so the rebuild is one observation. Nothing here reads it; a `fixed` claim
      // is never derived in this probe.
      observationId: 'probe-116',
    });
    // No try/catch: a report that cannot be read or parsed must stop the probe.
    const before = await readJson(new URL(reportFilename(after.store, after.page), REPORTS));
    if (!before.comparable) continue;
    comparable += 1;

    const one = perStore.get(store) ?? {
      instances: 0,
      before: new Map(),
      after: new Map(),
      pages: 0,
    };
    const instances = after.summary.byClass[SUBJECT] ?? 0;
    one.instances += instances;
    if (instances > 0) one.pages += 1;
    for (const [cls, count] of Object.entries(before.summary.byClass)) bump(one.before, cls, count);
    for (const [cls, count] of Object.entries(after.summary.byClass)) bump(one.after, cls, count);
    bump(one.before, 'work', before.summary.work);
    bump(one.after, 'work', after.summary.work);
    perStore.set(store, one);

    for (const cls of new Set([
      ...Object.keys(before.summary.byClass),
      ...Object.keys(after.summary.byClass),
    ])) {
      const tally = corpus.get(cls) ?? [0, 0];
      tally[0] += before.summary.byClass[cls] ?? 0;
      tally[1] += after.summary.byClass[cls] ?? 0;
      corpus.set(cls, tally);
    }

    // The id diff, which is the collateral. A vanished id is **absorbed** when the page
    // gained a `regrouped` finding: the words it was about are now on that row. Anything
    // else is re-pairing — a finding the criterion says nothing about, whose id moved
    // because the greedy pass was handed a different set of leftovers.
    const afterIds = new Set(after.findings.map((finding) => finding.id));
    for (const finding of before.findings) {
      if (afterIds.has(finding.id)) continue;
      gone.push({
        store: after.store,
        page: after.page,
        id: finding.id,
        cls: finding.class,
        absorbed: instances > 0,
      });
    }
    const beforeIds = new Set(before.findings.map((finding) => finding.id));
    appeared += after.findings.filter((finding) => !beforeIds.has(finding.id)).length;

    // The named regressions. What has to stay true is that the page still puts something
    // up as work: the sentence production holds and the new site drops, and the phone
    // number that changed value, are exactly what containment would have silenced.
    const named = REGRESSIONS.find(([one, page]) => one === after.store && page === after.page);
    if (named) {
      notes.push(
        `${after.store} ${after.page}: work ${before.summary.work} → ${after.summary.work}, ` +
          `${SUBJECT} ${instances}, shown classes ${
            after.findings
              .filter((finding) => isWork(finding.class))
              .map((finding) => finding.class)
              .filter((cls, at, all) => all.indexOf(cls) === at)
              .join(', ') || 'none'
          }`,
      );
    }
  }

  console.log(`${files.length} extracts, ${comparable} comparable.\n`);

  console.log('store     pages  instances   copy         text-missing  restructured  work');
  const byInstances = new Map([...perStore].map(([store, one]) => [store, one.instances]));
  for (const [store] of sorted(byInstances)) {
    const held = perStore.get(store);
    /** @param {string} cls */
    const move = (cls) => `${held.before.get(cls) ?? 0} → ${held.after.get(cls) ?? 0}`;
    console.log(
      `${store.padEnd(10)}${String(held.pages).padEnd(7)}${String(held.instances).padEnd(12)}` +
        `${move('copy').padEnd(13)}${move('text-missing').padEnd(14)}` +
        `${move('restructured').padEnd(14)}${move('work')}`,
    );
  }

  const moved = [...corpus].filter(([, [b, a]]) => b !== a);
  console.log('\nevery class whose corpus tally moved:');
  for (const [cls, [b, a]] of moved.sort(
    (x, y) => Math.abs(y[1][1] - y[1][0]) - Math.abs(x[1][1] - x[1][0]),
  )) {
    console.log(`  ${cls.padEnd(16)}${b} → ${a}  (${a - b > 0 ? '+' : ''}${a - b})`);
  }

  console.log(`\n${gone.length} finding ids vanished, ${appeared} appeared.`);
  const byReason = new Map();
  const byClass = new Map();
  for (const one of gone) {
    bump(byReason, one.absorbed ? 'on a page that gained a regrouping' : 'elsewhere on the corpus');
    bump(byClass, `${one.cls} ${one.absorbed ? '(absorbed)' : '(re-paired)'}`);
  }
  for (const [reason, count] of sorted(byReason)) console.log(`  ${count} ${reason}`);
  for (const [cls, count] of sorted(byClass)) console.log(`    ${cls.padEnd(30)}${count}`);

  // The gate. A live override whose finding id is gone is a judgement nobody can reach any
  // more, and `rule` is a term of the id so nothing can be migrated.
  const goneById = new Map(gone.map((one) => [`${one.store}|${one.page}|${one.id}`, one]));
  /** @type {Array<{ event: any, finding: { cls: string, absorbed: boolean } }>} */
  const detached = [];
  let onFindings = 0;
  for (const event of live.values()) {
    if (event.scope !== 'finding') continue;
    onFindings += 1;
    const finding = goneById.get(`${event.store}|${event.page}|${event.findingId}`);
    if (finding) detached.push({ event, finding });
  }

  console.log(`\n${onFindings} live finding-scope overrides. ${detached.length} detach.`);
  const byEditor = new Map();
  const byAction = new Map();
  const byWhy = new Map();
  for (const { event, finding } of detached) {
    bump(byEditor, event.editor);
    bump(byAction, `${event.action} on ${finding.cls}`);
    bump(byWhy, finding.absorbed ? 'absorbed by a regrouping' : 're-paired collateral');
  }
  for (const [why, count] of sorted(byWhy)) console.log(`  ${count} ${why}`);
  for (const [action, count] of sorted(byAction)) console.log(`    ${action.padEnd(30)}${count}`);
  console.log('  by editor:');
  for (const [editor, count] of sorted(byEditor)) console.log(`    ${editor.padEnd(20)}${count}`);

  console.log('\nthe pages the ticket names:');
  for (const line of notes) console.log(`  ${line}`);

  const forbidden = moved.filter(([cls]) => !MAY_MOVE.has(cls));
  if (forbidden.length > 0) {
    throw new Error(
      `A class the ticket does not permit to move moved: ${forbidden
        .map(([cls, [b, a]]) => `${cls} ${b} → ${a}`)
        .join(', ')}. The diff is defective.`,
    );
  }
  console.log(`\nNothing moved outside ${[...MAY_MOVE].join(', ')}.`);
}

await main();
