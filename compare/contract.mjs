/**
 * The data contract between `crawl/`, `compare/`, `web/` and `api/`.
 *
 * Ticket 01 fixes the finding id, ticket 02 the classes and the normalisation
 * tiers, ticket 05 the link classes, ticket 06 the image classes.
 */

import { createHash } from 'node:crypto';

/**
 * The class vocabulary lives in `vocabulary.mjs` and is re-exported here, so a
 * Node consumer still has one import site for the whole contract. The browser
 * imports `vocabulary.mjs` directly: `findingId()` needs `node:crypto`, and a
 * Vite build of an island that reaches this file fails on that import. Ids are
 * made in `compare/`, never in the browser.
 */
export { CHECKS, FINDING_CLASSES, STORES } from './vocabulary.mjs';

/** @typedef {import('./vocabulary.mjs').Store} Store */

/** @typedef {import('./vocabulary.mjs').Side} Side */

/** @typedef {import('./vocabulary.mjs').Check} Check */

/** @typedef {import('./vocabulary.mjs').FindingClass} FindingClass */

/**
 * One leaf text element inside the content boundary, in document order. This
 * is the content outline and the diff input. It is one structure, not two.
 *
 * @typedef {object} TextElement
 * @property {number} index         Position in document order.
 * @property {string} tag
 * @property {'heading' | 'text' | 'cta'} kind  `cta` is a label only. All anchors count.
 * @property {number | null} level  1 to 6 for a heading, else null.
 * @property {string} raw
 * @property {string} norm          Tier-1 text. Letter case and trailing punctuation stay.
 */

/**
 * @typedef {object} LinkRecord
 * @property {string} href          The href as the page sends it.
 * @property {string} url           Resolved and absolute.
 * @property {string} key           Target identity: the two hosts of the page folded to one
 *                                  token, path lowercased, trailing slash removed, query kept,
 *                                  fragment dropped.
 * @property {string} text          The anchor text. The Diff tab owns it, not the Links tab.
 * @property {boolean} internal
 */

/**
 * @typedef {object} ImageRecord
 * @property {string} key           The basename, lowercased, with a true size suffix
 *                                  (`-1292x729`) removed. Never a bare `_N`.
 * @property {string} src
 * @property {string | null} alt    `null` if the attribute is absent. An empty alt is
 *                                  compared for parity only.
 */

/**
 * @typedef {object} PageMeta
 * @property {string | null} title
 * @property {string | null} description
 * @property {string | null} canonical
 * @property {boolean} noindex
 * @property {string | null} h1
 */

/**
 * Numbers that explain a page, and that must never become a finding. Ticket 06
 * counts the new site's 76 Alpine-bound icons here: they carry no identity, so
 * they cannot be matched, missed or fixed.
 *
 * @typedef {object} PageDiagnostics
 * @property {number} imagesWithoutSrc
 */

/**
 * What `crawl/` gives for one URL. `compare/` reads nothing else.
 *
 * @typedef {object} PageExtract
 * @property {Store} store
 * @property {string} page          The NL url key.
 * @property {Side} side
 * @property {string} url
 * @property {number} status
 * @property {'main' | 'body'} boundary  `body` says that the page has no `<main>`.
 * @property {string | null} pageType    From the `<body class>`, read with a regex on the
 *                                       raw HTML, because the parser drops the tag.
 * @property {TextElement[]} elements
 * @property {LinkRecord[]} links
 * @property {ImageRecord[]} images
 * @property {PageMeta} meta
 * @property {string} markdown      A rendering for reading and export. Never the diff spine.
 * @property {PageDiagnostics} diagnostics
 * @property {string} fetchedAt     ISO 8601.
 */

/**
 * @typedef {object} Finding
 * @property {string} id
 * @property {Store} store
 * @property {string} page
 * @property {Check} check
 * @property {keyof FINDING_CLASSES} class
 * @property {string | null} prod   The production side, normalised. `null` if absent.
 * @property {string | null} new    The new side, normalised. `null` if absent.
 * @property {number} occurrences   Not part of the id.
 * @property {number | null} score  The similarity score. On `copy` findings only.
 */

/**
 * One aligned position in the Diff tab, in production's document order.
 *
 * A finding is **grouped** — one rename repeated six times is one finding — and a
 * row is a **position**, so the two cannot be the same record. The rows are
 * derived from the same alignment pass as the findings, and they hold element
 * indices rather than copies of the text: the elements are already in
 * `sides`, and duplicating them roughly doubles a report on disk.
 *
 * `class: null` is an exact tier-1 match. Ticket 02: that is not a finding.
 *
 * @typedef {object} DiffRow
 * @property {keyof FINDING_CLASSES | null} class
 * @property {number | null} prod   Index into `sides.production.elements`.
 * @property {number | null} new    Index into `sides.new.elements`.
 * @property {number | null} score
 */

/**
 * The counts the dashboard and the page bar read. Ticket 09: a hidden class is
 * not in the bar, and absolute numbers are always shown, because the denominator
 * moves.
 *
 * @typedef {object} ReportSummary
 * @property {number} shown
 * @property {number} hidden
 * @property {number} total
 * @property {Record<string, number>} byClass
 * @property {Record<string, number>} byCheck
 */

/**
 * What `web/` reads, one file per store page.
 *
 * Ticket 07: the compare stage **gates on `status === 200`**, because a 404 page
 * still extracts — the 404 page has a `<main>`. A page that fails the gate is
 * still a report, so the dashboard can show it and say why, but it carries no
 * findings. One-sided pages are ticket 20's subject, not a wall of `structure`.
 *
 * @typedef {object} PageReport
 * @property {Store} store
 * @property {string} page
 * @property {{ production: PageExtract, new: PageExtract }} sides
 * @property {boolean} comparable
 * @property {string | null} skipReason
 * @property {Finding[]} findings
 * @property {DiffRow[]} rows
 * @property {ReportSummary} summary
 * @property {string} builtAt       ISO 8601.
 */

/**
 * The finding id from ticket 01.
 *
 * Content-addressed, page-scoped and store-scoped. It expires on purpose: if
 * either side's text changes, the id changes and the dismissal detaches,
 * because the editor's judgement is now stale.
 *
 * `prodNorm` and `newNorm` are tier-1 text with letter case kept. A truncated
 * hash, not truncated content: the prototype cut the key itself, and 156
 * findings collapsed to 88 ids.
 *
 * @param {object} parts
 * @param {Store} parts.store
 * @param {string} parts.page
 * @param {Check} parts.check
 * @param {string} parts.rule      The class id.
 * @param {string | null} parts.prodNorm
 * @param {string | null} parts.newNorm
 * @returns {string} 16 base64url characters.
 */
export function findingId({ store, page, check, rule, prodNorm, newNorm }) {
  const key = [store, page, check, rule, prodNorm ?? '', newNorm ?? ''].join('|');
  return createHash('sha256').update(key, 'utf8').digest('base64url').slice(0, 16);
}

/**
 * The mute key from ticket 01: store, page and class. A mute persists, and it
 * covers rotating content such as campaigns and prices.
 *
 * @param {{ store: Store, page: string, class: string }} parts
 * @returns {string}
 */
export function muteKey({ store, page, class: cls }) {
  return [store, page, cls].join('|');
}
