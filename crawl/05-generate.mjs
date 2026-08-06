// Stage 5 - write pages.csv, index.md and one wireframe file per page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const read = (name) => JSON.parse(readFileSync(new URL(`../_data/${name}`, import.meta.url), 'utf8'));

const merged = read('03-merged.json');
const crawls = { new: read('02-crawl-new.json'), legacy: read('02-crawl-prod.json') };
const shots = existsSync(new URL('../_data/04-screenshots.json', import.meta.url))
  ? read('04-screenshots.json')
  : { captured: [] };
const captured = new Set(shots.captured);

const rows = merged.rows;
const DATE = new Date().toISOString().slice(0, 10);

// System and functional pages. Editable in Magento, but not architecture.
const SYSTEM = [
  /(^|\/)no-route$/, /\/succes$/, /^enable-cookies$/, /^afmelden$/, /^logo-update$/,
  /-error$/, /^quote-error$/, /^home-nl$/, /^disclaimer$/, /^copyright$/,
];
const isSystem = (key) => SYSTEM.some((pattern) => pattern.test(key));

// -------------------------------------------------------------------- csv
const CSV_COLUMNS = [
  'url_key', 'full_url', 'type', 'source', 'http_status', 'h1', 'meta_title',
  'meta_description', 'word_count', 'section_count', 'url_parent', 'depth',
  'in_main_nav', 'nav_path', 'breadcrumb', 'in_sitemap', 'noindex',
  'on_new_site', 'new_site_status', 'new_site_redirect',
  'images_total', 'images_without_alt', 'seo_flags',
  'be', 'be_fr', 'de', 'fr', 'uk',
];

