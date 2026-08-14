/**
 * Extractor v2 (ticket 07). One HTML document in, one `PageExtract` out.
 *
 * The rules come from the resolved tickets and are not decided again here:
 * ticket 02 (content units, boundary, normalisation), ticket 05 (links),
 * ticket 06 (images), ticket 14 (the parse).
 */

import { parse } from 'node-html-parser';
import {
  EXCLUDED_REGIONS,
  capBreachMessage,
  capFor,
  validateRegions,
} from '../shared/excluded-regions.mjs';
import { imageKey, linkKey } from '../shared/keys.mjs';
import { collapse, tier1 } from './normalise.mjs';

/** Ticket 14: without this the new site's `<body>` and `<header>` are deleted. */
const PARSE_OPTIONS = { closeAllByClosing: true };

/** Ticket 02, split by ticket 67. Each of these is a block, and a block is a unit. */
const BLOCK_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption,th,td';

/**
 * Ticket 67: a block folds these into its own text, because nobody edits a link
 * apart from the sentence that holds it. Alone, each one is still a unit.
 */
const FOLDABLE = 'a,button';

/** Every tag that can make a unit, in the one order the walk needs: document order. */
const TEXT_TAGS = `${BLOCK_TAGS},${FOLDABLE}`;

/**
 * Ticket 02, trimmed to what removes something, with `[class*="breadcrumb"]`
 * restored by ticket 14. Inside `<main>` it removes no *element*, so it runs on
 * the `body` fallback only.
 */
const CHROME = [
  'header',
  'footer',
  'nav',
  'form',
  '[class*="breadcrumb"]',
  '[class*="menu"]',
  '[role="dialog"]',
];

/**
 * These run inside the boundary as well, always.
 *
 * Ticket 02 measured that the chrome list removes zero content units inside
 * `<main>`, and put the whole list on the fallback path. That measurement asked
 * whether a selector removes an *element* — and a `<style>` is not a block, so the
 * answer was correctly zero. It never asked whether the **text inside** one bleeds
 * into an ancestor that *is* a unit.
 *
 * It does. Production nests a `<style>` and a `<script>` inside an `<a>`, and
 * `structuredText` hands over the CSS and the JavaScript as content. Measured over
 * the nl store **before ticket 67 folded inline links**: 151 units on 23 of 179
 * pages, each of them a `structure` finding that no editor can act on.
 *
 * Ticket 67 widened the hole this closes rather than narrowing it. The anchor no
 * longer has to be a leaf: the block that folds the anchor takes the CSS with the
 * words. The count above is not carried over, because the fold moved the whole unit
 * corpus, and no probe measures this counterfactual.
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
  // sits, and its text leaks into whichever content unit encloses it.
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
 * The content units one subtree holds, counted by the same rule that emits them.
 *
 * It gets its own `swallowed` set, so a heading inside the region swallows only
 * inside the region. The region root itself is not counted: every entry names a
 * wrapper, and `querySelectorAll` does not return the node it is called on.
 *
 * @param {import('node-html-parser').HTMLElement} node
 * @returns {number}
 */
function countUnitsIn(node) {
  const swallowed = new Set();
  let units = 0;
  for (const inner of node.querySelectorAll(TEXT_TAGS)) {
    if (contentUnit(inner, inner.rawTagName.toLowerCase(), swallowed)) units += 1;
  }
  return units;
}

/**
 * A match that another match of the same entry already holds.
 *
 * `querySelectorAll` gives the ancestor and the descendant. Counted as they come,
 * the inner subtree is counted twice, and the recorded unit count is then wrong.
 * The outer match removes the inner one anyway.
 *
 * @param {import('node-html-parser').HTMLElement} node
 * @param {import('node-html-parser').HTMLElement[]} matches
 */
function isInsideAnother(node, matches) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (matches.includes(parent)) return true;
  }
  return false;
}

/**
 * Ticket 63: a region that is not editor work leaves the log here, while the DOM
 * still exists.
 *
 * Each entry is counted before it is cut. An entry above its cap **throws**. The
 * cap is on the whole entry on one page, and not on one match: two matches of
 * half the size are the same wrong selector as one wide match.
 *
 * The failure direction over-reports on purpose. When an entry stops matching,
 * nothing is removed, and the region comes back as findings.
 *
 * @param {import('node-html-parser').HTMLElement} scope
 * @param {import('../shared/excluded-regions.mjs').ExcludedRegion[]} entries
 * @param {string} where  `store/page side`, because a crawl fails on one page of 448.
 * @returns {import('../compare/contract.mjs').RegionRemoval[]}
 */
