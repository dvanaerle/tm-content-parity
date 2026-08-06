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
 * image classes, ticket 33 the directional text split. A class is also the mute
 * key (ticket 01), so each name must be a name an editor knows, and each new
 * class must give its default.
 *
 * **A one-sided difference is named by its direction, on every check.** Content
 * production has and the new site lost is shown. Content the new site invented is
 * hidden, because it is mostly a PageBuilder rebuild and not a defect. It is one
 * idea an editor learns once, so the direction is a **field** on the class rather
 * than a rule three names have to remember: `direction` carries it, and the
 * `shown` default follows from it. The tone in `web/src/lib/classes.mjs` reads the
 * same field, so rose cannot come apart from the meaning.
 */

/** @typedef {'nl' | 'be' | 'be_fr' | 'de' | 'fr' | 'uk'} Store */

/** @typedef {'production' | 'new'} Side */

/** @typedef {'text' | 'links' | 'images' | 'meta'} Check */

/**
 * @typedef {object} FindingClass
 * @property {Check} check
 * @property {boolean} shown  Whether the class is shown before an editor changes a filter.
 * @property {string} meaning
 * @property {'lost' | 'added'} [direction]  On a one-sided class only. `lost` is always
 *                                           shown, `added` is always hidden.
 */

/** @type {Record<string, FindingClass>} */
export const FINDING_CLASSES = {
  // Ticket 02 — text
  copy: { check: 'text', shown: true, meaning: 'The text changed. Both sides are present.' },
  casing: { check: 'text', shown: true, meaning: 'Only letter case or trailing punctuation is different.' },
  restructured: { check: 'text', shown: false, meaning: 'The same content, but a different element on each side.' },
  price: { check: 'text', shown: false, meaning: 'Only the numbers are different.' },
  campaign: { check: 'text', shown: false, meaning: 'Promotional copy. The pattern must match both sides.' },

  // Ticket 33 — text, by direction. These replace `structure`.
  'text-missing': { check: 'text', shown: true, direction: 'lost', meaning: 'Production has the text. The new site does not.' },
  'text-added': { check: 'text', shown: false, direction: 'added', meaning: 'The new site has text that production does not have.' },

  // Ticket 33 — the same text in a different element. Silent before this ticket.
  // One class covers a level change and a promotion to or from a heading. The
  // class is also the mute key (ticket 01), so an editor who mutes this mutes
  // both. That is accepted: both are the same defect to the outline.
  'heading-level': { check: 'text', shown: true, meaning: 'The text is the same, and it is a heading on one side or at another level.' },
  'tag-changed': { check: 'text', shown: false, meaning: 'The text is the same, and it sits in a different element. Neither side is a heading.' },

  // Ticket 05 — links
  'broken-link': { check: 'links', shown: true, meaning: 'The target does not answer. It fires also if production is broken.' },
  'missing-link': { check: 'links', shown: true, direction: 'lost', meaning: 'Production has the link. The new site does not.' },
  'link-target': { check: 'links', shown: true, meaning: 'The two sides point at different targets.' },
  leakage: { check: 'links', shown: true, meaning: 'The new site points at the live domain, and that path exists as a new-site page.' },
  'cross-store-link': { check: 'links', shown: true, meaning: 'The link goes to the host of a different store.' },
  redirect: { check: 'links', shown: false, meaning: 'The target answers, after a redirect.' },
  'extra-link': { check: 'links', shown: false, direction: 'added', meaning: 'The new site has a link that production does not have.' },

  // Ticket 06 — images
  'image-missing': { check: 'images', shown: true, direction: 'lost', meaning: 'Production has the image. The new site does not.' },
  'alt-lost': { check: 'images', shown: true, meaning: 'Production has alt text. The new site has none.' },
  'alt-changed': { check: 'images', shown: true, meaning: 'Both sides have alt text, and it is different.' },
  'image-added': { check: 'images', shown: false, direction: 'added', meaning: 'The new site has an image that production does not have.' },
  'image-campaign': { check: 'images', shown: false, meaning: 'A campaign image. The pattern matches on either side.' },
};

/** @type {Check[]} */
export const CHECKS = ['text', 'links', 'images', 'meta'];

/** @type {Store[]} */
export const STORES = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'];
