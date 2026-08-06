// Turns one HTML document into the structural record used by every later stage.
// No body copy is kept - headings, button labels, content types and counts only.
import { parse } from 'node-html-parser';

// PageBuilder types that only carry layout. They never name a section.
const LAYOUT_TYPES = new Set([
  'row', 'column', 'column-group', 'column-line', 'text', 'html',
]);

const BODY_CLASS_TYPE = [
  ['catalog-product-view', 'product'],
  ['catalog-category-view', 'category'],
  ['cms-page-view', 'cms-page'],
  ['cms-index-index', 'cms-page'],
  ['cms-noroute-index', 'cms-page'],
];

const clean = (text) => text.replace(/\s+/g, ' ').trim();

// node-html-parser concatenates child text with no separator, which glues a
// button label onto the text above it. structuredText keeps the line breaks.
const textOf = (node) => clean((node.structuredText ?? node.text).replaceAll('\n', ' '));

// PageBuilder writes column widths into a generated style block, keyed by
// data-pb-style. Without resolving these, the width column is always empty.
function pbStyleWidths(html) {
  const widths = new Map();
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (!css.includes('data-pb-style')) continue;
    for (const [, selector, body] of css.matchAll(/([^{}]*data-pb-style[^{}]*)\{([^}]*)\}/g)) {
      const width = body.match(/(?:^|;)\s*width\s*:\s*([^;]+)/)?.[1]?.trim();
      const basis = body.match(/flex-basis\s*:\s*([^;]+)/)?.[1]?.trim();
      const value = basis ?? width;
      if (!value) continue;
      for (const [, id] of selector.matchAll(/data-pb-style=([^\],\s]+)/g)) {
        widths.set(id, value);
      }
    }
  }
  return widths;
}

export function pageType(bodyClass) {
  for (const [needle, type] of BODY_CLASS_TYPE) {
    if (bodyClass.includes(needle)) return type;
  }
  return 'other';
}

// The header, footer and off-canvas menus repeat on every page, so the section
// scan is limited to the main content area.
function contentRoot(root) {
  return root.querySelector('main')
    ?? root.querySelector('#maincontent')
    ?? root.querySelector('body')
    ?? root;
}

// A section is a content unit, not a row. Rows carry no visual meaning on their
// own: a category hero row holds a block, a valantic_group, sliders and swatches
// side by side, and a designer needs each of those as its own wireframe box.
// So these types are transparent - the scan looks straight through them.
const TRANSPARENT = new Set([
  'row', 'column', 'column-group', 'column-line', 'block', 'valantic_group',
]);

// Repeated children of a unit. They are counted, never emitted as sections.
const isItem = (type) => type.endsWith('_item') || type.endsWith('-item');

function isUnit(node, type) {
  if (TRANSPARENT.has(type) || isItem(type)) return false;
  // A raw html snippet is a widget, not a section. Text only counts when it
  // carries a heading - otherwise it is a paragraph inside another unit.
  if (type === 'html') return false;
  if (type === 'text') return node.querySelectorAll('h1, h2, h3, h4').length > 0;
  return true;
}

// Units in document order, each with no unit above it.
function contentUnits(scope) {
  return scope.querySelectorAll('[data-content-type]').filter((node) => {
    const type = node.getAttribute('data-content-type');
    if (!isUnit(node, type)) return false;
    for (let parent = node.parentNode; parent && parent !== scope; parent = parent.parentNode) {
      const parentType = parent.getAttribute?.('data-content-type');
      if (parentType && isUnit(parent, parentType)) return false;
    }
    return true;
  });
}

// Nearest row ancestor, for appearance and column count.
function rowOf(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.getAttribute?.('data-content-type') === 'row') return parent;
  }
  return null;
}

// Whether a unit sits inside a referenced CMS block. The rendered HTML carries
// no block identifier, so this can only say yes or no - never which block.
function insideCmsBlock(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.getAttribute?.('data-content-type') === 'block') return true;
  }
  return false;
}

// Column proportions, read from the resolved pb-style widths. Tailwind width
// utilities on the column are kept as a fallback.
function columnWidths(node, widths) {
  const found = [];
  for (const column of node.querySelectorAll('[data-content-type="column"]')) {
    const id = column.getAttribute('data-pb-style');
    const resolved = id && widths.get(id);
    if (resolved) {
      found.push(resolved);
      continue;
    }
    const utility = (column.getAttribute('class') ?? '')
      .split(/\s+/).find((token) => /^(sm:|md:|lg:|xl:)?w-/.test(token));
    if (utility) found.push(utility);
  }
  return found.slice(0, 8);
}

