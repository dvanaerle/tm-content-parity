// THROWAWAY probe for ticket 61 — what the three invisible characters cost.
//
// The ticket's last box says the findings these characters caused are gone, and
// that no other finding count moves. This measures both, offline, on the corpus
// in `data/extract/`.
//
// It re-normalises every stored extract with the tier 1 of the day it runs, then
// compares each page twice: once as stored, once re-normalised. The delta is the
// answer. It never fetches, so it measures the corpus and not the live site.
//
// Why re-normalising a stored extract is honest: the old tier 1 left a hex
// entity, a zero-width character and a soft hyphen in `norm` untouched, so no
// information the new fold needs was lost when the corpus was written. The
// content unit is rebuilt from its `raw`, which is the parser's own text.
//
//   node crawl/probes/probe-tier1-gaps.mjs
import { readFile, readdir } from 'node:fs/promises';
import { comparePage, newSitePathsFor } from '../../compare/30-compare.mjs';
import { tier1 } from '../normalise.mjs';

const ROOT = new URL('../../', import.meta.url);

/** The characters ticket 61 adds to the fold. */
const GAPS = [
  ['a hexadecimal entity', /&#x[0-9a-f]+;/i],
  ['a zero-width space', /\u200b/],
  ['a zero-width non-joiner', /\u200c/],
  ['a zero-width joiner', /\u200d/],
  ['a soft hyphen', /\u00ad/],
  ['a soft-hyphen entity', /&shy;/i],
  ['another Unicode space', /[\u1680\u2000-\u200a\u2028\u2029\u205f\u3000]/],
];

const fold = (value) => (value == null ? value : tier1(value));

/** @param {import('../../compare/contract.mjs').PageExtract} side */
function renormalise(side) {
  return {
    ...side,
    // The unit rule of `contentUnit()`: a norm under two characters, or one with
    // no letter and no digit, is not a unit. The fold can empty a unit, so the
    // rule is asked again here.
    elements: side.elements
      .map((unit) => ({ ...unit, norm: tier1(unit.raw) }))
      .filter((unit) => unit.norm.length >= 2 && /[\p{L}\p{N}]/u.test(unit.norm))
      .map((unit, index) => ({ ...unit, index })),
    links: side.links.map((link) => ({ ...link, text: fold(link.text) })),
    images: side.images.map((image) => ({ ...image, alt: fold(image.alt) })),
    meta: {
      ...side.meta,
      title: fold(side.meta.title),
      description: fold(side.meta.description),
      h1: fold(side.meta.h1),
    },
  };
}

const carries = (side) => {
  const texts = [
    ...side.elements.map((unit) => unit.raw),
    ...side.links.map((link) => link.text),
    ...side.images.map((image) => image.alt),
    side.meta.title,
    side.meta.description,
    side.meta.h1,
  ].filter(Boolean);
  return GAPS.filter(([, pattern]) => texts.some((text) => pattern.test(text))).map(
    ([name]) => name,
  );
};

/** One fixed id, so the two reports of a page differ only where the fold does. */
const OBSERVATION = '00000000-0000-0000-0000-000000000061';

const counts = { before: new Map(), after: new Map() };
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const carriers = new Map();
const gone = [];
const arrived = [];
let pages = 0;

// The extract tree nests: a page under a category is a file in a directory named
// after it. Walking only the store directories misses those pages.
async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await jsonFiles(new URL(`${entry.name}/`, dir))));
    else if (entry.name.endsWith('.json')) out.push(new URL(entry.name, dir));
  }
  return out;
}

// The same two inputs the batch passes, so the counts below are the report's own
// and not a smaller comparison that leaves the link checks out.
const seeds = JSON.parse(await readFile(new URL('data/10-store-seeds.json', ROOT), 'utf8'));
const statuses = new Map(
  Object.entries(JSON.parse(await readFile(new URL('data/link-status.json', ROOT), 'utf8'))),
);
/** @type {Map<string, Set<string>>} */
const pathsByStore = new Map();

for (const file of await jsonFiles(new URL('data/extract/', ROOT))) {
  const stored = JSON.parse(await readFile(file, 'utf8'));
  const store = stored.production.store;
  if (!pathsByStore.has(store)) pathsByStore.set(store, newSitePathsFor(seeds, store));
  const shared = { newSitePaths: pathsByStore.get(store), statuses, observationId: OBSERVATION };
  pages += 1;

  const found = new Set([...carries(stored.production), ...carries(stored.new)]);
  for (const name of found) bump(carriers, name);

  const before = comparePage({ sides: stored, ...shared });
  const after = comparePage({
    sides: { production: renormalise(stored.production), new: renormalise(stored.new) },
    ...shared,
  });
  for (const finding of before.findings) bump(counts.before, finding.class);
  for (const finding of after.findings) bump(counts.after, finding.class);

  const ids = (report) => new Set(report.findings.map((finding) => finding.id));
  const [was, is] = [ids(before), ids(after)];
  const where = `${store}/${stored.production.page}`;
  for (const finding of before.findings) {
    if (!is.has(finding.id)) gone.push({ where, finding, carried: [...found] });
  }
  for (const finding of after.findings) {
    if (!was.has(finding.id)) arrived.push({ where, finding, carried: [...found] });
  }
}

console.log(`\n${pages} pages in the corpus.\n`);

console.log('Pages that carry each character:');
for (const [name] of GAPS) console.log(`  ${String(carriers.get(name) ?? 0).padStart(5)}  ${name}`);

console.log('\n| class | before | after | delta |');
console.log('|---|---|---|---|');
for (const key of [...new Set([...counts.before.keys(), ...counts.after.keys()])].sort()) {
  const [was, is] = [counts.before.get(key) ?? 0, counts.after.get(key) ?? 0];
  console.log(`| ${key} | ${was} | ${is} | ${is - was >= 0 ? '+' : ''}${is - was} |`);
}
const total = (map) => [...map.values()].reduce((sum, n) => sum + n, 0);
console.log(
  `| **all** | ${total(counts.before)} | ${total(counts.after)} |` +
    ` ${total(counts.after) - total(counts.before)} |`,
);

// A finding that goes without the page carrying one of the characters is the
// thing the ticket forbids. It is counted apart, and named.
const unexplained = [...gone, ...arrived].filter((row) => row.carried.length === 0);
console.log(
  `\n${gone.length} findings gone, ${arrived.length} arrived,` +
    ` ${unexplained.length} on a page that carries none of the characters.`,
);

for (const [label, rows] of [
  ['GONE', gone],
  ['ARRIVED', arrived],
]) {
  for (const row of rows) {
    console.log(
      `  ${label} ${row.where} ${row.finding.class} ${row.finding.check}` +
        ` — ${JSON.stringify(row.finding.prod ?? '')} vs ${JSON.stringify(row.finding.new ?? '')}` +
        `${row.carried.length ? ` [${row.carried.join(', ')}]` : ' [NOTHING EXPLAINS THIS]'}`,
    );
  }
}
