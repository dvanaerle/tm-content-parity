// THROWAWAY probe for ticket 06 - image matching and alt text facts.
// NL store only, both sites, plain fetch, concurrency 8.
//
// Production may be in maintenance mode. A maintenance page is detected and the
// run aborts loudly rather than recording phantom "0 images" pages.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';

const CONCURRENCY = 8;
// Ticket 02's trimmed chrome list, with [class*="breadcrumb"] restored by 14.
const CHROME = [
  'header',
  'footer',
  'nav',
  'form',
  'script',
  'style',
  'noscript',
  '[class*="breadcrumb"]',
  '[class*="menu"]',
  '[role="dialog"]',
];
// Ticket 14: without this the new site's <body>/<header> are silently deleted.
const PARSE_OPTIONS = { closeAllByClosing: true };

const seeds = JSON.parse(
  readFileSync(new URL('../../data/10-store-seeds.json', import.meta.url), 'utf8'),
);

const jobs = [];
for (const row of seeds.rows) {
  const cell = row.stores?.nl;
  if (!cell) continue;
  jobs.push({ page: row.page, prodUrl: cell.prodUrl, newUrl: cell.newUrl });
}
console.log(`nl pages: ${jobs.length} (${jobs.length * 2} requests)`);

// ---- maintenance
const MAINT = [
  /Service\s+Temporarily\s+Unavailable/i,
  /maintenance/i,
  /There has been an error processing your request/i,
  /Error log record number/i,
  /autoload\.php/i,
];
function maintenanceReason(status, html) {
  if (status === 503) return `HTTP 503`;
  if (status === 500) return `HTTP 500`;
  if (html.length < 8000) {
    for (const re of MAINT) if (re.test(html)) return `body matches ${re}`;
  }
  return null;
}

// ---- extraction
function basenameOf(src) {
  const noQuery = src.split('#')[0].split('?')[0];
  let base = noQuery.split('/').pop() ?? '';
  try {
    base = decodeURIComponent(base);
  } catch {
    /* keep raw */
  }
  return base;
}
const stripExt = (b) => b.replace(/\.[a-z0-9]{2,5}$/i, '');
// (d) lowercase, strip trailing _1 / -1 / _1_ / _NNNxNNN / -NNNxNNN / @2x
function loose(base) {
  let s = stripExt(base).toLowerCase();
  for (let prev = null; prev !== s;) {
    prev = s;
    s = s
      .replace(/[_-]\d+x\d+$/, '')
      .replace(/@\d+x$/, '')
      .replace(/[_-]\d{1,2}_?$/, '')
      .replace(/[_-]$/, '');
  }
  return s;
}