function describe(node) {
  const counts = {};
  for (const child of node.querySelectorAll('[data-content-type]')) {
    const type = child.getAttribute('data-content-type');
    if (LAYOUT_TYPES.has(type)) continue;
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

function headingsIn(node) {
  return node.querySelectorAll('h1, h2, h3, h4')
    .map((h) => ({ level: Number(h.rawTagName.slice(1)), text: textOf(h) }))
    .filter((h) => h.text);
}

function ctaLabels(node) {
  const labels = new Set();
  for (const el of node.querySelectorAll('a[data-element="link"], [data-content-type="button-item"] a, button')) {
    const text = textOf(el);
    if (text && text.length <= 60) labels.add(text);
  }
  return [...labels].slice(0, 8);
}

// Falls back through heading, then the unit's own type. A CTA label is the last
// resort - an unlabelled box tells a designer nothing.
function label(headings, counts, type, ctas) {
  if (headings.length) return headings[0].text;
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (dominant) return `${type} (${dominant[0]} x${dominant[1]})`;
  if (ctas.length) return `${type}: ${ctas[0]}`;
  return type;
}

// Areas the theme renders, not PageBuilder. A category page's product grid and
// filter column hold no data-content-type, so a PageBuilder-only scan misses
// the main content of the page.
function templateSections(scope) {
  const found = [];
  const add = (name, detail) => found.push({ name, detail });

  for (const node of scope.querySelectorAll('[data-section-name]')) {
    add(node.getAttribute('data-section-name'), 'data-section-name');
  }

  const grid = scope.querySelector('.products-grid, .product-items, [class*="products-list"]');
  if (grid) add('product listing', `${grid.querySelectorAll('.product-item, li').length} items`);

  if (scope.querySelector('.filter-options, #layered-filter-block, [class*="filter-option"]')) {
    add('layered filters', 'filter column');
  }
  if (scope.querySelector('.toolbar, [class*="toolbar-"]')) add('toolbar', 'sort and paging');

  for (const form of scope.querySelectorAll('form')) {
    const fields = form.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
    if (fields >= 2) add('form', `${fields} fields`);
  }
  return found;
}

export function extract(html) {
  const root = parse(html);
  const widths = pbStyleWidths(html);
  // node-html-parser drops the body tag, so the class comes off the raw source.
  const bodyClass = html.match(/<body[^>]*class="([^"]*)"/i)?.[1] ?? '';
  const scope = contentRoot(root);

  const metaOf = (name) =>
    clean(root.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? '');

  const allHeadings = headingsIn(scope);
  const images = scope.querySelectorAll('img');

  const sections = contentUnits(scope).map((unit, index) => {
    const counts = describe(unit);
    const headings = headingsIn(unit);
    const row = rowOf(unit);
    const type = unit.getAttribute('data-content-type');
    const ctas = ctaLabels(unit);
    return {
      index: index + 1,
      type,
      label: label(headings, counts, type, ctas),
      appearance: unit.getAttribute('data-appearance') || row?.getAttribute('data-appearance') || '',
      row_appearance: row?.getAttribute('data-appearance') ?? '',
      columns: row?.querySelectorAll('[data-content-type="column"]').length ?? 0,
      width_tokens: row ? columnWidths(row, widths) : [],
      content_types: counts,
      headings,
      cta_labels: ctas,
      images: unit.querySelectorAll('img').length,
      from_cms_block: insideCmsBlock(unit),
      word_count: clean(unit.text).split(' ').filter(Boolean).length,
    };
  });

  return {
    type: pageType(bodyClass),
    title: clean(root.querySelector('title')?.text ?? ''),
    meta_title: metaOf('title'),
    meta_description: metaOf('description'),
    noindex: /noindex/i.test(metaOf('robots')),
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
    h1: allHeadings.filter((h) => h.level === 1).map((h) => h.text),
    headings: allHeadings,
    word_count: clean(scope.text).split(' ').filter(Boolean).length,
    images_total: images.length,
    images_without_alt: images.filter((img) => !clean(img.getAttribute('alt') ?? '')).length,
    breadcrumb: (root.querySelectorAll('.breadcrumbs a, nav[aria-label="Breadcrumb"] a, [class*="breadcrumb"] a')
      .map((a) => clean(a.text)).filter(Boolean)).join(' > '),
    sections,
    section_count: sections.length,
    template_sections: templateSections(scope),
    pagebuilder: describe(scope),
  };
}

// Internal links worth following. Functional and catalog paths are not pages.
const EXCLUDE = [
  /^\/?(checkout|customer|catalogsearch|wishlist|review|sendfriend|newsletter|contacts|dealer|customize|control|service|static|media|index\.php)(\/|$)/i,
  /\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|xml|ico|zip)$/i,
];

export function linksFrom(html, origin) {
  const found = new Set();
  for (const a of parse(html).querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

    let url;
    try {
      url = new URL(href, origin);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    if (url.search) continue;

    const path = url.pathname.replace(/^\/|\/$/g, '');
    if (!path) continue;
    if (EXCLUDE.some((pattern) => pattern.test(path))) continue;
    found.add(path);
  }
  return [...found];
}