function removeExcludedRegions(scope, entries, where) {
  /** @type {import('../compare/contract.mjs').RegionRemoval[]} */
  const removed = [];

  for (const entry of entries) {
    const all = scope.querySelectorAll(entry.selector);
    const matches = all.filter((node) => !isInsideAnother(node, all));
    if (matches.length === 0) continue;

    const units = matches.reduce((total, node) => total + countUnitsIn(node), 0);
    if (units > capFor(entry)) {
      throw new Error(capBreachMessage(entry, { units, matches: matches.length, where }));
    }

    for (const node of matches) node.remove();
    removed.push({
      selector: entry.selector,
      kind: entry.kind,
      reason: entry.reason,
      matches: matches.length,
      units,
    });
  }

  return removed;
}

/**
 * Ticket 19: a page that answers 200 and holds nothing at all inside the
 * boundary is either an undeclared application page or a broken parse. Both are
 * engineering faults, so this fails the run instead of emitting findings an
 * editor cannot act on.
 *
 * Emptiness is absolute, never a ratio: `fotogalerij` holds 47 content units
 * against production's 163 and is a real page, so any threshold band is already
 * occupied. It was 9 against 178 before the fold, and the gap is still wide.
 * (Measured 2026-08-10 by `crawl/probes/probe-extract-v2.mjs`.)
 *
 * And emptiness counts images and links too. No text at all is a legitimate shape
 * for a photo page, while nothing at all is not. The configurator scores 0 on all
 * three.
 *
 * @param {import('../compare/contract.mjs').PageExtract} extract
 */
function assertHasContent(extract) {
  if (extract.status !== 200) return;
  if (extract.elements.length || extract.images.length || extract.links.length) return;

  throw new Error(
    'No text, image or link inside the content boundary on an HTTP 200 page. ' +
      'Either the parse is broken, or this is an application page that ' +
      'belongs in shared/excluded-pages.mjs.',
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
  /** @type {import('../compare/contract.mjs').ContentUnit[]} */
  const elements = [];
  /** @type {import('../compare/contract.mjs').LinkRecord[]} */
  const links = [];
  /** @type {Map<string, import('../compare/contract.mjs').ImageRecord>} */
  const byKey = new Map();
  let imagesWithoutSrc = 0;

  /** Nodes a unit above them already spoke for. Ticket 67 widened this past headings. */
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

    const unit = contentUnit(node, tag, swallowed);
    // A block swallows the words of an anchor inside it, and never its target:
    // the swallow rule is about what a unit **says**, and ticket 05 counts
    // every anchor on the page. So a folded anchor makes no unit and still takes
    // its own position for its link record.
    const link = tag === 'a' ? linkRecord(node, pageUrl, hosts) : null;
    if (!unit && !link) continue;

    if (unit) elements.push({ index: position, ...unit });
    if (link) links.push({ index: position, ...link });
    position += 1;
  }

  return { elements, links, images: [...byKey.values()], imagesWithoutSrc };
}

/**
 * One content unit: the block an editor edits, in document order.
 *
 * **A block folds its inline links** (ticket 67). Ticket 02 made a unit of every
 * *leaf* in the tag list, and a node that held another node from the list was
 * skipped, because "the children speak". `a` and `button` are in that list, so one
 * inline link discarded its whole paragraph and only the link words were compared.
 * A finding must map onto one decision, and nobody edits an anchor apart from the
 * sentence that holds it. `docs/adr/0002-content-unit-is-the-editable-block.md`
 * holds the decision and the rejected alternatives.
 *
 * **A nested block still breaks a unit.** An `li` gives way to a `p` inside it,
 * because both are blocks and each is edited on its own.
 *
 * **A heading is never a container** (ticket 33). Production builds every FAQ
 * question as `<h4 class="panel-title"><a data-toggle="collapse" …>`, so under the
 * leaf rule the anchor spoke and the heading level was thrown away: the unit read
 * as a `cta` with no level, against a plain `<h3>` on the new site. Ticket 33 fixed
 * the heading case alone, and ticket 67 made the general case behave like the case
 * that was right. A heading keeps one rule of its own: it folds a nested **block**
 * as well, because a heading is one label whatever markup is inside it.
 *
 * **The mirror case is still lost, and stays lost here.** A block that holds both a
 * nested block and loose text — `<td>Levertijd <h4>Vraag</h4></td>` — gives up the
 * loose words, because the outer block gives way to the inner one. To rescue them
 * this rule would have to emit the direct text nodes of a block as a unit of their
 * own. That is a change to what a unit **is** and it needs its own measurement.
 * Ticket 33 records it, ticket 67 does not widen it, and `extract.test.mjs` pins the
 * behaviour so the next reader sees the limit instead of finding it.
 *
 * @param {import('node-html-parser').HTMLElement} node
 * @param {string} tag
 * @param {Set<unknown>} swallowed
 * @returns {Omit<import('../compare/contract.mjs').ContentUnit, 'index'> | null}
 */
