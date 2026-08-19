/**
 * THROWAWAY probe for gallery ticket 02 — do the two sites serve the same photo
 * bytes? It writes a measurement into `data/`; nothing in the comparison reads it.
 * Do not import this file.
 *
 *   node crawl/probes/probe-gallery-image-bytes.mjs
 *
 * Gallery pages only, both sides. It digests the **original** each photo opens
 * to: production's `<img src>` is a `/media/resized/253x168/…` thumbnail, and
 * digesting a thumbnail against a full-size original would answer "a different
 * photograph" with total confidence and no truth in it. Ticket 01 put that
 * original on the image record as `fullSrc`, so extraction supplies it.
 *
 * A photo no opening link wraps has no original, and falls back to its `<img src>`.
 * That is the trap the paragraph above names, so the fallback is counted per page
 * and reported rather than hidden: a figure it touches has to say so.
 *
 * Re-running reuses the digests already in the written file. The image bytes are
 * the expensive half of the run and they do not change between analyses. A url
 * that failed is cached as a failure and not retried; delete the file to retry it.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { extractPage } from '../extract.mjs';
import { fetchPage } from '../fetch-page.mjs';

const SEEDS = new URL('../../data/10-store-seeds.json', import.meta.url);
const OUT = new URL('../../data/probe-gallery-image-bytes.json', import.meta.url);
const PAGE_CONCURRENCY = 6;
const IMAGE_CONCURRENCY = 12;

/**
 * A gallery url key is localised in every store — `fotogalerij`, `fotogalerie`,
 * `galerie`, `photo-gallery` and their `algemene-`/`general-` siblings — so the
 * root segment is matched by shape rather than listed. `be_fr` carries a `/fr/`
 * prefix that the `fr` store does not.
 *
 * @param {string} path
 * @returns {string[] | null} The segments below the store, or null if not a gallery.
 */
function gallerySegments(path) {
  const segments = path.toLowerCase().split('/').filter(Boolean);
  const rooted = segments[0] === 'fr' ? segments.slice(1) : segments;
  return /galerij|galerie|gallery/.test(rooted[0] ?? '') ? rooted : null;
}

function galleryJobs() {
  const seeds = JSON.parse(readFileSync(SEEDS, 'utf8'));
  const jobs = [];
  for (const row of seeds.rows) {
    for (const [store, cell] of Object.entries(row.stores)) {
      const segments = cell && gallerySegments(cell.path);
      if (!segments) continue;
      jobs.push({
        store,
        page: row.page,
        path: cell.path,
        prodUrl: cell.prodUrl,
        newUrl: cell.newUrl,
        // A general gallery page is the album index; anything deeper is an album.
        kind: segments.length === 1 ? 'general' : 'album',
      });
    }
  }
  return jobs;
}

/**
 * The photos one side shows, each with the address of its original.
 *
 * @param {string} html
 * @param {object} context Everything `extractPage` needs, including `url`.
 * @returns {{ key: string, origin: string, fromOpeningLink: boolean }[]}
 */
function photos(html, context) {
  const extract = extractPage(html, { ...context, onWarn: () => {} });
  const found = [];
  for (const image of extract.images) {
    // Both are raw as the page sends them, so both resolve against the page url.
    const raw = image.fullSrc ?? image.src;
    let origin;
    try {
      origin = new URL(raw, context.url).href;
    } catch {
      continue;
    }
    found.push({ key: image.key, origin, fromOpeningLink: image.fullSrc != null });
  }
  return found;
}

/**
 * @param {object} work
 * @param {number} work.concurrency
 * @param {any[]} work.items
 * @param {(item: any) => Promise<void>} work.run
 */
async function inParallel({ concurrency, items, run }) {
  const queue = items.slice();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await run(item);
    }),
  );
}

// ---- pages

const jobs = galleryJobs();
console.log(`gallery store pages: ${jobs.length} (${jobs.length * 2} page requests)`);

const pages = [];
let fetched = 0;
await inParallel({
  concurrency: PAGE_CONCURRENCY,
  items: jobs,
  run: async (job) => {
    const record = { ...job, sides: {} };
    const hosts = { prodHost: new URL(job.prodUrl).host, newHost: new URL(job.newUrl).host };
    for (const [side, url] of [
      ['production', job.prodUrl],
      ['new', job.newUrl],
    ]) {
      try {
        const { status, html } = await fetchPage(url);
        record.sides[side] =
          status === 200
            ? {
                status,
                photos: photos(html, { ...hosts, store: job.store, page: job.page, side, url }),
              }
            : { status, photos: null };
      } catch (error) {
        record.sides[side] = { status: error.name, error: error.message, photos: null };
      }
    }
    pages.push(record);
    if (++fetched % 10 === 0) console.log(`  pages ${fetched}/${jobs.length}`);
  },
});

// ---- image bytes

const warm = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')).digests ?? {}) : {};
/** @type {Map<string, { sha256: string | null, bytes: number | null, type: string | null, status: number | string }>} */
const digests = new Map(Object.entries(warm));