function classifyPath(pathname) {
  if (/^\/cdn-cgi\/image\//i.test(pathname)) return 'cdn-cgi';
  if (/\/media\/catalog\/.*\/cache\//i.test(pathname)) return 'catalog-cache';
  if (/\/media\/catalog\//i.test(pathname)) return 'catalog-nocache';
  if (/\/media\/wysiwyg\/tm\//i.test(pathname)) return 'wysiwyg-tm';
  if (/\/media\/wysiwyg\//i.test(pathname)) return 'wysiwyg-other';
  if (/\/media\/.*\/cache\//i.test(pathname)) return 'media-cache';
  if (/\/media\//i.test(pathname)) return 'media-other';
  if (/\/static\//i.test(pathname)) return 'static';
  return 'other';
}

function extract(html, origin) {
  const root = parse(html, PARSE_OPTIONS);
  const body = root.querySelector('body');
  const main = root.querySelector('main');
  const hasMain = Boolean(main);
  const hasBody = Boolean(body);
  const allImgs = (body ?? root).querySelectorAll('img').length;

  let scope = main ?? body ?? root;
  if (!main) for (const sel of CHROME) for (const n of scope.querySelectorAll(sel)) n.remove();

  const sources = scope.querySelectorAll('source').length;
  const imgs = [];
  for (const [i, img] of scope.querySelectorAll('img').entries()) {
    const rawSrc = img.getAttribute('src');
    const dataSrc =
      img.getAttribute('data-src') ??
      img.getAttribute('data-original') ??
      img.getAttribute('data-lazy-src');
    const src = (rawSrc ?? dataSrc ?? '').trim();
    const isData = /^data:/i.test(src);
    let pathname = src;
    let host = '';
    if (!isData && src) {
      try {
        const u = new URL(src, origin);
        pathname = u.pathname;
        host = u.host;
      } catch {
        /* keep raw */
      }
    }
    const base = isData ? '' : basenameOf(pathname);
    const altAttr = img.getAttribute('alt');
    const parentTag = img.parentNode?.rawTagName ?? '';
    imgs.push({
      index: i,
      src,
      host,
      pathname: isData ? 'data:' : pathname,
      urlKind: isData ? 'data-uri' : src ? classifyPath(pathname) : 'none',
      base,
      noExt: stripExt(base),
      loose: loose(base),
      ext: (base.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? '').toLowerCase(),
      hasSrc: rawSrc != null && rawSrc.trim() !== '',
      hasDataSrc: dataSrc != null && dataSrc.trim() !== '',
      srcset: img.getAttribute('srcset') != null,
      loading: img.getAttribute('loading') ?? null,
      inPicture: parentTag.toLowerCase() === 'picture',
      alt: altAttr == null ? null : altAttr.replace(/\s+/g, ' ').trim(),
      altMissing: altAttr == null,
      width: img.getAttribute('width') ?? null,
      height: img.getAttribute('height') ?? null,
    });
  }
  return { hasMain, hasBody, allImgs, sources, imgs };
}

// ---- fetch
async function get(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (content-parity-images; internal)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(60000),
  });
  const html = await response.text();
  return { status: response.status, html, finalUrl: response.url };
}

const pages = [];
const queue = jobs.slice();
const maintenanceHits = [];
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const record = { page: job.page, prodUrl: job.prodUrl, newUrl: job.newUrl };
      for (const [side, url] of [
        ['prod', job.prodUrl],
        ['new', job.newUrl],
      ]) {
        try {
          const { status, html, finalUrl } = await get(url);
          const reason = maintenanceReason(status, html);
          if (reason && side === 'prod') maintenanceHits.push(`${job.page} :: ${reason}`);
          record[side] = { status, finalUrl, bytes: html.length, maintenance: reason };
          if (status === 200 && !reason) Object.assign(record[side], extract(html, url));
        } catch (error) {
          record[side] = { status: String(error.cause?.code ?? error.name), error: true };
        }
      }
      pages.push(record);
      if (++done % 25 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  }),
);

if (maintenanceHits.length > 3) {
  console.error(`\n!!! PRODUCTION IS IN MAINTENANCE MODE — ${maintenanceHits.length} pages !!!`);
  console.error(maintenanceHits.slice(0, 10).join('\n'));
  process.exit(1);
}

// ---- analysis
const usable = pages.filter((p) => p.prod?.imgs && p.new?.imgs);
const skipped = pages.filter((p) => !(p.prod?.imgs && p.new?.imgs));

const blank = () => ({
  pages: 0,
  inMain: 0,
  outsideMain: 0,
  allImgs: 0,
  sources: 0,
  noMain: 0,
  noBody: 0,
  urlKinds: {},
  exts: {},
  hasSrc: 0,
  onlyDataSrc: 0,
  neither: 0,
  srcset: 0,
  lazy: 0,
  eager: 0,
  inPicture: 0,
  dataUri: 0,
  svg: 0,
  raster: 0,
  altMissing: 0,
  altEmpty: 0,
  altText: 0,
  width: 0,
  height: 0,
  bothDims: 0,
  hosts: {},
});
const stats = { prod: blank(), new: blank() };
const bump = (map, key) => {
  map[key] = (map[key] ?? 0) + 1;
};

for (const p of usable) {
  for (const side of ['prod', 'new']) {
    const s = stats[side];
    const d = p[side];
    s.pages++;
    s.inMain += d.imgs.length;
    s.allImgs += d.allImgs;
    s.outsideMain += Math.max(0, d.allImgs - d.imgs.length);
    s.sources += d.sources;
    if (!d.hasMain) s.noMain++;
    if (!d.hasBody) s.noBody++;
    for (const img of d.imgs) {
      bump(s.urlKinds, img.urlKind);
      bump(s.exts, img.ext || '(none)');
      if (img.host) bump(s.hosts, img.host);
      if (img.hasSrc) s.hasSrc++;
      else if (img.hasDataSrc) s.onlyDataSrc++;
      else s.neither++;
      if (img.srcset) s.srcset++;
      if (img.loading === 'lazy') s.lazy++;
      if (img.loading === 'eager') s.eager++;
      if (img.inPicture) s.inPicture++;
      if (img.urlKind === 'data-uri') s.dataUri++;
      else if (img.ext === 'svg') s.svg++;
      else s.raster++;
      if (img.altMissing) s.altMissing++;
      else if (img.alt === '') s.altEmpty++;
      else s.altText++;
      if (img.width != null) s.width++;
      if (img.height != null) s.height++;
      if (img.width != null && img.height != null) s.bothDims++;
    }
  }
}

// ---- match strategies (multiset intersection per page)
const STRATEGIES = {
  path: (i) => i.pathname,
  base: (i) => i.base,
  noExt: (i) => i.noExt,
  loose: (i) => i.loose,
};
const matchTotals = Object.fromEntries(Object.keys(STRATEGIES).map((k) => [k, 0]));
const perPageMatches = [];
let ambiguousPagesProd = 0;
let ambiguousPagesNew = 0;
let ambiguousBasenamesProd = 0;
let ambiguousBasenamesNew = 0;
const ambiguousExamples = [];

const counter = (list, fn) => {
  const m = new Map();
  for (const i of list) m.set(fn(i), (m.get(fn(i)) ?? 0) + 1);
  return m;
};

for (const p of usable) {
  const row = { page: p.page, prod: p.prod.imgs.length, new: p.new.imgs.length };
  for (const [name, fn] of Object.entries(STRATEGIES)) {
    const a = counter(p.prod.imgs, fn);
    const b = counter(p.new.imgs, fn);
    let n = 0;
    for (const [k, v] of a) if (b.has(k)) n += Math.min(v, b.get(k));
    matchTotals[name] += n;
    row[name] = n;
  }
  // ambiguity: same basename, more than one DISTINCT full path on the page
  for (const side of ['prod', 'new']) {
    const byBase = new Map();
    for (const i of p[side].imgs) {
      if (!byBase.has(i.base)) byBase.set(i.base, new Set());
      byBase.get(i.base).add(i.pathname);
    }
    let amb = 0;
    for (const [b, paths] of byBase) {
      if (paths.size > 1) {
        amb++;
        if (ambiguousExamples.length < 25) {
          ambiguousExamples.push(`${side} | ${p.page} | ${b} -> ${[...paths].join('  ||  ')}`);
        }
      }
    }
    if (side === 'prod') {
      ambiguousBasenamesProd += amb;
      if (amb) ambiguousPagesProd++;
    } else {
      ambiguousBasenamesNew += amb;
      if (amb) ambiguousPagesNew++;
    }
  }
  perPageMatches.push(row);
}

// ---- alt comparison among basename-matched pairs
const alt = {
  pairs: 0,
  identical: 0,
  differing: 0,
  prodHasNewLost: 0,
  newHasProdLost: 0,
  bothEmpty: 0,
  bothMissing: 0,
};
const altExamples = [];
for (const p of usable) {
  const byBaseNew = new Map();
  for (const i of p.new.imgs) {
    if (!byBaseNew.has(i.base)) byBaseNew.set(i.base, []);
    byBaseNew.get(i.base).push(i);
  }
  const used = new Map();
  for (const pi of p.prod.imgs) {
    const list = byBaseNew.get(pi.base);
    if (!list) continue;
    const at = used.get(pi.base) ?? 0;
    if (at >= list.length) continue;
    used.set(pi.base, at + 1);
    const ni = list[at];
    alt.pairs++;
    const pa = pi.alt; // null = attribute missing
    const na = ni.alt;
    const pHas = pa != null && pa !== '';
    const nHas = na != null && na !== '';
    if (pa === na) {
      if (pa == null) alt.bothMissing++;
      else if (pa === '') alt.bothEmpty++;
      else alt.identical++;
    } else if (pHas && !nHas) {
      alt.prodHasNewLost++;
      if (altExamples.length < 25)
        altExamples.push(
          `LOST  ${p.page} | ${pi.base} | prod="${pa}" new=${na === null ? '(no attr)' : '""'}`,
        );
    } else if (!pHas && nHas) {
      alt.newHasProdLost++;
    } else if (pHas && nHas) {
      alt.differing++;
      if (altExamples.length < 25)
        altExamples.push(`DIFF  ${p.page} | ${pi.base} | prod="${pa}" new="${na}"`);
    } else {
      // one is null, the other "" — both effectively empty
      alt.bothEmpty++;
    }
  }
}
// identical count above only counts non-empty identical; expose both-empty too
alt.identicalIncludingEmpty = alt.identical + alt.bothEmpty + alt.bothMissing;

// ---- repeats: same src repeated on one page
const repeatDist = { prod: {}, new: {} };
const worst = [];
for (const p of usable) {
  for (const side of ['prod', 'new']) {
    const c = counter(p[side].imgs, (i) => i.pathname);
    for (const [k, v] of c) {
      bump(repeatDist[side], v >= 10 ? '10+' : String(v));
      if (v >= 4) worst.push({ side, page: p.page, count: v, path: k });
    }
  }
}
worst.sort((a, b) => b.count - a.count);

// ---- reporting
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
const top = (obj, n = 12) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `    ${String(v).padStart(6)}  ${k}`)
    .join('\n');

const L = [];
L.push(`pages fetched      ${pages.length}`);
L.push(`usable pairs       ${usable.length}`);
L.push(`skipped            ${skipped.length}`);
if (skipped.length)
  L.push(skipped.map((p) => `  ${p.page} prod=${p.prod?.status} new=${p.new?.status}`).join('\n'));
L.push(`prod maintenance   ${maintenanceHits.length}`);

for (const side of ['prod', 'new']) {
  const s = stats[side];
  L.push(`\n=== ${side.toUpperCase()} ===`);
  L.push(`  img in <main>          ${s.inMain}`);
  L.push(`  img in whole <body>    ${s.allImgs}`);
  L.push(`  img outside <main>     ${s.outsideMain}  (${pct(s.outsideMain, s.allImgs)})`);
  L.push(`  <source> in main       ${s.sources}`);
  L.push(`  pages with no <main>   ${s.noMain}   no <body> ${s.noBody}`);
  L.push(
    `  src present            ${s.hasSrc}  only data-src ${s.onlyDataSrc}  neither ${s.neither}`,
  );
  L.push(`  srcset                 ${s.srcset}`);
  L.push(`  loading=lazy           ${s.lazy}   eager ${s.eager}`);
  L.push(`  inside <picture>       ${s.inPicture}`);
  L.push(`  data: URI              ${s.dataUri}   svg ${s.svg}   raster ${s.raster}`);
  L.push(
    `  alt missing            ${s.altMissing}   alt="" ${s.altEmpty}   alt non-empty ${s.altText}`,
  );
  L.push(`  width attr             ${s.width}   height attr ${s.height}   both ${s.bothDims}`);
  L.push(`  url kinds:\n${top(s.urlKinds)}`);
  L.push(`  extensions:\n${top(s.exts, 10)}`);
  L.push(`  hosts:\n${top(s.hosts, 8)}`);
}

L.push(`\n=== MATCH STRATEGIES (site-wide matched image count) ===`);
L.push(`  prod images ${stats.prod.inMain}   new images ${stats.new.inMain}`);
for (const k of Object.keys(STRATEGIES)) {
  L.push(
    `  ${k.padEnd(8)} ${String(matchTotals[k]).padStart(6)}   ${pct(matchTotals[k], stats.prod.inMain)} of prod   ${pct(matchTotals[k], stats.new.inMain)} of new`,
  );
}
L.push(`\n=== AMBIGUOUS BASENAMES (same basename, >1 distinct path on a page) ===`);
L.push(`  prod: ${ambiguousBasenamesProd} basenames on ${ambiguousPagesProd} pages`);
L.push(`  new:  ${ambiguousBasenamesNew} basenames on ${ambiguousPagesNew} pages`);
L.push(ambiguousExamples.slice(0, 12).join('\n'));

L.push(`\n=== ALT AMONG BASENAME-MATCHED PAIRS ===`);
L.push(`  pairs                ${alt.pairs}`);
L.push(`  identical (non-empty) ${alt.identical}`);
L.push(`  both alt=""          ${alt.bothEmpty}`);
L.push(`  both alt missing     ${alt.bothMissing}`);
L.push(`  differing            ${alt.differing}`);
L.push(`  prod-has / new-lost  ${alt.prodHasNewLost}`);
L.push(`  new-has / prod-lost  ${alt.newHasProdLost}`);
L.push(altExamples.slice(0, 15).join('\n'));

L.push(`\n=== REPEAT DISTRIBUTION (occurrences of one src on one page) ===`);
for (const side of ['prod', 'new']) {
  L.push(
    `  ${side}: ` +
      Object.entries(repeatDist[side])
        .sort((a, b) => Number(a[0].replace('+', '')) - Number(b[0].replace('+', '')))
        .map(([k, v]) => `${k}x:${v}`)
        .join('  '),
  );
}
L.push(`  worst offenders:`);
L.push(
  worst
    .slice(0, 20)
    .map((w) => `    ${String(w.count).padStart(3)}x  ${w.side}  ${w.page}  ${w.path}`)
    .join('\n'),
);

const report = L.join('\n');
console.log(report);

writeFileSync(
  new URL('../../data/probe-images.json', import.meta.url),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      store: 'nl',
      totals: { fetched: pages.length, usable: usable.length, skipped: skipped.length },
      maintenanceHits,
      skipped: skipped.map((p) => ({ page: p.page, prod: p.prod?.status, new: p.new?.status })),
      stats,
      matchTotals,
      perPageMatches,
      ambiguity: {
        prodBasenames: ambiguousBasenamesProd,
        prodPages: ambiguousPagesProd,
        newBasenames: ambiguousBasenamesNew,
        newPages: ambiguousPagesNew,
        examples: ambiguousExamples,
      },
      alt,
      altExamples,
      repeatDist,
      worstRepeats: worst.slice(0, 60),
      pages: pages.map((p) => ({
        page: p.page,
        prod: p.prod?.imgs
          ? { status: p.prod.status, hasMain: p.prod.hasMain, imgs: p.prod.imgs }
          : { status: p.prod?.status },
        new: p.new?.imgs
          ? { status: p.new.status, hasMain: p.new.hasMain, imgs: p.new.imgs }
          : { status: p.new?.status },
      })),
    },
    null,
    2,
  ),
);
console.log('\nwrote data/probe-images.json');
