// THROWAWAY probe - what does the new site's in-content link surface look like?
// New site only. Production may be in maintenance mode, so it is never touched.
//
// Classifies hrefs, it does not status-check them. Answers: how much links back
// to a live tuinmaximaal domain, how much crosses store hosts, what external
// surface exists, and which href shapes a link checker has to skip.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';

const CONCURRENCY = 8;
const CHROME = [
  'header',
  'footer',
  'nav',
  'script',
  'style',
  '[class*="menu"]',
  '[class*="cookie"]',
];
const NEW_HOSTS = new Set([
  'm2stagingnl.intern.systems',
  'm2stagingbe.intern.systems',
  'm2stagingde.intern.systems',
  'm2stagingfr.intern.systems',
  'm2staginguk.intern.systems',
]);
const LIVE = /(^|\.)tuinmaximaal\.[a-z.]+$/i;

const seeds = JSON.parse(
  readFileSync(new URL('../../data/10-store-seeds.json', import.meta.url), 'utf8'),
);

const jobs = [];
for (const row of seeds.rows) {
  for (const [store, cell] of Object.entries(row.stores)) {
    if (cell) jobs.push({ store, page: row.page, url: cell.newUrl });
  }
}
console.log(`fetching ${jobs.length} new-site urls…`);

// The new site sends malformed HTML; without closeAllByClosing the parser eats
// <body> and everything in it.
const PARSE_OPTIONS = { closeAllByClosing: true };

function anchorsOf(html, origin) {
  const root = parse(html, PARSE_OPTIONS);
  const main = root.querySelector('main') ?? root.querySelector('body') ?? root;
  for (const selector of CHROME) for (const node of main.querySelectorAll(selector)) node.remove();
  const out = [];
  for (const a of main.querySelectorAll('a[href]')) {
    const href = (a.getAttribute('href') ?? '').trim();
    if (!href) continue;
    let abs = null;
    try {
      abs = new URL(href, origin);
    } catch {
      abs = null;
    }
    out.push({ href, host: abs?.host ?? '', abs: abs?.href ?? '' });
  }
  return out;
}

const results = [];
const queue = jobs.slice();
let done = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      let status = 0;
      let anchors = [];
      try {
        const response = await fetch(job.url, {
          headers: { 'user-agent': 'Mozilla/5.0 (content-parity-links; internal)' },
          redirect: 'follow',
          signal: AbortSignal.timeout(45000),
        });
        status = response.status;
        if (status === 200) anchors = anchorsOf(await response.text(), job.url);
        else await response.body?.cancel();
      } catch (error) {
        status = String(error.cause?.code ?? error.name);
      }
      results.push({ ...job, status, anchors });
      if (++done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  }),
);

const ok = results.filter((r) => r.status === 200);
const bad = results.filter((r) => r.status !== 200);

const uniqueTargets = new Set();
let totalAnchors = 0;

const live = { pages: new Set(), targets: new Set(), examples: [] };
const cross = { pages: new Set(), targets: new Set(), examples: [] };
const externalHosts = new Map(); // host -> Set of "store|page"
const shapes = {
  mailto: 0,
  tel: 0,
  hashOnly: 0,
  protocolRelative: 0,
  javascript: 0,
  unparseable: 0,
};

for (const page of ok) {
  const ownHost = new URL(page.url).host;
  for (const a of page.anchors) {
    totalAnchors++;
    const href = a.href;

    if (/^mailto:/i.test(href)) shapes.mailto++;
    else if (/^tel:/i.test(href)) shapes.tel++;
    else if (/^javascript:/i.test(href)) shapes.javascript++;
    else if (href.startsWith('#')) shapes.hashOnly++;
    else if (href.startsWith('//')) shapes.protocolRelative++;

    if (!a.abs) {
      shapes.unparseable++;
      continue;
    }
    if (!/^https?:$/.test(new URL(a.abs).protocol)) continue;

    uniqueTargets.add(a.abs);
    const key = `${page.store}|${page.page}`;

    if (LIVE.test(a.host)) {
      live.pages.add(key);
      live.targets.add(a.abs);
      if (live.examples.length < 200) live.examples.push(`${page.store} | ${page.page} | ${href}`);
    } else if (NEW_HOSTS.has(a.host) && a.host !== ownHost) {
      cross.pages.add(key);
      cross.targets.add(a.abs);
      if (cross.examples.length < 200)
        cross.examples.push(`${page.store} | ${page.page} | ${href}`);
    } else if (a.host !== ownHost && !NEW_HOSTS.has(a.host)) {
      if (!externalHosts.has(a.host)) externalHosts.set(a.host, new Set());
      externalHosts.get(a.host).add(key);
    }
  }
}

const section = (title, body) => `\n=== ${title} ===\n${body}`;
const dedupe = (list) => [...new Set(list)];

const lines = [];
lines.push(
  section(
    'TOTALS',
    [
      `pages fetched          ${results.length}`,
      `  200                  ${ok.length}`,
      `  non-200              ${bad.length}`,
      `in-content anchors     ${totalAnchors}`,
      `unique http(s) targets ${uniqueTargets.size}`,
    ].join('\n'),
  ),
);
if (bad.length) {
  lines.push(
    section(
      'NON-200 PAGES',
      bad.map((r) => `${r.status}  ${r.store} | ${r.page} | ${r.url}`).join('\n'),
    ),
  );
}
lines.push(
  section(
    'LIVE-DOMAIN LEAKAGE (tuinmaximaal.*)',
    `pages affected ${live.pages.size} / ${ok.length}   unique targets ${live.targets.size}\n` +
      dedupe(live.examples).slice(0, 20).join('\n'),
  ),
);
lines.push(
  section(
    'CROSS-STORE LEAKAGE (other m2staging* host)',
    `pages affected ${cross.pages.size} / ${ok.length}   unique targets ${cross.targets.size}\n` +
      dedupe(cross.examples).slice(0, 20).join('\n'),
  ),
);
lines.push(
  section(
    'OTHER EXTERNAL HOSTS (top 25 by pages)',
    [...externalHosts.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 25)
      .map(([host, pages]) => `${String(pages.size).padStart(4)}  ${host}`)
      .join('\n') + `\n(total distinct external hosts: ${externalHosts.size})`,
  ),
);
lines.push(
  section(
    'SCHEME / SHAPE STATS',
    Object.entries(shapes)
      .map(([k, v]) => `${k.padEnd(18)} ${v}`)
      .join('\n'),
  ),
);

const report = lines.join('\n');
console.log(report);

writeFileSync(
  new URL('../../data/probe-link-leakage.json', import.meta.url),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      totals: {
        pagesFetched: results.length,
        ok: ok.length,
        nonOk: bad.length,
        anchors: totalAnchors,
        uniqueTargets: uniqueTargets.size,
      },
      live: { pages: live.pages.size, targets: [...live.targets], examples: dedupe(live.examples) },
      cross: {
        pages: cross.pages.size,
        targets: [...cross.targets],
        examples: dedupe(cross.examples),
      },
      externalHosts: Object.fromEntries(
        [...externalHosts.entries()]
          .sort((a, b) => b[1].size - a[1].size)
          .map(([h, p]) => [h, p.size]),
      ),
      shapes,
      nonOkPages: bad.map((r) => ({ store: r.store, page: r.page, url: r.url, status: r.status })),
    },
    null,
    2,
  ),
);