const wanted = new Set();
for (const page of pages) {
  for (const side of Object.values(page.sides)) {
    for (const photo of side.photos ?? []) if (!digests.has(photo.origin)) wanted.add(photo.origin);
  }
}
console.log(`image originals: ${wanted.size} to fetch, ${digests.size} reused`);

let digested = 0;
await inParallel({
  concurrency: IMAGE_CONCURRENCY,
  items: [...wanted],
  run: async (url) => {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (content-parity-gallery-bytes; internal)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(60000),
      });
      const body = Buffer.from(await response.arrayBuffer());
      digests.set(url, {
        status: response.status,
        sha256: response.ok ? createHash('sha256').update(body).digest('hex') : null,
        bytes: response.ok ? body.length : null,
        type: response.headers.get('content-type'),
      });
    } catch (error) {
      digests.set(url, {
        status: String(error.cause?.code ?? error.name),
        sha256: null,
        bytes: null,
        type: null,
      });
    }
    if (++digested % 100 === 0) console.log(`  images ${digested}/${wanted.size}`);
  },
});

// ---- pairing

/**
 * Greedy multiset pairing in document order. A photo pairs at most once, so a
 * repeated photo cannot inflate a count, and a page whose two sides hold the same
 * photograph three times reports three pairs and not nine.
 *
 * @param {any[]} left
 * @param {any[]} right
 * @param {(photo: any) => string | null} identity
 * @returns {{ left: any, right: any }[]}
 */
function pairs(left, right, identity) {
  const available = new Map();
  for (const photo of right) {
    const id = identity(photo);
    if (id == null) continue;
    if (!available.has(id)) available.set(id, []);
    available.get(id).push(photo);
  }
  const paired = [];
  for (const photo of left) {
    const id = identity(photo);
    if (id == null) continue;
    const candidates = available.get(id);
    if (candidates?.length) paired.push({ left: photo, right: candidates.shift() });
  }
  return paired;
}

const digestOf = (photo) => digests.get(photo.origin)?.sha256 ?? null;
const bytesOf = (photo) => digests.get(photo.origin)?.bytes ?? null;
const bothDigested = (pair) => Boolean(digestOf(pair.left) && digestOf(pair.right));

const rows = [];
const contentNotFilenameExamples = [];
const filenameNotContentExamples = [];

/**
 * @param {string[]} into
 * @param {string} line
 */
function sample(into, line) {
  if (into.length < 30) into.push(line);
}

for (const page of pages) {
  const production = page.sides.production;
  const newSite = page.sides.new;
  const comparable = Boolean(production.photos && newSite.photos);

  const row = {
    store: page.store,
    page: page.page,
    path: page.path,
    kind: page.kind,
    group: comparable ? page.kind : 'unreachable',
    productionStatus: production.status,
    newStatus: newSite.status,
    production: production.photos?.length ?? 0,
    new: newSite.photos?.length ?? 0,
    newRendersNothing: comparable && newSite.photos.length === 0,
  };

  if (comparable) {
    const byContent = pairs(production.photos, newSite.photos, digestOf);
    const byFilename = pairs(production.photos, newSite.photos, (photo) => photo.key);

    row.digestableProduction = production.photos.filter((photo) => digestOf(photo)).length;
    row.digestableNew = newSite.photos.filter((photo) => digestOf(photo)).length;
    row.fallbackSrcProduction = production.photos.filter((photo) => !photo.fromOpeningLink).length;
    row.fallbackSrcNew = newSite.photos.filter((photo) => !photo.fromOpeningLink).length;
    row.contentPairs = byContent.length;
    row.filenamePairs = byFilename.length;
    row.contentNotFilename = byContent.filter((pair) => pair.left.key !== pair.right.key).length;

    const filenameNotContent = byFilename.filter(
      (pair) => bothDigested(pair) && digestOf(pair.left) !== digestOf(pair.right),
    );
    row.filenameNotContent = filenameNotContent.length;
    // An equal byte length under an unequal digest is not a re-encode. It would say
    // the two files differ in a way a perceptual hash cannot be the answer to.
    row.filenameNotContentSameLength = filenameNotContent.filter(
      (pair) => bytesOf(pair.left) === bytesOf(pair.right),
    ).length;

    for (const pair of byContent) {
      if (pair.left.key !== pair.right.key) {
        sample(
          contentNotFilenameExamples,
          `${page.store}/${page.path} | ${pair.left.key}  ==  ${pair.right.key}`,
        );
      }
    }
    for (const pair of filenameNotContent) {
      sample(
        filenameNotContentExamples,
        `${page.store}/${page.path} | ${pair.left.key} | ${bytesOf(pair.left)}B vs ${bytesOf(pair.right)}B`,
      );
    }
  }
  rows.push(row);
}

const COUNTED = [
  'production',
  'new',
  'digestableProduction',
  'digestableNew',
  'fallbackSrcProduction',
  'fallbackSrcNew',
  'contentPairs',
  'filenamePairs',
  'contentNotFilename',
  'filenameNotContent',
  'filenameNotContentSameLength',
];

