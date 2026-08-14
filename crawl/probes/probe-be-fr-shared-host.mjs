// THROWAWAY probe for ticket 38 — the be/be_fr shared-host blind spot.
//
// `cross-store-link` compares hosts and not stores, because `be` and `be_fr`
// share one host (`m2stagingbe.intern.systems`) and a store-based test would
// report every be_fr page against itself. The cost of that decision is a blind
// spot: a French page that links into the Dutch Belgian half of the same host is
// not flagged.
//
// This probe measures the size of the blind spot. A be_fr page lives under
// `/fr/`, so a be_fr anchor whose target is on the shared host and whose path
// does **not** start with `/fr/` leaves the French store unnoticed.
//
// The rule runs on the new side only, so the new side is the number that
// decides. The production side is printed beside it, because production shares a
// host too (`www.tuinmaximaal.be`) and the same shape can exist there.
//
// Reads `data/extract/` from disk. No network.
//
//   node crawl/probes/probe-be-fr-shared-host.mjs
import { readdir, readFile } from 'node:fs/promises';

const EXTRACTS = new URL('../../data/extract/be_fr/', import.meta.url);

async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await jsonFiles(new URL(`${entry.name}/`, dir))));
    else if (entry.name.endsWith('.json')) out.push(new URL(entry.name, dir));
  }
  return out;
}

const files = await jsonFiles(EXTRACTS);
const tally = {
  production: { anchors: 0, sharedHost: 0, leaves: 0, pages: new Set(), targets: new Map() },
  new: { anchors: 0, sharedHost: 0, leaves: 0, pages: new Set(), targets: new Map() },
};

for (const file of files) {
  const sides = JSON.parse(await readFile(file, 'utf8'));
  for (const side of ['production', 'new']) {
    const extract = sides[side];
    const ownHost = new URL(extract.url).host.toLowerCase();
    const count = tally[side];

    for (const link of extract.links) {
      count.anchors += 1;
      if (!link.url) continue;
      let target;
      try {
        target = new URL(link.url);
      } catch {
        continue;
      }
      if (target.host.toLowerCase() !== ownHost) continue;
      count.sharedHost += 1;

      // `/fr` alone is the French home page, so the test is the segment and not
      // the string prefix: `/france-x` is not inside the French store.
      const path = target.pathname.toLowerCase();
      if (path === '/fr' || path.startsWith('/fr/')) continue;

      count.leaves += 1;
      count.pages.add(extract.page);
      count.targets.set(link.key, (count.targets.get(link.key) ?? 0) + 1);
    }
  }
}

console.log(`be_fr: ${files.length} pages on disk.\n`);
for (const side of ['production', 'new']) {
  const count = tally[side];
  console.log(
    `${side.padEnd(11)} ${count.anchors} anchors, ${count.sharedHost} on the shared host, ` +
      `${count.leaves} of them outside /fr, on ${count.pages.size} pages ` +
      `(${count.targets.size} distinct targets).`,
  );
}

// A `/media/` target is a file the two stores share, never a store page of the
// other store. `cross-store-link` is a statement about pages, so the two are
// counted apart or the headline number says something it does not mean.
const isMedia = (key) => /\/media\//.test(key);

for (const side of ['production', 'new']) {
  const targets = [...tally[side].targets].sort((a, b) => b[1] - a[1]);
  const pages = targets.filter(([key]) => !isMedia(key));
  const media = targets.filter(([key]) => isMedia(key));
  const sum = (list) => list.reduce((total, [, n]) => total + n, 0);

  console.log(
    `\n${side}: ${sum(pages)} anchors to a page of the other store, ` +
      `${sum(media)} to a shared /media/ file.`,
  );
  for (const [key, n] of pages) console.log(`  ${String(n).padStart(4)}  ${key}`);
}
