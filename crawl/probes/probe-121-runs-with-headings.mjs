// THROWAWAY probe for ticket 121 — which regrouped rows hold a heading, on which side, and
// how many jump-list entries the row absorbed.
//
// The ticket names one page and one shape: `be/laagste-prijs-garantie`, a production heading
// merged into a new-site paragraph, `h3 + p → p`. **The corpus says otherwise**, which is why
// this exists: an acceptance criterion written from a live page has to be read against the
// extracts the log actually compares before it is ticked.
//
// It counts three things and nothing else:
//
//   * every `regrouped` row whose run or covered block holds a heading, with the side and the
//     heading's position in the run — the shapes this ticket's rule has to answer for;
//   * the jump-list entries a row loses under the old rule (`prod ?? new`, one heading per
//     row) against the new one (every heading the row holds), which is the whole measurement:
//     this ticket moves navigation and no finding count at all;
//   * the named page, printed whole, because its criterion is the one being corrected.
//
// No baseline file and no fingerprint, unlike ticket 120's probe: nothing here reads
// `overrides` or a finding id, and the before is a rule this file states in three lines rather
// than a previous run of the pipeline.
//
//   node crawl/probes/probe-121-runs-with-headings.mjs
import { readdir, readFile } from 'node:fs/promises';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. `diffRows()` is the
// subject: this ticket's question is about rows and their units, not about a page's summary.
import { diffRows } from '../../compare/text.mjs';

const EXTRACTS = new URL('../../data/extract/', import.meta.url);

/** The page the ticket names, and the criterion this probe corrects. */
const NAMED = 'laagste-prijs-garantie';

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

/** @param {import('../../compare/contract.mjs').ContentUnit} unit */
const isHeading = (unit) => unit?.kind === 'heading';

/**
 * The rule before this ticket: one heading per row, production's where it has one. Stated
 * here rather than imported, because `outlineFrom()` is the thing that changed and a probe
 * comparing a rule with itself measures nothing.
 *
 * @param {import('../../compare/text.mjs').AlignedRow} row
 */
const oldEntries = (row) => (isHeading(row.prod ?? row.new) ? 1 : 0);

/**
 * The rule this ticket writes: every heading in production's run, and the new site's only
 * where production holds none — a regrouped row is the place on the page for a run of blocks
 * and not for one block, and production is the reference where both sides have one.
 *
 * @param {import('../../compare/text.mjs').AlignedRow} row
 */
const newEntries = (row) =>
  (row.prodRun ?? [row.prod]).filter(isHeading).length ||
  (row.newRun ?? [row.new]).filter(isHeading).length;

/** @type {Map<string, { rows: number, headed: number, gained: number }>} */
const byStore = new Map();
/** @type {Map<string, number>} */
const byDetail = new Map();
let rows = 0;
let headed = 0;
let gained = 0;

for (const file of await jsonFiles(EXTRACTS)) {
  const sides = JSON.parse(await readFile(file, 'utf8'));
  if (!sides.production?.elements || !sides.new?.elements) continue;

  const store = sides.production.store;
  const page = sides.production.page;
  const store_ = byStore.get(store) ?? { rows: 0, headed: 0, gained: 0 };
  byStore.set(store, store_);

  for (const row of diffRows(sides.production, sides.new)) {
    if (row.class !== 'regrouped') continue;
    rows += 1;
    store_.rows += 1;

    const prodSide = row.prodRun ?? [row.prod];
    const newSide = row.newRun ?? [row.new];
    const held = newEntries(row);
    if (held === 0) continue;

    headed += 1;
    store_.headed += 1;
    const moved = held - oldEntries(row);
    gained += moved;
    store_.gained += moved;

    const holder = prodSide.some(isHeading) ? prodSide : newSide;
    const side = holder === prodSide ? 'production' : 'the new site';
    const at = holder.findIndex(isHeading);
    const detail = `${prodSide.map((one) => one.tag).join(' + ')} → ${newSide.map((one) => one.tag).join(' + ')}`;
    byDetail.set(detail, (byDetail.get(detail) ?? 0) + 1);
    console.log(
      [
        `${store}/${page}`,
        detail,
        `heading on ${side}, member ${at}`,
        `entries ${oldEntries(row)} → ${held}`,
        `anchor ${JSON.stringify(row.anchorHeading)}`,
      ].join(' | '),
    );
  }

  if (page?.endsWith(NAMED)) {
    console.log(`\n--- ${store}/${page}, the page the ticket names`);
    for (const row of diffRows(sides.production, sides.new)) {
      if (!row.class) continue;
      const detail = row.prodRun
        ? `${row.prodRun.map((one) => one.tag).join(' + ')} → ${row.new?.tag}`
        : row.newRun
          ? `${row.prod?.tag} → ${row.newRun.map((one) => one.tag).join(' + ')}`
          : `${row.prod?.tag ?? '—'} → ${row.new?.tag ?? '—'}`;
      console.log(
        `  ${row.class} | ${detail} | ${JSON.stringify((row.prod ?? row.new).raw.slice(0, 60))}`,
      );
    }
    console.log('');
  }
}

console.log('\n--- per store: regrouped rows, rows holding a heading, jump-list entries gained');
for (const [store, counts] of [...byStore].sort()) {
  console.log(`${store} | ${counts.rows} | ${counts.headed} | +${counts.gained}`);
}
console.log(`all | ${rows} | ${headed} | +${gained}`);

console.log('\n--- the shapes that hold a heading');
for (const [detail, times] of [...byDetail].sort((a, b) => b[1] - a[1])) {
  console.log(`${detail} | ${times}`);
}