/**
 * @param {(row: any) => boolean} include
 * @returns {Record<string, number>}
 */
function totalsOf(include) {
  const members = rows.filter(include);
  const totals = { pages: members.length };
  for (const field of COUNTED) {
    totals[field] = members.reduce((sum, row) => sum + (row[field] ?? 0), 0);
  }
  return totals;
}

const totals = {
  album: totalsOf((row) => row.group === 'album'),
  // The one number the ticket asks the answer to rest on: album pages the new site
  // actually renders. A page rendering nothing pairs zero for a reason that is not
  // about bytes, and averaging it in hides the fact being measured.
  albumRendered: totalsOf((row) => row.group === 'album' && !row.newRendersNothing),
  general: totalsOf((row) => row.group === 'general'),
  generalRendered: totalsOf((row) => row.group === 'general' && !row.newRendersNothing),
  unreachable: totalsOf((row) => row.group === 'unreachable'),
};

const rendersNothing = rows.filter((row) => row.newRendersNothing);
const unreachable = rows.filter((row) => row.group === 'unreachable');
const failedDigests = [...digests.entries()].filter(([, digest]) => !digest.sha256);

// ---- report

const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
const lines = [];
lines.push(`\ngallery store pages ${rows.length}`);
lines.push(`image originals digested ${digests.size - failedDigests.length} of ${digests.size}`);

for (const [name, total] of Object.entries(totals)) {
  if (!total.pages) continue;
  lines.push(`\n=== ${name} (${total.pages} pages) ===`);
  lines.push(`  photos                production ${total.production}   new ${total.new}`);
  lines.push(
    `  originals digested    production ${total.digestableProduction}   new ${total.digestableNew}`,
  );
  lines.push(
    `  no original, used src production ${total.fallbackSrcProduction}   new ${total.fallbackSrcNew}`,
  );
  lines.push(
    `  pair by filename      ${total.filenamePairs}  (${pct(total.filenamePairs, total.production)} of production)`,
  );
  lines.push(
    `  pair by content       ${total.contentPairs}  (${pct(total.contentPairs, total.production)} of production)`,
  );
  lines.push(`  content, not filename ${total.contentNotFilename}`);
  lines.push(
    `  filename, not content ${total.filenameNotContent}   of which same byte length ${total.filenameNotContentSameLength}`,
  );
}

const fellBack = rows.filter((row) => row.fallbackSrcProduction || row.fallbackSrcNew);
lines.push(`\n=== no opening link, digested the <img src> instead (${fellBack.length} pages) ===`);
lines.push(
  fellBack
    .map(
      (row) =>
        `  ${row.group.padEnd(7)} ${row.store}/${row.path}  production ${row.fallbackSrcProduction} of ${row.production}   new ${row.fallbackSrcNew} of ${row.new}`,
    )
    .join('\n') || '  (none)',
);

lines.push(`\n=== NEW SITE RENDERS NO PHOTO (${rendersNothing.length}) ===`);
lines.push(
  rendersNothing
    .map((row) => `  ${row.kind.padEnd(7)} ${row.store}/${row.path}  production ${row.production}`)
    .join('\n') || '  (none)',
);

lines.push(`\n=== NOT COMPARABLE (${unreachable.length}) ===`);
lines.push(
  unreachable
    .map(
      (row) =>
        `  ${row.kind.padEnd(7)} ${row.store}/${row.path}  production ${row.productionStatus}  new ${row.newStatus}`,
    )
    .join('\n') || '  (none)',
);

lines.push(`\n=== ALBUM PAGES, WEAKEST CONTENT PAIRING FIRST ===`);
for (const row of rows
  .filter((row) => row.group === 'album')
  .sort((a, b) => a.contentPairs / (a.production || 1) - b.contentPairs / (b.production || 1))) {
  lines.push(
    `  ${row.store}/${row.path}  prod ${row.production} new ${row.new}  filename ${row.filenamePairs}  content ${row.contentPairs}`,
  );
}

lines.push(`\n=== PAIR BY CONTENT, NOT BY FILENAME ===`);
lines.push(contentNotFilenameExamples.join('\n') || '  (none)');
lines.push(`\n=== PAIR BY FILENAME, NOT BY CONTENT ===`);
lines.push(filenameNotContentExamples.join('\n') || '  (none)');

if (failedDigests.length) {
  lines.push(`\n=== ORIGINALS THAT WOULD NOT FETCH (${failedDigests.length}) ===`);
  lines.push(
    failedDigests
      .slice(0, 20)
      .map(([url, digest]) => `  ${digest.status}  ${url}`)
      .join('\n'),
  );
}

console.log(lines.join('\n'));

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      totals,
      rows,
      contentNotFilenameExamples,
      filenameNotContentExamples,
      failedDigests: failedDigests.map(([url, digest]) => ({ url, status: digest.status })),
      digests: Object.fromEntries(digests),
    },
    null,
    2,
  )}\n`,
);
console.log(`\nwrote ${OUT.pathname.split('/').pop()}`);