function contentUnit(node, tag, swallowed) {
  if (swallowed.has(node)) return null;

  const heading = /^h[1-6]$/.test(tag);
  // A heading is one label and folds whatever is inside it. Every other block
  // gives way to a nested block, so an `li` gives way to a `p` inside it.
  if (!heading && node.querySelectorAll(BLOCK_TAGS).length > 0) return null;

  const raw = textOf(node);
  const norm = tier1(raw);
  if (norm.length < 2) return null;
  // Bullets, arrows and separators carry no content to compare.
  if (!/[\p{L}\p{N}]/u.test(norm)) return null;

  // This unit spoke for everything inside it. Nothing inside speaks again.
  for (const inner of node.querySelectorAll(TEXT_TAGS)) swallowed.add(inner);

  return {
    tag,
    // Ticket 02: `cta` is a label only. A link in body copy is counted too.
    kind: heading ? 'heading' : isWhollyOneCta(node, tag, norm) ? 'cta' : 'text',
    level: heading ? Number(tag.slice(1)) : null,
    raw,
    norm,
  };
}

/**
 * Ticket 67: a unit is a call to action when the whole unit is one link, and the
 * tag that emitted it is not asked. The two sites wrap the same button
 * differently — production puts `Vraag een offerte aan` in a `<p>`, the new site
 * leaves a bare `<a>` — and `mayPair()` reads the kind, so a kind that came from
 * the tag stopped the pair.
 *
 * Two links in one block make it text. Then the block is a sentence with links
 * in it, and no single target belongs to the whole unit.
 *
 * @param {import('node-html-parser').HTMLElement} node
 * @param {string} tag
 * @param {string} norm  The tier-1 text of the whole unit.
 * @returns {boolean}
 */
function isWhollyOneCta(node, tag, norm) {
  if (tag === 'a' || tag === 'button') return true;
  const inner = node.querySelectorAll(FOLDABLE);
  return inner.length === 1 && tier1(textOf(inner[0])) === norm;
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
 * A reading and export artefact, never the diff spine: it flattens unit
 * identity, which the finding id depends on. It renders the same units the
 * content view shows, so the two can never disagree about what is on the page.
 *
 * @param {import('../compare/contract.mjs').ContentUnit[]} units
 * @returns {string}
 */
export function toMarkdown(units) {
  const lines = [];
  for (const unit of units) {
    if (unit.kind === 'heading') lines.push(`${'#'.repeat(unit.level)} ${unit.raw}`);
    else if (unit.kind === 'cta') lines.push(`[${unit.raw}]`);
    else if (unit.tag === 'blockquote') lines.push(`> ${unit.raw}`);
    else if (['li', 'dt', 'dd', 'th', 'td'].includes(unit.tag)) lines.push(`- ${unit.raw}`);
    else lines.push(unit.raw);
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
 * @param {import('../shared/excluded-regions.mjs').ExcludedRegion[]} [context.excludedRegions]
 * @returns {import('../compare/contract.mjs').PageExtract}
 */
export function extractPage(html, context) {
  const { store, page, side, url, status = 200, prodHost, newHost } = context;
  const warn =
    context.onWarn ?? ((message) => console.warn(`${store}/${page} ${side}: ${message}`));

  const root = parse(html, PARSE_OPTIONS);
  const { scope, boundary } = contentRoot(root, warn);
  // Before the walk, so the counter never numbers a unit the log has no business
  // with, and `meta()` reads no h1 the catalogue wrote.
  // A list a caller gives gets the same bar as the committed one, so no path into
  // the extractor skips the validation.
  const entries = context.excludedRegions
    ? validateRegions(context.excludedRegions, 'context.excludedRegions')
    : EXCLUDED_REGIONS;
  const regionsExcluded = removeExcludedRegions(scope, entries, `${store}/${page} ${side}`);
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
    diagnostics: {
      imagesWithoutSrc: content.imagesWithoutSrc,
      regionsExcluded,
      unitsExcluded: regionsExcluded.reduce((total, region) => total + region.units, 0),
    },
    fetchedAt: new Date().toISOString(),
  };

  assertHasContent(extract);
  return extract;
}
