// THROWAWAY probe for ticket 120 — what the split direction of `regrouped` absorbs, and
// what it costs.
//
// Two acceptance criteria are numbers rather than behaviour, and both gate the change:
//
//   *"Per-store counts before and after are in the answer. Expect ≈163 instances, ≈153
//   `copy`, ≈2 `text-missing` and ≈201 `text-added` absorbed. **No class outside `copy`,
//   `text-missing`, `text-added`, `restructured` and `campaign` may move.**"*
//
//   *"`text-added` is hidden, so most of this is invisible by design. The answer must state
//   the shown and hidden movements separately."*
//
// **Why this probe has a baseline file where ticket 116's had none.** 116 used
// `data/reports/` on disk as its *before*, because those files were written by the pipeline
// as it stood before that ticket. They still are — no report on disk carries a `regrouped`
// finding — so reading them here would measure **116 and 120 together**, and this ticket's
// numbers have to be the split direction alone. So the *before* is captured from the working
// tree with `--baseline`, run before the split pass exists, and the diff run compares against
// it. The extracts are the input on both sides, which is the whole reason a difference here
// is attributable to the pass and not to a Tuesday on either site.
//
// **Run `--baseline` before the pass is written, and the diff after.** The baseline records a
// fingerprint of `compare/` and the diff run refuses a baseline carrying its own: both sides
// being the same code looks like a clean result and measures nothing. It fingerprints the
// comparison's source rather than reading `git rev-parse HEAD`, because the baseline is taken
// from the working tree and the pass is written before it is committed — on one commit.
//
// **A page the baseline does not hold is never skipped.** It means the two runs read
// different extracts, and every number below would then compare two different corpora.
//
//   node crawl/probes/probe-120-regrouped-split.mjs --baseline
//   node crawl/probes/probe-120-regrouped-split.mjs
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. It reads the real
// rules rather than copying them: `comparePage()` is the subject, `latestByKey()` is ticket
// 09's precedence rule, and `isWork()` and `visibilityOf()` are the vocabulary's own.
import { comparePage, newSitePathsFor } from '../../compare/30-compare.mjs';
import { isWork, visibilityOf } from '../../compare/vocabulary.mjs';
import { latestByKey } from '../../overrides/state.mjs';

const DATA = new URL('../../data/', import.meta.url);
const EXTRACTS = new URL('extract/', DATA);
const BASELINE = new URL('probe-120-before.json', DATA);

/** The class the split direction is added to. Named once. */
const SUBJECT = 'regrouped';

/**
 * The classes the ticket permits to move, and the whole of the permission. `regrouped`
 * arrives; `copy`, `text-missing` and `text-added` are what a split absorbs; `restructured`
 * and `campaign` move because the greedy pass is handed a different set of leftovers, which
 * is the re-pairing this probe counts. Anything else moving is a defect in the pass.
 */
const MAY_MOVE = new Set([
  SUBJECT,
  'copy',
  'text-missing',
  'text-added',
  'restructured',
  'campaign',
]);

