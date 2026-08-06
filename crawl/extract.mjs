/**
 * Extractor v2 (ticket 07). One HTML document in, one `PageExtract` out.
 *
 * The rules come from the resolved tickets and are not decided again here:
 * ticket 02 (text elements, boundary, normalisation), ticket 05 (links),
 * ticket 06 (images), ticket 14 (the parse).
 */

import { parse } from 'node-html-parser';
import { collapse, tier1 } from './normalise.mjs';

/** Ticket 14: without this the new site's `<body>` and `<header>` are deleted. */
const PARSE_OPTIONS = { closeAllByClosing: true };

/** Ticket 02. A node that holds another of these is a container: the children speak. */
const TEXT_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,button,a,figcaption,th,td';

/**
 * Ticket 02, trimmed to what removes something, with `[class*="breadcrumb"]`
 * restored by ticket 14. Inside `<main>` it removes no *element*, so it runs on
 * the `body` fallback only.
 */
const CHROME = [
  'header', 'footer', 'nav', 'form',
  '[class*="breadcrumb"]', '[class*="menu"]', '[role="dialog"]',
];

/**
 * These run inside the boundary as well, always.
 *
 * Ticket 02 measured that the chrome list removes zero text elements inside
 * `<main>`, and put the whole list on the fallback path. That measurement asked
 * whether a selector removes an *element* — and a `<style>` is not in
 * `TEXT_TAGS`, so the answer was correctly zero. It never asked whether the
 * **text inside** one bleeds into an ancestor that *is* in `TEXT_TAGS`.
 *
 * It does. Production nests a `<style>` and a `<script>` inside an `<a>`, and
 * that anchor holds no other text element, so it is a leaf and `structuredText`
 * hands over the CSS and the JavaScript as content. Measured over the nl store:
 * **151 elements on 23 of 179 pages**, each of them a `structure` finding that
 * no editor can act on.
 *
 * `<template>` is deliberately **not** in this list. Its text is not in the
 * rendered document either, but the new site is Alpine-driven and a template
 * there can hold copy the browser does render — removing it would invent
 * production-only findings, which is the opposite mistake.
 */
const NEVER_CONTENT = ['script', 'style', 'noscript'];

const BODY_CLASS_TYPE = [
  ['catalog-product-view', 'product'],
  ['catalog-category-view', 'category'],
  ['cms-page-view', 'cms-page'],
  ['cms-index-index', 'cms-page'],
  ['cms-noroute-index', 'cms-page'],
];

