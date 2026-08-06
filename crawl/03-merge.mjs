// Stage 3 - merge both crawls into one table, add nav placement, hreflang
// counterparts and the deterministic SEO flags.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';

const read = (name) => JSON.parse(readFileSync(new URL(`../_data/${name}`, import.meta.url), 'utf8'));

const sitemap = read('01-sitemap.json');
const prod = read('02-crawl-prod.json');
const site = read('02-crawl-new.json');

const alternatesByKey = new Map(sitemap.rows.map((row) => [row.url_key, row.alternates]));

// ---------------------------------------------------------------- main nav
// Read the header of the new site once. A page the nav never links to is a page
// the content team forgets exists, so this is worth a column.
const NEW_ORIGIN = 'https://valanticnl.intern.systems';
const navPath = new Map();

{
  const html = await (await fetch(`${NEW_ORIGIN}/`, {
    headers: { 'user-agent': 'Mozilla/5.0 (sitemap-inventory; internal)' },
  })).text();
  const root = parse(html);
  const header = root.querySelector('header') ?? root;
  const clean = (text) => text.replace(/\s+/g, ' ').trim();

  for (const anchor of header.querySelectorAll('a[href]')) {
    let url;
    try {
      url = new URL(anchor.getAttribute('href'), NEW_ORIGIN);
    } catch {
      continue;
    }
    if (url.origin !== NEW_ORIGIN || url.search) continue;
    const key = url.pathname.replace(/^\/|\/$/g, '');
    if (!key || navPath.has(key)) continue;

    // Walk up the list nesting to find the parent entry's own label.
    const trail = [];
    for (let node = anchor.parentNode; node && node !== header; node = node.parentNode) {
      if (node.rawTagName !== 'li') continue;
      const parentLabel = clean(node.querySelector('a, span, button')?.text ?? '');
      if (parentLabel && parentLabel !== clean(anchor.text)) trail.unshift(parentLabel);
    }
    navPath.set(key, [...new Set(trail)].slice(-2).concat(clean(anchor.text)).join(' > '));
  }
}

// ------------------------------------------------------------- exclusions
// The brief asks for content pages: no product detail pages, no blogs. The
// crawl also reaches detail pages that behave like a PDP - one photo from the
// gallery, one blog post - so they are dropped here and counted instead.
const EXCLUDE_PAGE = [
  ['blog post', /^blog\/post\//],
  ['blog category', /^blog\/category\//],
  ['blog tag or paging', /^blog\/(tag|author|page)\//],
  ['gallery photo', /^gallery\//],
  ['catalog utility', /^catalog\//],
];

const excluded = {};
const keys = new Set([...Object.keys(site.pages), ...Object.keys(prod.pages)]);
const rows = [];

for (const key of [...keys].sort()) {
  const reason = EXCLUDE_PAGE.find(([, pattern]) => pattern.test(key))?.[0];
  if (reason) {
    excluded[reason] = (excluded[reason] ?? 0) + 1;
    continue;
  }
  const onNew = site.pages[key];
  const onProd = prod.pages[key];
  const source = onNew && onProd ? 'both' : onNew ? 'new-only' : 'legacy-only';

  // The wireframe describes the new site. Production is the fallback for pages
  // that only exist there.
  const primary = onNew ?? onProd;
  const wireframeSource = onNew ? 'new' : 'legacy';

  const parts = key.split('/');
  const flags = [];

  if (primary.h1.length === 0) flags.push('no-h1');
  if (primary.h1.length > 1) flags.push(`multiple-h1(${primary.h1.length})`);
  if (!primary.meta_description) flags.push('no-meta-description');
  if (!primary.meta_title) flags.push('no-meta-title');
  if (primary.word_count < 150) flags.push(`thin-content(${primary.word_count}w)`);
  if (primary.images_without_alt > 0) flags.push(`img-no-alt(${primary.images_without_alt})`);
  if (primary.noindex && onProd?.in_sitemap) flags.push('noindex-but-in-sitemap');
  if (primary.section_count === 0) flags.push('no-pagebuilder-sections');

  // Heading levels that skip a step, for example h2 straight to h4.
  let previous = 0;
  for (const heading of primary.headings) {
    if (previous && heading.level > previous + 1) {
      flags.push(`heading-skip(h${previous}->h${heading.level})`);
      break;
    }
    previous = heading.level;
  }

  rows.push({
    url_key: key,
    slug: key === '' ? 'home' : key.replaceAll('/', '--'),
    full_url: onProd?.url ?? `https://www.tuinmaximaal.nl/${key}`,
    new_url: `${NEW_ORIGIN}/${key}`,
    type: primary.type,
    source,
    wireframe_source: wireframeSource,
    http_status: onProd?.http_status ?? '',
    on_new_site: Boolean(onNew),
    new_site_status: onNew ? onNew.http_status : 404,
    new_site_redirect: onNew?.redirected ? onNew.final_url : '',
    in_sitemap: Boolean(onProd?.in_sitemap),
    h1: primary.h1.join(' | '),
    meta_title: primary.meta_title,
    meta_description: primary.meta_description,
    word_count: primary.word_count,
    section_count: primary.section_count,
    url_parent: parts.length > 1 ? parts.slice(0, -1).join('/') : '',
    depth: key === '' ? 0 : parts.length,
    in_main_nav: navPath.has(key),
    nav_path: navPath.get(key) ?? '',
    breadcrumb: primary.breadcrumb,
    noindex: primary.noindex,
    images_total: primary.images_total,
    images_without_alt: primary.images_without_alt,
    seo_flags: flags,
    ...Object.fromEntries(
      ['be', 'be_fr', 'de', 'fr', 'uk'].map((column) => [column, alternatesByKey.get(key)?.[column] ?? ''])
    ),
  });
}

// Duplicate meta titles can only be found across the whole set.
const titleCount = new Map();
for (const row of rows) {
  if (row.meta_title) titleCount.set(row.meta_title, (titleCount.get(row.meta_title) ?? 0) + 1);
}
for (const row of rows) {
  if (row.meta_title && titleCount.get(row.meta_title) > 1) row.seo_flags.push('duplicate-meta-title');
}

writeFileSync(
  new URL('../_data/03-merged.json', import.meta.url),
  JSON.stringify({ generated: new Date().toISOString(), excluded, rows }, null, 2)
);

const count = (predicate) => rows.filter(predicate).length;
console.log(`merged ${rows.length} pages`);
console.log(`  both: ${count((r) => r.source === 'both')}`);
console.log(`  legacy-only: ${count((r) => r.source === 'legacy-only')}`);
console.log(`  new-only: ${count((r) => r.source === 'new-only')}`);
console.log(`  cms-page: ${count((r) => r.type === 'cms-page')} | category: ${count((r) => r.type === 'category')} | other: ${count((r) => r.type === 'other')}`);
console.log(`  not in sitemap: ${count((r) => !r.in_sitemap)} | in nav: ${count((r) => r.in_main_nav)}`);
console.log(`  nav entries parsed: ${navPath.size}`);
console.log(`  excluded: ${JSON.stringify(excluded)}`);
