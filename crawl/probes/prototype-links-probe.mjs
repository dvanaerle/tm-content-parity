// PROTOTYPE probe - how much signal is in links? One page, both sites.
import { parse } from 'node-html-parser';

const SLUG = process.argv[2] ?? 'heavy-duty-terrasoverkapping';
const SITES = {
  prod: `https://www.tuinmaximaal.nl/${SLUG}`,
  new: `https://valanticnl.intern.systems/${SLUG}`,
};

const CHROME = ['header', 'footer', 'nav', 'script', 'style', '[class*="menu"]', '[class*="cookie"]'];

function linksOf(html, origin) {
  const root = parse(html);
  const main = root.querySelector('main') ?? root.querySelector('body') ?? root;
  for (const s of CHROME) for (const n of main.querySelectorAll(s)) n.remove();
  const out = new Map();
  for (const a of main.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;
    let abs;
    try { abs = new URL(href, origin); } catch { continue; }
    out.set(abs.href, { href, abs: abs.href, host: abs.host, text: (a.structuredText ?? a.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 50) });
  }
  return out;
}

const html = {};
for (const [k, url] of Object.entries(SITES)) html[k] = await (await fetch(url)).text();

const links = {
  prod: linksOf(html.prod, SITES.prod),
  new: linksOf(html.new, SITES.new),
};

console.log(`unique in-content links -- prod ${links.prod.size} | new ${links.new.size}`);

// Domain leakage: the new site linking back to production is a classic
// migration defect and is unambiguous.
const leak = [...links.new.values()].filter((l) => /tuinmaximaal\.(nl|be|de|fr)|tuinmaximaal\.co\.uk/.test(l.host));
console.log(`\nnew site links pointing at a LIVE domain: ${leak.length}`);
for (const l of leak.slice(0, 12)) console.log(`  ${l.host}${new URL(l.abs).pathname}  "${l.text}"`);

// Path-level comparison, host normalised away.
const paths = (m) => new Set([...m.values()].map((l) => new URL(l.abs).pathname.replace(/\/$/, '')));
const pProd = paths(links.prod);
const pNew = paths(links.new);
const missing = [...pProd].filter((p) => !pNew.has(p));
const added = [...pNew].filter((p) => !pProd.has(p));
console.log(`\nlink targets missing on new: ${missing.length}`);
missing.slice(0, 10).forEach((p) => console.log('  - ' + p));
console.log(`link targets added on new: ${added.length}`);
added.slice(0, 10).forEach((p) => console.log('  + ' + p));

// Status check, deduplicated. This is the cost driver for a full run.
const all = [...new Set([...links.prod.keys(), ...links.new.keys()])];
console.log(`\nchecking ${all.length} unique URLs for status…`);
const started = Date.now();
const results = await Promise.all(all.map(async (u) => {
  try {
    const r = await fetch(u, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
    return { u, status: r.status };
  } catch (e) { return { u, status: 'ERR' }; }
}));
const bad = results.filter((r) => r.status === 'ERR' || Number(r.status) >= 400);
const redir = results.filter((r) => Number(r.status) >= 300 && Number(r.status) < 400);
console.log(`  done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(`  broken (4xx/5xx/err): ${bad.length}`);
bad.slice(0, 12).forEach((r) => console.log(`    ${r.status}  ${r.u}`));
console.log(`  redirects (3xx): ${redir.length}`);
redir.slice(0, 6).forEach((r) => console.log(`    ${r.status}  ${r.u}`));

// Alt text, matched on filename.
const imgs = (h) => {
  const root = parse(h);
  const main = root.querySelector('main') ?? root;
  for (const s of CHROME) for (const n of main.querySelectorAll(s)) n.remove();
  const m = new Map();
  for (const i of main.querySelectorAll('img')) {
    const src = i.getAttribute('src') ?? i.getAttribute('data-src') ?? '';
    const file = decodeURIComponent(src.split('?')[0].split('/').pop() ?? '');
    if (file) m.set(file, (i.getAttribute('alt') ?? '').replace(/\s+/g, ' ').trim());
  }
  return m;
};
const iProd = imgs(html.prod);
const iNew = imgs(html.new);
let altDiff = 0; let altEmptyNew = 0;
for (const [file, alt] of iProd) {
  if (!iNew.has(file)) continue;
  if (iNew.get(file) !== alt) altDiff += 1;
  if (!iNew.get(file)) altEmptyNew += 1;
}
console.log(`\nimages -- prod ${iProd.size} | new ${iNew.size} | shared ${[...iProd.keys()].filter((f) => iNew.has(f)).length}`);
console.log(`  alt differs on shared images: ${altDiff}`);
console.log(`  alt empty on new but set on prod: ${altEmptyNew}`);