/** The pages the ticket names as the cases that matter, accepted and refused alike. */
const NAMED = [
  ['nl', 'glazen-schuifwand/productinformatie'],
  ['be', 'glazen-schuifwand/productinformatie'],
  ['de', '(de)glasschiebewand/produktinformationen'],
  ['fr', '(fr)heavy-duty-veranda'],
  ['be_fr', '(be_fr)fr/echantillons'],
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

const COMPARE = new URL('../../compare/', import.meta.url);

/**
 * What this working tree compares with: every source file of the comparison stage, hashed.
 * The test files are in there too and cost nothing to include — a fingerprint has to be cheap
 * to be honest, not minimal.
 */
async function fingerprint() {
  const hash = createHash('sha1');
  for (const name of (await readdir(COMPARE)).sort()) {
    if (!name.endsWith('.mjs')) continue;
    hash.update(name);
    hash.update(await readFile(new URL(name, COMPARE)));
  }
  return hash.digest('hex').slice(0, 12);
}

/**
 * Every comparable page, as this working tree compares it.
 *
 * @returns {Promise<Array<{ store: string, page: string, byClass: Record<string, number>,
 *   work: number, findings: Array<{ id: string, class: string }> }>>}
 */
async function comparisons() {
  const seeds = await readJson(new URL('10-store-seeds.json', DATA));
  const statuses = new Map(Object.entries(await readJson(new URL('link-status.json', DATA))));
  /** @type {Map<string, Set<string>>} */
  const pathsByStore = new Map();

  const out = [];
  for (const file of await jsonFiles(EXTRACTS)) {
    const sides = await readJson(file);
    const store = sides.production.store;
    // `newSitePaths` and `link-status.json` are what `leakage`, `broken-link` and `redirect`
    // are decided from. Without them the run drops those three classes and reports a wall of
    // link movement this ticket had nothing to do with. Read as `30-compare.mjs` reads them.
    if (!pathsByStore.has(store)) pathsByStore.set(store, newSitePathsFor(seeds, store));
    const report = comparePage({
      sides,
      newSitePaths: pathsByStore.get(store),
      statuses,
      // One id, so the run is one observation. Nothing here reads it; no `fixed` claim is
      // ever derived in this probe.
      observationId: 'probe-120',
    });
    if (!report.comparable) continue;
    out.push({
      store: report.store,
      page: report.page,
      byClass: report.summary.byClass,
      work: report.summary.work,
      findings: report.findings.map((finding) => ({
        id: finding.id,
        class: finding.class,
        // The shape, which is where the run lengths are. Kept for the class this ticket is
        // about and for no other, so the baseline stays a file and not a second corpus.
        detail: finding.class === SUBJECT ? finding.detail : null,
      })),
    });
  }
  return out;
}

/**
 * The live override state: the latest event per key, with `cleared` removed. Ticket 09's
 * rule, from ticket 09's own module. The dump is the app's table in the wire's snake case, so
 * it is mapped to what `overrides/state.mjs` reads — only the terms of the key and the two
 * fields printed below, because a probe that mapped the whole row would be a second copy of
 * the port.
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
  // The newest dump by name, which sorts chronologically: the name carries an ISO timestamp.
  // An old dump would undercount the collateral, and quietly.
  const newest = names.sort().at(-1);
  const rows = await readJson(new URL(newest, DATA));
  console.log(`override log: ${newest}, ${rows.length} rows.`);

  const live = new Map();
  for (const [key, event] of latestByKey(
    rows.map((row) => ({
      id: String(row.id),
      createdAt: row.created_at,
      editor: row.editor,
      scope: row.scope,
      action: row.action,
      store: row.store,
      page: row.page,
      findingId: row.finding_id,
      class: row.class,
    })),
  )) {
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

async function writeBaseline() {
  const pages = await comparisons();
  const at = await fingerprint();
  await writeFile(BASELINE, JSON.stringify({ compare: at, pages }));
  const instances = pages.reduce((sum, page) => sum + (page.byClass[SUBJECT] ?? 0), 0);
  console.log(
    `baseline at compare/ ${at}: ${pages.length} comparable pages, ${instances} ${SUBJECT} ` +
      `findings, which are ticket 116's merges.\nWritten to ${BASELINE.pathname}.`,
  );
}

async function diff() {
  const baseline = await readJson(BASELINE);
  if (baseline.compare === (await fingerprint())) {
    throw new Error(
      `The baseline was taken from this very comparison (compare/ ${baseline.compare}), so ` +
        'both sides of the diff are the same code and it measures nothing. Take the baseline ' +
        'before the pass.',
    );
  }
  const before = new Map(baseline.pages.map((page) => [`${page.store}|${page.page}`, page]));
  const live = await liveOverrides();

  /** @type {Map<string, { instances: number, pages: number, before: Map<string, number>, after: Map<string, number> }>} */
  const perStore = new Map();
  /** @type {Map<string, [number, number]>} */
  const corpus = new Map();
  /** @type {Array<{ store: string, page: string, id: string, cls: string, absorbed: boolean }>} */
  const gone = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {Map<string, number>} */
  const details = new Map();
  let appeared = 0;

  const after = await comparisons();
  for (const page of after) {
    const was = before.get(`${page.store}|${page.page}`);
    if (!was) throw new Error(`${page.store} ${page.page} is not in the baseline.`);

    const one = perStore.get(page.store) ?? {
      instances: 0,
      pages: 0,
      before: new Map(),
      after: new Map(),
    };
    // The **split** instances and not the class tally: the baseline already carries ticket
    // 116's merges, and this ticket's number is the direction it adds.
    const gained = (page.byClass[SUBJECT] ?? 0) - (was.byClass[SUBJECT] ?? 0);
    one.instances += gained;
    if (gained > 0) one.pages += 1;
    for (const [cls, count] of Object.entries(was.byClass)) bump(one.before, cls, count);
    for (const [cls, count] of Object.entries(page.byClass)) bump(one.after, cls, count);
    bump(one.before, 'work', was.work);
    bump(one.after, 'work', page.work);
    perStore.set(page.store, one);

    for (const cls of new Set([...Object.keys(was.byClass), ...Object.keys(page.byClass)])) {
      const tally = corpus.get(cls) ?? [0, 0];
      tally[0] += was.byClass[cls] ?? 0;
      tally[1] += page.byClass[cls] ?? 0;
      corpus.set(cls, tally);
    }

    // The id diff, which is the collateral. A vanished id is **absorbed** when the page
    // gained a split: the words it was about are now on that row. Anything else is
    // re-pairing — a finding the criterion says nothing about, whose id moved because the
    // greedy pass was handed a different set of leftovers.
    const afterIds = new Set(page.findings.map((finding) => finding.id));
    for (const finding of was.findings) {
      if (afterIds.has(finding.id)) continue;
      gone.push({
        store: page.store,
        page: page.page,
        id: finding.id,
        cls: finding.class,
        absorbed: gained > 0,
      });
    }
    const beforeIds = new Set(was.findings.map((finding) => finding.id));
    for (const finding of page.findings) {
      if (beforeIds.has(finding.id)) continue;
      appeared += 1;
      if (finding.class === SUBJECT && finding.detail) bump(details, finding.detail);
    }

    const named = NAMED.find(([store, path]) => store === page.store && path === page.page);
    if (named) {
      notes.push(
        `${page.store} ${page.page}: work ${was.work} → ${page.work}, ${SUBJECT} ` +
          `${was.byClass[SUBJECT] ?? 0} → ${page.byClass[SUBJECT] ?? 0}, shown classes ${
            page.findings
              .filter((finding) => isWork(finding.class))
              .map((finding) => finding.class)
              .filter((cls, at, all) => all.indexOf(cls) === at)
              .join(', ') || 'none'
          }`,
      );
    }
  }

  console.log(`${after.length} comparable pages, baseline at compare/ ${baseline.compare}.\n`);

  console.log('store     pages  split   copy          text-missing   text-added     work');
  for (const [store] of sorted(new Map([...perStore].map(([one, held]) => [one, held.instances])))) {
    const held = perStore.get(store);
    /** @param {string} cls */
    const move = (cls) => `${held.before.get(cls) ?? 0} → ${held.after.get(cls) ?? 0}`;
    console.log(
      `${store.padEnd(10)}${String(held.pages).padEnd(7)}${String(held.instances).padEnd(8)}` +
        `${move('copy').padEnd(14)}${move('text-missing').padEnd(15)}` +
        `${move('text-added').padEnd(15)}${move('work')}`,
    );
  }

  const moved = [...corpus].filter(([, [b, a]]) => b !== a);
  console.log('\nevery class whose corpus tally moved, and what a reader sees of it:');
  let shown = 0;
  let unshown = 0;
  for (const [cls, [b, a]] of moved.sort(
    (x, y) => Math.abs(y[1][1] - y[1][0]) - Math.abs(x[1][1] - x[1][0]),
  )) {
    const visibility = visibilityOf(cls);
    if (visibility === 'work') shown += a - b;
    else unshown += a - b;
    console.log(`  ${cls.padEnd(16)}${b} → ${a}  (${a - b > 0 ? '+' : ''}${a - b})  ${visibility}`);
  }
  const signed = (/** @type {number} */ n) => `${n > 0 ? '+' : ''}${n}`;
  console.log(
    `  shown movement ${signed(shown)}, not shown ${signed(unshown)}. The ticket's trap: most ` +
      'of this is invisible by design.',
  );

  console.log('\nthe details the new rows read, which is where the run lengths are:');
  for (const [detail, count] of sorted(details)) console.log(`  ${detail.padEnd(20)}${count}`);

  console.log(`\n${gone.length} finding ids vanished, ${appeared} appeared.`);
  const byReason = new Map();
  const byClass = new Map();
  for (const one of gone) {
    bump(byReason, one.absorbed ? 'on a page that gained a split' : 'elsewhere on the corpus');
    bump(byClass, `${one.cls} ${one.absorbed ? '(absorbed)' : '(re-paired)'}`);
  }
  for (const [reason, count] of sorted(byReason)) console.log(`  ${count} ${reason}`);
  for (const [cls, count] of sorted(byClass)) console.log(`    ${cls.padEnd(30)}${count}`);

  // A live override whose finding id is gone is a judgement nobody can reach any more, and
  // `rule` is a term of the id so nothing can be migrated.
  const goneById = new Map(gone.map((one) => [`${one.store}|${one.page}|${one.id}`, one]));
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
  const byStore = new Map();
  const byPage = new Map();
  for (const { event, finding } of detached) {
    bump(byEditor, event.editor);
    bump(byAction, `${event.action} on ${finding.cls}`);
    bump(byStore, event.store);
    bump(byPage, `${event.store} ${event.page}`);
  }
  for (const [action, count] of sorted(byAction)) console.log(`    ${action.padEnd(30)}${count}`);
  console.log('  by editor:');
  for (const [editor, count] of sorted(byEditor)) console.log(`    ${editor.padEnd(20)}${count}`);
  console.log('  by store:');
  for (const [store, count] of sorted(byStore)) console.log(`    ${store.padEnd(20)}${count}`);
  // The pages are named because the announcement note names them: an editor reads that list
  // to find out whether any of the work was theirs.
  console.log(`  on ${byPage.size} pages:`);
  for (const [page, count] of sorted(byPage)) console.log(`    ${page.padEnd(46)}${count}`);

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

await (process.argv.includes('--baseline') ? writeBaseline() : diff());