/** Ticket 05: no other shapes exist on the site. */
const NON_NAVIGATIONAL = /^(#|mailto:|tel:)/i;

/** A true trailing size suffix, per ticket 06. A bare `_N` is never one. */
const SIZE_SUFFIX = /[_-]\d{2,4}x\d{2,4}$/;

// node-html-parser concatenates child text with no separator, which glues a
// button label onto the text above it. structuredText keeps the line breaks.
const textOf = (node) => collapse((node.structuredText ?? node.text ?? '').replaceAll('\n', ' '));

/**
 * @param {string} bodyClass
 * @returns {string | null}
 */
export function pageType(bodyClass) {
  if (!bodyClass) return null;
  for (const [needle, type] of BODY_CLASS_TYPE) {
    if (bodyClass.includes(needle)) return type;
  }
  return 'other';
}

/**
 * Target identity from ticket 05: the page's own two hosts fold to one token,
 * the path is lowercased and loses its trailing slash, the query stays and the
 * fragment goes.
 *
 * @param {URL} url
 * @param {{ prodHost?: string, newHost?: string }} hosts
 * @returns {string}
 */
export function linkKey(url, { prodHost, newHost } = {}) {
  const host = url.host.toLowerCase();
  const own = [prodHost, newHost].filter(Boolean).map((h) => h.toLowerCase());
  const token = own.includes(host) ? 'self' : host;
  const path = url.pathname.toLowerCase().replace(/\/+$/, '');
  // One page sends the same filter target as `6039,6040` and as `6039%2C6040`.
  // The encoding is invisible to a reader, so it folds like tier 1 does.
  const query = new URLSearchParams(url.search).toString();
  return `${token}${path}${query ? `?${query}` : ''}`;
}

/**
 * Image identity from ticket 06: the basename, lowercased, extension kept.
 * Full-path matching scores 2.8%, because production resizes through Cloudflare
 * and the two environments carry different catalog cache hashes.
 *
 * @param {string} src
 * @returns {string}
 */
export function imageKey(src) {
  const withoutQuery = src.split('#')[0].split('?')[0];
  let base = withoutQuery.split('/').pop() ?? '';
  try {
    base = decodeURIComponent(base);
  } catch {
    // A malformed escape keeps the raw basename.
  }
  base = base.toLowerCase();
  const extension = base.match(/\.[a-z0-9]{2,5}$/)?.[0] ?? '';
  const stem = extension ? base.slice(0, -extension.length) : base;
  return stem.replace(SIZE_SUFFIX, '') + extension;
}

/**
 * @param {string} host
 * @returns {boolean}
 */
function isInternalHost(host) {
  return /\.intern\.systems$/i.test(host) || /(^|\.)tuinmaximaal\.[a-z.]+$/i.test(host);
}

/**
 * Ticket 14: a silent `?? root` fallback hid a broken parse for a whole crawl,
 * so absence is loud. A missing `<main>` is legitimate on three production
 * pages and falls back to `body`; a missing `<body>` never is.
 */
function contentRoot(root, warn) {
  const body = root.querySelector('body');
  if (!body) throw new Error('No <body> in the parsed document. The parse or the page is broken.');

  // Before anything reads text: a script or a style is never content, wherever it
  // sits, and its text leaks into whichever text element encloses it.
  for (const selector of NEVER_CONTENT) {
    for (const node of body.querySelectorAll(selector)) node.remove();
  }

  const main = root.querySelector('main');
  if (main) return { scope: main, boundary: /** @type {'main'} */ ('main') };

  warn('No <main>. Falling back to the <body> root with the chrome list.');
  for (const selector of CHROME) {
    for (const node of body.querySelectorAll(selector)) node.remove();
  }
  return { scope: body, boundary: /** @type {'body'} */ ('body') };
}

/**
 * Ticket 19: a page that answers 200 and holds nothing at all inside the
 * boundary is either an undeclared application page or a broken parse. Both are
 * engineering faults, so this fails the run instead of emitting findings an
 * editor cannot act on.
 *
 * Emptiness is absolute, never a ratio: `fotogalerij` holds 9 text elements
 * against production's 178 and is a real page, so any threshold band is already
 * occupied. And emptiness counts images and links too — no text at all is a
 * legitimate shape for a photo page, while nothing at all is not. The
 * configurator scores 0 on all three.
 *
 * @param {import('../compare/contract.mjs').PageExtract} extract
 */
function assertHasContent(extract) {
  if (extract.status !== 200) return;
  if (extract.elements.length || extract.images.length || extract.links.length) return;

  throw new Error(
    'No text, image or link inside the content boundary on an HTTP 200 page. '
    + 'Either the parse is broken, or this is an application page that '
    + 'belongs in crawl/excluded-pages.mjs.'
  );
}

/**
 * Ticket 02: every leaf text element in document order, all anchors counted.
 *
 * **A heading is never a container** (ticket 33). Production builds every FAQ
 * question as `<h4 class="panel-title"><a data-toggle="collapse" …>`, so under
 * the plain leaf rule the anchor spoke and the heading level was thrown away:
 * the element read as a `cta` with no level, against a plain `<h3>` on the new
 * site. **337 elements on 40 of 179 nl pages**, and ticket 33's new
 * `heading-level` class would have reported all of them naming the wrong
 * production element.
 *
 * The rule is about headings rather than about accordions, because the same leaf
 * rule loses content outright on `<h2>Bekijk onze <a>carports</a> nu</h2>`: the
 * anchor was reported and the words around it disappeared. A heading is one
 * label, and its text is its own.
 *
 * @param {import('node-html-parser').HTMLElement} scope
 * @returns {import('../compare/contract.mjs').TextElement[]}
 */
function textElements(scope) {
  const out = [];
  /** Text elements a heading above them already spoke for. */
  const swallowed = new Set();

  for (const node of scope.querySelectorAll(TEXT_TAGS)) {
    if (swallowed.has(node)) continue;

    const tag = node.rawTagName.toLowerCase();
    const heading = /^h[1-6]$/.test(tag);
    if (heading) {
      for (const inner of node.querySelectorAll(TEXT_TAGS)) swallowed.add(inner);
    } else if (node.querySelectorAll(TEXT_TAGS).length > 0) continue;

    const raw = textOf(node);
    const norm = tier1(raw);
    if (norm.length < 2) continue;
    // Bullets, arrows and separators carry no content to compare.
    if (!/[\p{L}\p{N}]/u.test(norm)) continue;

    out.push({
      index: out.length,
      tag,
      // Ticket 02: `cta` is a label only. A link in body copy is counted too.
      kind: heading ? 'heading' : (tag === 'a' || tag === 'button') ? 'cta' : 'text',
      level: heading ? Number(tag.slice(1)) : null,
      raw,
      norm,
    });
  }
  return out;
}

/**
 * @param {import('node-html-parser').HTMLElement} scope
 * @param {string} pageUrl
 * @param {{ prodHost?: string, newHost?: string }} hosts
 * @returns {import('../compare/contract.mjs').LinkRecord[]}
 */
function links(scope, pageUrl, hosts) {
  const out = [];
  for (const anchor of scope.querySelectorAll('a[href]')) {
    const href = (anchor.getAttribute('href') ?? '').trim();
    if (!href || NON_NAVIGATIONAL.test(href)) continue;

    let url;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;

    out.push({
      href,
      url: url.href,
      key: linkKey(url, hosts),
      text: tier1(textOf(anchor)),
      internal: isInternalHost(url.host),
    });
  }
  return out;
}

/**
 * Ticket 06: `src` is authoritative and `data-src` is the fallback. An image
 * with neither is not an image for parity, because it carries no identity.
 * Images are compared as a set, so a page holds each identity once — the new
 * site emits a mobile and a desktop copy of the same src on every page.
 *
 * @param {import('node-html-parser').HTMLElement} scope
 * @returns {{ images: import('../compare/contract.mjs').ImageRecord[], withoutSrc: number }}
 */
function images(scope) {
  /** @type {Map<string, import('../compare/contract.mjs').ImageRecord>} */
  const byKey = new Map();
  let withoutSrc = 0;

  for (const img of scope.querySelectorAll('img')) {
    const src = (img.getAttribute('src') ?? img.getAttribute('data-src') ?? '').trim();
    if (!src || /^data:/i.test(src)) {
      withoutSrc += 1;
      continue;
    }
    const altAttribute = img.getAttribute('alt');
    const alt = altAttribute == null ? null : tier1(altAttribute);
    const key = imageKey(src);

    const seen = byKey.get(key);
    if (!seen) {
      byKey.set(key, { key, src, alt });
      continue;
    }
    // The two copies of one image can disagree. The page does carry the alt, so
    // the real one wins over an absent or empty one.
    if (!seen.alt && alt) seen.alt = alt;
  }
  return { images: [...byKey.values()], withoutSrc };
}

/**
 * @param {import('node-html-parser').HTMLElement} root
 * @param {import('node-html-parser').HTMLElement} scope
 * @returns {import('../compare/contract.mjs').PageMeta}
 */
function meta(root, scope) {
  const attribute = (selector, name) => {
    const value = root.querySelector(selector)?.getAttribute(name);
    return value ? tier1(value) : null;
  };
  const title = root.querySelector('title');
  const h1 = scope.querySelector('h1');
  return {
    title: title ? tier1(textOf(title)) || null : null,
    description: attribute('meta[name="description"]', 'content'),
    canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    noindex: /noindex/i.test(attribute('meta[name="robots"]', 'content') ?? ''),
    h1: h1 ? tier1(textOf(h1)) || null : null,
  };
}

/**
 * A reading and export artefact, never the diff spine: it flattens element
 * identity, which the finding id depends on. It renders the same elements the
 * Diff tab shows, so the two can never disagree about what is on the page.
 *
 * @param {import('../compare/contract.mjs').TextElement[]} elements
 * @returns {string}
 */
export function toMarkdown(elements) {
  const lines = [];
  for (const element of elements) {
    if (element.kind === 'heading') lines.push(`${'#'.repeat(element.level)} ${element.raw}`);
    else if (element.kind === 'cta') lines.push(`[${element.raw}]`);
    else if (element.tag === 'blockquote') lines.push(`> ${element.raw}`);
    else if (['li', 'dt', 'dd', 'th', 'td'].includes(element.tag)) lines.push(`- ${element.raw}`);
    else lines.push(element.raw);
  }
  return lines.join('\n\n');
}

/**
 * @param {string} html
 * @param {object} context
 * @param {import('../compare/contract.mjs').Store} context.store
 * @param {string} context.page
 * @param {import('../compare/contract.mjs').Side} context.side
 * @param {string} context.url
 * @param {number} [context.status]
 * @param {string} [context.prodHost]
 * @param {string} [context.newHost]
 * @param {(message: string) => void} [context.onWarn]
 * @returns {import('../compare/contract.mjs').PageExtract}
 */
export function extractPage(html, context) {
  const { store, page, side, url, status = 200, prodHost, newHost } = context;
  const warn = context.onWarn ?? ((message) => console.warn(`${store}/${page} ${side}: ${message}`));

  const root = parse(html, PARSE_OPTIONS);
  const { scope, boundary } = contentRoot(root, warn);
  const elements = textElements(scope);
  const picture = images(scope);

  const extract = {
    store,
    page,
    side,
    url,
    status,
    boundary,
    // The parser can drop the tag on malformed markup, so this reads the source.
    pageType: pageType(html.match(/<body[^>]*\sclass="([^"]*)"/i)?.[1] ?? ''),
    elements,
    links: links(scope, url, { prodHost, newHost }),
    images: picture.images,
    meta: meta(root, scope),
    markdown: toMarkdown(elements),
    diagnostics: { imagesWithoutSrc: picture.withoutSrc },
    fetchedAt: new Date().toISOString(),
  };

  assertHasContent(extract);
  return extract;
}
