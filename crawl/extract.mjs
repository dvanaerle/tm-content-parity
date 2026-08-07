/**
 * Extractor v2 (ticket 07). One HTML document in, one `PageExtract` out.
 *
 * The rules come from the resolved tickets and are not decided again here:
 * ticket 02 (text elements, boundary, normalisation), ticket 05 (links),
 * ticket 06 (images), ticket 14 (the parse).
 */

import { parse } from 'node-html-parser';
import { imageKey, linkKey } from '../shared/keys.mjs';
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
 * Ticket 34: text, images and links come from **one** walk on **one** counter.
 *
 * They were three separate `querySelectorAll` passes, each with its own numbering
 * or none at all, so an image and a paragraph could not be told apart by position
 * and a finding could not say where on the page it was.
 *
 * Every record a node makes shares that node's position, so an anchor's words and
 * its target agree about where they are. A node that makes no record takes no
 * number, which keeps the counter gapless. A repeat of an already-seen image makes
 * no record either: ticket 06 compares images as a set, and the position an editor
 * wants is the **first** occurrence.
 *
 * @param {import('node-html-parser').HTMLElement} scope
 * @param {string} pageUrl
 * @param {{ prodHost?: string, newHost?: string }} hosts
 */
function walk(scope, pageUrl, hosts) {
  /** @type {import('../compare/contract.mjs').TextElement[]} */
  const elements = [];
  /** @type {import('../compare/contract.mjs').LinkRecord[]} */
  const links = [];
  /** @type {Map<string, import('../compare/contract.mjs').ImageRecord>} */
  const byKey = new Map();
  let imagesWithoutSrc = 0;

  /** Text elements a heading above them already spoke for. */
  const swallowed = new Set();
  let position = 0;

  for (const node of scope.querySelectorAll(`${TEXT_TAGS},img`)) {
    const tag = node.rawTagName.toLowerCase();

    if (tag === 'img') {
      const image = imageRecord(node);
      if (!image) {
        imagesWithoutSrc += 1;
        continue;
      }
      const seen = byKey.get(image.key);
      if (seen) {
        // The two copies of one image can disagree. The page does carry the alt,
        // so the real one wins over an absent or empty one.
        if (!seen.alt && image.alt) seen.alt = image.alt;
        continue;
      }
      byKey.set(image.key, { index: position, ...image });
      position += 1;
      continue;
    }

    const element = textElement(node, tag, swallowed);
    // A heading swallows the words of an anchor inside it, and never its target:
    // the swallow rule is about what an element **says**, and ticket 05 counts
    // every anchor on the page.
    const link = tag === 'a' ? linkRecord(node, pageUrl, hosts) : null;
    if (!element && !link) continue;

    if (element) elements.push({ index: position, ...element });
    if (link) links.push({ index: position, ...link });
    position += 1;
  }

  return { elements, links, images: [...byKey.values()], imagesWithoutSrc };
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
 * **The mirror case is still lost, and stays lost here.** A container that is not
 * a heading and holds both a heading and loose text —
 * `<td>Levertijd <h4>Vraag</h4></td>` — gives up the loose words, because the
 * container is skipped for having a text tag inside it. To rescue them the leaf
 * rule would have to emit the direct text nodes of a container as an element of
 * their own. That is a change to what an element **is**, it moves the count on
 * every one of the 179 pages, and it needs its own measurement. Ticket 33 records
 * it and does not do it; `extract.test.mjs` pins the behaviour so the next reader
 * sees the limit instead of finding it.
 *
 * @param {import('node-html-parser').HTMLElement} node
 * @param {string} tag
 * @param {Set<unknown>} swallowed
 * @returns {Omit<import('../compare/contract.mjs').TextElement, 'index'> | null}
 */
function textElement(node, tag, swallowed) {
  if (swallowed.has(node)) return null;

  const heading = /^h[1-6]$/.test(tag);
  if (heading) {
    for (const inner of node.querySelectorAll(TEXT_TAGS)) swallowed.add(inner);
  } else if (node.querySelectorAll(TEXT_TAGS).length > 0) return null;

  const raw = textOf(node);
  const norm = tier1(raw);
  if (norm.length < 2) return null;
  // Bullets, arrows and separators carry no content to compare.
  if (!/[\p{L}\p{N}]/u.test(norm)) return null;

  return {
    tag,
    // Ticket 02: `cta` is a label only. A link in body copy is counted too.
    kind: heading ? 'heading' : (tag === 'a' || tag === 'button') ? 'cta' : 'text',
    level: heading ? Number(tag.slice(1)) : null,
    raw,
    norm,
  };
}

/**
 * @param {import('node-html-parser').HTMLElement} link  The `<a>` element itself.
 * @param {string} pageUrl
 * @param {{ prodHost?: string, newHost?: string }} hosts
 * @returns {Omit<import('../compare/contract.mjs').LinkRecord, 'index'> | null}
 */
function linkRecord(link, pageUrl, hosts) {
  const href = (link.getAttribute('href') ?? '').trim();
  if (!href || NON_NAVIGATIONAL.test(href)) return null;

  let url;
  try {
    url = new URL(href, pageUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  return {
    href,
    url: url.href,
    key: linkKey(url, hosts),
    text: tier1(textOf(link)),
    internal: isInternalHost(url.host),
  };
}

/**
 * Ticket 06: `src` is authoritative and `data-src` is the fallback. An image
 * with neither is not an image for parity, because it carries no identity.
 *
 * @param {import('node-html-parser').HTMLElement} img
 * @returns {Omit<import('../compare/contract.mjs').ImageRecord, 'index'> | null}
 */
function imageRecord(img) {
  const src = (img.getAttribute('src') ?? img.getAttribute('data-src') ?? '').trim();
  if (!src || /^data:/i.test(src)) return null;

  const altAttribute = img.getAttribute('alt');
  return { key: imageKey(src), src, alt: altAttribute == null ? null : tier1(altAttribute) };
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
 * content view shows, so the two can never disagree about what is on the page.
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
  const content = walk(scope, url, { prodHost, newHost });

  const extract = {
    store,
    page,
    side,
    url,
    status,
    boundary,
    // The parser can drop the tag on malformed markup, so this reads the source.
    pageType: pageType(html.match(/<body[^>]*\sclass="([^"]*)"/i)?.[1] ?? ''),
    elements: content.elements,
    links: content.links,
    images: content.images,
    meta: meta(root, scope),
    markdown: toMarkdown(content.elements),
    diagnostics: { imagesWithoutSrc: content.imagesWithoutSrc },
    fetchedAt: new Date().toISOString(),
  };

  assertHasContent(extract);
  return extract;
}
