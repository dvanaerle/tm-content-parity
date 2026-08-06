// THROWAWAY probe for ticket 33 — the exact-text pairs whose tag differs.
//
// Spec 32 measured 762 of them on 67 nl pages, 467 a heading-level change and
// 434 a `kind` change, mostly `a` -> `h3`. Ticket 33 will not trust
// `heading-level` until the `a` -> `h3` group is judged: an anchor whose text
// became a heading can be an extraction artefact rather than a content change.
//
// This probe reproduced every one of those numbers except the page count: the
// 762 are on **80** pages, not 67.
//
// Reads `data/extract/` from disk. No network.
//
//   node crawl/probes/probe-tag-changes.mjs [store]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { lcsPairs } from '../../compare/match.mjs';

const EXTRACTS = new URL('../../data/extract/', import.meta.url);
const store = process.argv[2] ?? 'nl';

async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...await jsonFiles(new URL(`${entry.name}/`, dir)));
    else if (entry.name.endsWith('.json')) out.push(new URL(entry.name, dir));
  }
  return out;
}

const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);

const files = await jsonFiles(new URL(`${store}/`, EXTRACTS));

let pages = 0;
let comparable = 0;
let exactPairs = 0;
const byTagPair = new Map();
const byKindPair = new Map();
const cases = [];
const pagesWithTagChange = new Set();
let headingLevelChanges = 0;
let kindChanges = 0;

for (const file of files) {
  const sides = JSON.parse(await readFile(file, 'utf8'));
  const { production, new: next } = sides;
  pages += 1;
  if (production.status !== 200 || next.status !== 200) continue;
  comparable += 1;

  for (const [i, j] of lcsPairs(production.elements, next.elements)) {
    const prod = production.elements[i];
    const newElement = next.elements[j];
    exactPairs += 1;
    if (prod.tag === newElement.tag) continue;

    pagesWithTagChange.add(production.page);
    bump(byTagPair, `${prod.tag} -> ${newElement.tag}`);
    bump(byKindPair, `${prod.kind} -> ${newElement.kind}`);
    if (prod.level !== newElement.level) headingLevelChanges += 1;
    if (prod.kind !== newElement.kind) kindChanges += 1;

    cases.push({
      page: production.page,
      prodTag: prod.tag,
      newTag: newElement.tag,
      prodKind: prod.kind,
      newKind: newElement.kind,
      prodLevel: prod.level,
      newLevel: newElement.level,
      prodIndex: prod.index,
      newIndex: newElement.index,
      text: prod.norm,
    });
  }
}

const sorted = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);
const table = (map, limit = 20) => sorted(map).slice(0, limit)
  .map(([key, count]) => `    ${String(count).padStart(5)}  ${key}`).join('\n');

/** A sample of one tag pair, spread over as many pages as possible. */
function sample(from, to, limit = 20) {
  const seen = new Map();
  const out = [];
  for (const row of cases) {
    if (row.prodTag !== from || row.newTag !== to) continue;
    const taken = seen.get(row.page) ?? 0;
    if (taken >= 2) continue;
    seen.set(row.page, taken + 1);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

const L = [];
L.push(`store              ${store}`);
L.push(`extract files      ${pages}`);
L.push(`both sides 200     ${comparable}`);
L.push(`exact-text pairs   ${exactPairs}`);
L.push(`  ...tag differs   ${cases.length}, on ${pagesWithTagChange.size} pages`);
L.push(`  ...level differs ${headingLevelChanges}`);
L.push(`  ...kind differs  ${kindChanges}`);
L.push(`\n=== BY TAG PAIR ===\n${table(byTagPair, 25)}`);
L.push(`\n=== BY KIND PAIR ===\n${table(byKindPair)}`);

for (const [pair] of sorted(byTagPair).slice(0, 6)) {
  const [from, to] = pair.split(' -> ');
  L.push(`\n=== SAMPLE ${pair} ===`);
  for (const row of sample(from, to)) {
    L.push(`  ${row.page} [prod ${row.prodIndex} / new ${row.newIndex}] ${JSON.stringify(row.text.slice(0, 90))}`);
  }
}

const report = L.join('\n');
console.log(report);

await writeFile(
  new URL(`../../data/probe-tag-changes-${store}.json`, import.meta.url),
  JSON.stringify({
    generated: new Date().toISOString(),
    store,
    totals: {
      pages,
      comparable,
      exactPairs,
      tagDiffers: cases.length,
      pagesWithTagChange: pagesWithTagChange.size,
      headingLevelChanges,
      kindChanges,
    },
    byTagPair: Object.fromEntries(sorted(byTagPair)),
    byKindPair: Object.fromEntries(sorted(byKindPair)),
    cases,
  }, null, 2),
);
console.log(`\nwrote data/probe-tag-changes-${store}.json`);
