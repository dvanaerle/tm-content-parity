/**
 * The closed class vocabulary, and nothing else.
 *
 * This is the half of the contract that the **browser** reads. `contract.mjs`
 * re-exports it, so a Node consumer still has one import site, but it also holds
 * `findingId()`, which needs `node:crypto` — and a Vite build that reaches
 * `contract.mjs` from an island fails on that import. Ids are made in `compare/`,
 * never in the browser, so the split costs nothing.
 *
 * Ticket 02 fixes the text classes, ticket 05 the link classes, ticket 06 the
 * image classes. A class is also the mute key (ticket 01), so each name must be a
 * name an editor knows, and each new class must give its default.
 */

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} Store */

/** @typedef {'production' | 'new'} Side */

/** @typedef {'text' | 'links' | 'images' | 'meta'} Check */

/**
 * @typedef {object} FindingClass
 * @property {Check} check
 * @property {boolean} shown  Whether the class is shown before an editor changes a filter.
 * @property {string} meaning
 */

/** @type {Record<string, FindingClass>} */
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
