/**
 * The data contract between `crawl/`, `compare/`, `web/` and `api/`.
 *
 * Ticket 01 fixes the finding id, ticket 02 the classes and the normalisation
 * tiers, ticket 05 the link classes, ticket 06 the image classes.
 */

import { createHash } from 'node:crypto';

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} Store */

/** @typedef {'production' | 'new'} Side */

/** @typedef {'text' | 'links' | 'images' | 'meta'} Check */

/**
 * @typedef {object} FindingClass
 * @property {Check} check
 * @property {boolean} shown  Whether the class is shown before an editor changes a filter.
 * @property {string} meaning
 */

/**
 * The closed class vocabulary. A class is also the mute key, so each name must
 * be a name that an editor knows. A ticket can add a class, and it must give
 * the default.
 *
 * @type {Record<string, FindingClass>}
 */
export const FINDING_CLASSES = {
  // Ticket 02 — text
  copy: { check: 'text', shown: true, meaning: 'The text changed. Both sides are present.' },
  structure: { check: 'text', shown: true, meaning: 'The element is on one side only.' },
  casing: { check: 'text', shown: true, meaning: 'Only letter case or trailing punctuation is different.' },
  restructured: { check: 'text', shown: false, meaning: 'The same content, but a different element on each side.' },
  price: { check: 'text', shown: false, meaning: 'Only the numbers are different.' },
  campaign: { check: 'text', shown: false, meaning: 'Promotional copy. The pattern must match both sides.' },

  // Ticket 05 — links
  'broken-link': { check: 'links', shown: true, meaning: 'The target does not answer. It fires also if production is broken.' },
  'missing-link': { check: 'links', shown: true, meaning: 'Production has the link. The new site does not.' },
  'link-target': { check: 'links', shown: true, meaning: 'The two sides point at different targets.' },
  leakage: { check: 'links', shown: true, meaning: 'The new site points at the live domain, and that path exists as a new-site page.' },
  'cross-store-link': { check: 'links', shown: true, meaning: 'The link goes to the host of a different store.' },
  redirect: { check: 'links', shown: false, meaning: 'The target answers, after a redirect.' },
  'extra-link': { check: 'links', shown: false, meaning: 'The new site has a link that production does not have.' },

  // Ticket 06 — images
  'image-missing': { check: 'images', shown: true, meaning: 'Production has the image. The new site does not.' },
  'alt-lost': { check: 'images', shown: true, meaning: 'Production has alt text. The new site has none.' },
  'alt-changed': { check: 'images', shown: true, meaning: 'Both sides have alt text, and it is different.' },
  'image-added': { check: 'images', shown: false, meaning: 'The new site has an image that production does not have.' },
  'image-campaign': { check: 'images', shown: false, meaning: 'A campaign image. The pattern matches on either side.' },
};

/** @type {Check[]} */
export const CHECKS = ['text', 'links', 'images', 'meta'];

/** @type {Store[]} */
export const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];

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
 * What `web/` reads, one file per store page.
 *
 * @typedef {object} PageReport
 * @property {Store} store
 * @property {string} page
 * @property {{ production: PageExtract, new: PageExtract }} sides
 * @property {Finding[]} findings
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