const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return /[",;\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

writeFileSync(
  new URL('../pages.csv', import.meta.url),
  [CSV_COLUMNS.join(','), ...rows.map((row) => CSV_COLUMNS.map((c) => csvCell(row[c])).join(','))].join('\n')
);

// ---------------------------------------------------------------- wireframe
// A pipe inside a meta title breaks every markdown table it lands in.
const cell = (value) => String(value ?? '').replaceAll('|', '\\|');

const mermaidLabel = (text) =>
  text.replaceAll('"', "'").replaceAll('[', '(').replaceAll(']', ')').replaceAll('|', '-').slice(0, 60);

function wireframeFile(row) {
  const page = crawls[row.wireframe_source].pages[row.url_key];
  const lines = [];
  const title = row.h1 || row.url_key || 'Home';

  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`**URL key:** \`${row.url_key || '(home)'}\` &nbsp;·&nbsp; **Type:** ${row.type} &nbsp;·&nbsp; **Present on:** ${row.source}`);
  lines.push('');
  lines.push(`Wireframe read from the **${row.wireframe_source === 'new' ? 'new site' : 'legacy production site'}** on ${DATE}.`);
  lines.push('This file is a snapshot of structure only. Magento stays the source of truth.');
  lines.push('');
  lines.push('| | |');
  lines.push('| --- | --- |');
  lines.push(`| New site | ${row.on_new_site ? `[${row.new_url}](${row.new_url})` : `not present (${row.new_site_status})`} |`);
  lines.push(`| Production | [${row.full_url}](${row.full_url}) |`);
  lines.push(`| In sitemap | ${row.in_sitemap ? 'yes' : '**no**'} |`);
  lines.push(`| In main nav | ${row.in_main_nav ? `yes — ${cell(row.nav_path)}` : 'no'} |`);
  lines.push(`| Breadcrumb | ${cell(row.breadcrumb) || '(none)'} |`);
  lines.push(`| Meta title | ${cell(row.meta_title) || '**empty**'} |`);
  lines.push(`| Meta description | ${cell(row.meta_description) || '**empty**'} |`);
  lines.push(`| Words | ${row.word_count} | `);
  lines.push(`| Images | ${row.images_total} (${row.images_without_alt} without alt) |`);
  lines.push('');

  if (row.seo_flags.length) {
    lines.push('## SEO flags');
    lines.push('');
    for (const flag of row.seo_flags) lines.push(`- \`${flag}\``);
    lines.push('');
  }

  // ---- screenshots
  const desktop = `screenshots/${row.slug}-desktop.jpg`;
  const mobile = `screenshots/${row.slug}-mobile.jpg`;
  lines.push('## Screenshots');
  lines.push('');
  if (captured.has(`${row.slug}-desktop`) || captured.has(`${row.slug}-mobile`)) {
    if (captured.has(`${row.slug}-desktop`)) lines.push(`- Desktop 1440: [${row.slug}-desktop.jpg](../${desktop})`);
    if (captured.has(`${row.slug}-mobile`)) lines.push(`- Mobile 390: [${row.slug}-mobile.jpg](../${mobile})`);
  } else {
    lines.push('Not captured yet. To add desktop and mobile full-page captures for every');
    lines.push('page, run `node _scripts/04-screenshots.mjs`. It skips captures that already');
    lines.push('exist, so it can be stopped and restarted.');
  }
  lines.push('');

  // ---- stack diagram
  lines.push('## Section stack');
  lines.push('');
  if (page.sections.length === 0) {
    lines.push('_No PageBuilder sections found. The page content is plain html, or the theme');
    lines.push('renders it. Either way there are no rows to map._');
    lines.push('');
  } else {
    lines.push('```mermaid');
    lines.push('flowchart TD');
    page.sections.forEach((section, index) => {
      const meta = [section.type, section.columns ? `${section.columns} col` : null, section.images ? `${section.images} img` : null]
        .filter(Boolean).join(' · ');
      lines.push(`  s${index}["${index + 1}. ${mermaidLabel(section.label)}<br/><small>${mermaidLabel(meta)}</small>"]`);
      if (index > 0) lines.push(`  s${index - 1} --> s${index}`);
    });
    for (const [index, section] of page.sections.entries()) {
      if (section.from_cms_block) lines.push(`  class s${index} block;`);
    }
    lines.push('  classDef block stroke-dasharray: 4 4;');
    lines.push('```');
    lines.push('');
    lines.push('Dashed border means the section comes from a referenced CMS block. The rendered');
    lines.push('HTML carries no block identifier, so the block cannot be named from here.');
    lines.push('');

    // ---- detail table
    lines.push('## Section detail');
    lines.push('');
    lines.push('| # | Content type | Label | Appearance | Cols | Width tokens | Contains | Images | CTA labels | Words | CMS block |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const section of page.sections) {
      const contains = Object.entries(section.content_types).map(([type, count]) => `${type} x${count}`).join(', ');
      lines.push([
        section.index,
        `\`${section.type}\``,
        cell(section.label),
        section.appearance || '-',
        section.columns || '-',
        section.width_tokens.join(' ') || '-',
        contains || '-',
        section.images || '-',
        cell(section.cta_labels.join(' / ')) || '-',
        section.word_count,
        section.from_cms_block ? 'yes' : '-',
      ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
    }
    lines.push('');
  }

  // ---- theme sections
  if (page.template_sections?.length) {
    lines.push('## Theme-rendered areas');
    lines.push('');
    lines.push('These come from the theme templates, not PageBuilder, so they are not editable');
    lines.push('as page content.');
    lines.push('');
    lines.push('| Area | Detail |');
    lines.push('| --- | --- |');
    for (const area of page.template_sections) lines.push(`| ${area.name} | ${area.detail} |`);
    lines.push('');
  }

  // ---- heading outline
  lines.push('## Heading outline');
  lines.push('');
  if (page.headings.length === 0) {
    lines.push('_No headings found._');
  } else {
    for (const heading of page.headings) {
      lines.push(`${'  '.repeat(heading.level - 1)}- **h${heading.level}** ${heading.text}`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Desktop render only. Where a section is rendered per breakpoint, the mobile');
  lines.push('screenshot can disagree with the table above.');
  lines.push('');

  writeFileSync(new URL(`../pages/${row.slug}.md`, import.meta.url), lines.join('\n'));
}

for (const row of rows) wireframeFile(row);

// -------------------------------------------------------------------- index
const FUNNEL = [
  ['Orientation', /^(terrasoverkapping|veranda|carport|serre|tuinkamer|overkapping|glazen-schuifwand|schuifwand|zonwering|verlichting|shading-panel|lighting-system|glazen-schuifdeur|schuifpui|tuinoverkapping|steel-look|vrijstaande|losse-onderdelen|bamboe|heavy-duty|zwarte-overkapping|kleine-overkapping|tuinhuis|polycarbonaat|blog)/],
  ['Comparison', /(prijzen|productinformatie|fotogalerij|inspiratiemagazine|meettool|voordelen|superior-coating|reviews|inmeten|montage|downloads|gevelisolatie|dak-vervangen|zijwand|isolatiemateriaal|hor-schuifdeur|buiten)/],
  ['Conversion', /(offerte|aanvragen|samplepakket|proefpakket|showroom|contact|afhalen|levergebied|betaalmethoden|afterpay|laagste-prijs|winactie|actievoorwaarden|montagepartner)/],
  ['Service and trust', /(faq|veelgestelde|garantie|herroeping|over-ons|bedrijfsinformatie|beleid|privacy|review-policy|toegankelijkheid|gazellen|30000|logo|award|nieuws)/],
];

// Intent beats product family: carport/prijzen is comparison, not orientation.
// So the match runs deepest-intent first, while the diagram still reads left to
// right in funnel order.
const MATCH_ORDER = ['Conversion', 'Comparison', 'Service and trust', 'Orientation'];
const funnelOf = (key) => MATCH_ORDER
  .map((stage) => FUNNEL.find(([name]) => name === stage))
  .find(([, pattern]) => pattern.test(key))?.[0] ?? 'Unsorted';

const nodeId = (key) => 'p' + key.replace(/[^a-z0-9]/gi, '_') || 'home';
const count = (predicate) => rows.filter(predicate).length;

const index = [];
index.push('# Site architecture — content pages');
index.push('');
index.push(`Generated ${DATE}. Product detail pages are excluded by design: they are managed`);
index.push('in the Magento catalogue, not as content.');
index.push('');
index.push('## What is in here');
index.push('');
index.push('| | Count |');
index.push('| --- | --- |');
index.push(`| Pages total | ${rows.length} |`);
index.push(`| On both sites | ${count((r) => r.source === 'both')} |`);
index.push(`| Legacy only — still to build or to drop | ${count((r) => r.source === 'legacy-only')} |`);
index.push(`| New only — added on the new site | ${count((r) => r.source === 'new-only')} |`);
index.push(`| CMS pages | ${count((r) => r.type === 'cms-page')} |`);
index.push(`| Categories | ${count((r) => r.type === 'category')} |`);
index.push(`| Other or unknown type | ${count((r) => r.type === 'other')} |`);
index.push(`| Missing from the production sitemap | ${count((r) => !r.in_sitemap)} |`);
index.push(`| Not linked from the main nav | ${count((r) => !r.in_main_nav)} |`);
index.push(`| With at least one SEO flag | ${count((r) => r.seo_flags.length > 0)} |`);
index.push('');
index.push('- `pages.csv` — every page, 28 columns, for sorting and tracking.');
index.push('- `pages/<url-key>.md` — one wireframe per page: section stack, section detail,');
index.push('  heading outline, and a place for the screenshots.');
index.push('- `screenshots/` — empty for now. Run `node _scripts/04-screenshots.mjs` to add');
index.push('  desktop 1440 and mobile 390 full-page captures, JPEG quality 85.');
index.push('');

// ---- factual structure diagram
// Nearly every url sits at depth 1, so a url-only tree draws one root with 130
// children. The main nav supplies the only factual grouping available, and every
// page it does not link to is collapsed into one node with a count.
const content = rows.filter((row) => !isSystem(row.url_key));
const byKey = new Map(content.map((row) => [row.url_key, row]));
const childrenOf = new Map();
for (const row of content) {
  if (!row.url_parent || !byKey.has(row.url_parent)) continue;
  if (!childrenOf.has(row.url_parent)) childrenOf.set(row.url_parent, []);
  childrenOf.get(row.url_parent).push(row);
}

// A page earns a node when the nav links it, or when it has children.
const anchors = content.filter((row) => row.in_main_nav || childrenOf.has(row.url_key));
const anchorKeys = new Set(anchors.map((row) => row.url_key));
const loose = content.filter((row) => !anchorKeys.has(row.url_key)
  && !(row.url_parent && anchorKeys.has(row.url_parent)));

const classOf = [];
const drawn = new Set();

const drawNode = (row) => {
  const id = nodeId(row.url_key || 'home');
  if (drawn.has(id)) return id;
  drawn.add(id);
  const badge = row.in_main_nav ? '' : ' *';
  index.push(`  ${id}["${mermaidLabel(row.url_key || 'home')}${badge}"]`);
  if (row.source === 'legacy-only') classOf.push(`  class ${id} legacy;`);
  else if (row.source === 'new-only') classOf.push(`  class ${id} fresh;`);
  return id;
};

index.push('## Structure — as it is');
index.push('');
index.push('Grouped by the main navigation, because the urls are almost flat: 150 of 181');
index.push('pages sit at the first url level. A page marked `*` is not linked from the main');
index.push('nav. Colour shows where the page exists today.');
index.push('');
index.push('```mermaid');
index.push('flowchart LR');
index.push('  ROOT(["tuinmaximaal.nl"])');

for (const anchor of anchors) {
  const id = drawNode(anchor);
  const parent = anchor.url_parent && anchorKeys.has(anchor.url_parent)
    ? nodeId(anchor.url_parent)
    : 'ROOT';
  index.push(`  ${parent} --> ${id}`);
  for (const child of childrenOf.get(anchor.url_key) ?? []) {
    if (anchorKeys.has(child.url_key)) continue; // Drawn as an anchor already.
    index.push(`  ${id} --> ${drawNode(child)}`);
  }
}

if (loose.length) {
  index.push(`  LOOSE["${loose.length} standalone pages<br/><small>no nav link, no url parent — see the table below</small>"]`);
  index.push('  ROOT --> LOOSE');
  index.push('  class LOOSE loose;');
}
index.push(...classOf);
index.push('  classDef legacy fill:#fde8e8,stroke:#c53030;');
index.push('  classDef fresh fill:#e6fffa,stroke:#2c7a7b;');
index.push('  classDef loose fill:#f7fafc,stroke:#a0aec0,stroke-dasharray: 4 4;');
index.push('```');
index.push('');
index.push('Red = only on production, so it still has to be built or deliberately dropped.');
index.push('Green = only on the new site. The dashed node collects every page that the nav');
index.push('does not link and that has no parent url — the pages a content team forgets.');
index.push('');

// ---- draft funnel diagram
index.push('## Customer journey — DRAFT, please correct');
index.push('');
index.push('**This grouping is a guess.** It comes from url keyword patterns, not from your');
index.push('funnel definition. Treat it as a starting point to edit by hand.');
index.push('');
index.push('```mermaid');
index.push('flowchart LR');
for (const [stage] of [...FUNNEL, ['Unsorted']]) {
  const inStage = rows.filter((row) => !isSystem(row.url_key) && funnelOf(row.url_key) === stage);
  if (!inStage.length) continue;
  index.push(`  subgraph ${stage.replaceAll(' ', '_')}["${stage} (${inStage.length})"]`);
  index.push('    direction TB');
  for (const row of inStage.slice(0, 12)) {
    index.push(`    f${nodeId(row.url_key || 'home')}["${mermaidLabel(row.url_key || 'home')}"]`);
  }
  if (inStage.length > 12) index.push(`    more_${stage.replaceAll(' ', '_')}["... ${inStage.length - 12} more"]`);
  index.push('  end');
}
index.push('  Orientation --> Comparison --> Conversion --> Service_and_trust');
index.push('```');
index.push('');

// ---- page list
const listing = (title, filter, note) => {
  const set = rows.filter(filter);
  if (!set.length) return;
  index.push(`## ${title} (${set.length})`);
  index.push('');
  if (note) {
    index.push(note);
    index.push('');
  }
  index.push('| Page | Type | H1 | Sections | Words | Present on | Flags |');
  index.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of set) {
    index.push(`| [${row.url_key || '(home)'}](pages/${row.slug}.md) | ${row.type} | ${(row.h1 || '-').replaceAll('|', '\\|').slice(0, 60)} | ${row.section_count} | ${row.word_count} | ${row.source} | ${row.seo_flags.length ? row.seo_flags.join(', ') : '-'} |`);
  }
  index.push('');
};

listing('Content pages', (row) => !isSystem(row.url_key));
listing(
  'System and functional pages',
  (row) => isSystem(row.url_key),
  'Editable in Magento, but not part of the architecture anyone reviews.'
);

index.push('## Known limits');
index.push('');
index.push('- A referenced CMS block renders without an identifier, so a section can be marked');
index.push('  as coming from a block, but the block itself cannot be named. That needs the');
index.push('  Magento admin.');
index.push('- Section data is parsed from the desktop render only.');
index.push('- Breadcrumbs are best effort. Many CMS pages have none.');
index.push('- Everything here is a snapshot. It goes stale on the next Magento edit.');
index.push('');

writeFileSync(new URL('../index.md', import.meta.url), index.join('\n'));

console.log(`wrote index.md, pages.csv and ${rows.length} page files`);
