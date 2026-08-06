// Stage 2 - crawl one host, extract every non-PDP page in the same pass.
// Usage: node 02-crawl.mjs <prod|new>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extract, linksFrom } from './lib-extract.mjs';

const HOSTS = {
  prod: 'https://www.tuinmaximaal.nl',
  new: 'https://valanticnl.intern.systems',
};

const target = process.argv[2];
const origin = HOSTS[target];
if (!origin) throw new Error('pass prod or new');

const seedFile = new URL('../_data/01-sitemap.json', import.meta.url);
const sitemap = JSON.parse(readFileSync(seedFile, 'utf8'));
const sitemapKeys = new Set(sitemap.rows.map((row) => row.url_key));

// Product url keys from the sitemap. Used as a blocklist so the crawl never
// walks into the 4,444 PDPs. Anything not on the list is still type-checked.
const PDP_KEYS = new Set();
{
  const xml = readFileSync(new URL('../_data/sitemap-prod.xml', import.meta.url), 'utf8');
  const NL = 'https://www.tuinmaximaal.nl/';
  for (const block of xml.split('<url>').slice(1)) {
    const loc = block.match(/<loc>([^<]*)<\/loc>/)?.[1];
    if (!loc?.startsWith(NL)) continue;
    if (block.includes('<changefreq>never</changefreq>')) PDP_KEYS.add(loc.slice(NL.length));
  }
}

const CONCURRENCY = 6;
const outFile = new URL(`../_data/02-crawl-${target}.json`, import.meta.url);

const queue = ['', 'blog', ...(target === 'prod' ? sitemapKeys : [])];
const seen = new Set(queue);
const pages = {};
const skipped = { pdp: [], error: [], notFound: [] };

async function visit(key) {
  const url = `${origin}/${key}`;
  let response;
  let html = '';
  try {
    response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (sitemap-inventory; internal)' },
      redirect: 'follow',
    });
    html = await response.text();
  } catch (error) {
    skipped.error.push({ key, error: String(error) });
    return;
  }

  if (response.status === 404) {
    skipped.notFound.push(key);
    return;
  }

  const record = extract(html);
  if (record.type === 'product') {
    skipped.pdp.push(key);
    return; // Never follow links out of a PDP.
  }

  pages[key] = {
    url_key: key,
    url,
    http_status: response.status,
    final_url: response.url,
    redirected: response.url.replace(/\/$/, '') !== url.replace(/\/$/, ''),
    in_sitemap: sitemapKeys.has(key),
    ...record,
  };

  for (const link of linksFrom(html, origin)) {
    if (seen.has(link) || PDP_KEYS.has(link)) continue;
    seen.add(link);
    queue.push(link);
  }
}

let done = 0;
while (queue.length) {
  const batch = queue.splice(0, CONCURRENCY);
  await Promise.all(batch.map(visit));
  done += batch.length;
  process.stdout.write(`\r${target}: visited ${done}, queued ${queue.length}, kept ${Object.keys(pages).length}   `);
  if (done > 1200) {
    console.log('\nsafety cap reached');
    break;
  }
}

writeFileSync(outFile, JSON.stringify({ origin, fetched: new Date().toISOString(), pages, skipped }, null, 2));
console.log(`\n${target}: kept ${Object.keys(pages).length} pages | skipped ${skipped.pdp.length} pdp, ${skipped.notFound.length} 404, ${skipped.error.length} error`);
