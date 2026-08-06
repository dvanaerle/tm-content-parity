/**
 * The images check (ticket 06). Identity is the basename, made in the extractor,
 * because full-path matching scores 2.8%: production resizes through Cloudflare
 * and the two environments carry different catalog cache hashes.
 *
 * Images are compared as a **set**. The new site emits a mobile and a desktop
 * copy of the same src on every page, so a raw count difference is never a
 * finding. The extractor already deduplicates, which is why this file can treat
 * the list as a set without doing it again.
 */

import { tier2 } from './match.mjs';

/**
 * Ticket 06 amends ticket 02 here, and only here: an image campaign pattern
 * fires on **either** side, not both.
 *
 * The both-sides rule exists because text is ambiguous — `Bekijk alle deals`
 * could be a real copy loss. An image identity is a filename carrying a campaign
 * word, so that ambiguity does not exist. Under the both-sides rule production's
 * `2026-07-23-KortingActie-NL-16Aug.svg` would fire as `image-missing` on 123 of
 * 124 pages: the largest single source of findings in the dataset, all noise.
 */
export const IMAGE_CAMPAIGN = /korting|actie(?!f)|deal|aanbieding|black[-_]?friday|sale/i;

/**
 * @param {import('./contract.mjs').ImageRecord[]} images
 * @returns {Map<string, import('./contract.mjs').ImageRecord>}
 */
function byKey(images) {
  const map = new Map();
  for (const image of images) if (!map.has(image.key)) map.set(image.key, image);
  return map;
}

/**
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @param {import('./findings.mjs').FindingCollector} collector
 */
export function compareImages(production, next, collector) {
  const prodImages = byKey(production.images);
  const newImages = byKey(next.images);

  for (const [key, prod] of prodImages) {
    const image = newImages.get(key);

    if (!image) {
      collector.add({
        class: IMAGE_CAMPAIGN.test(key) ? 'image-campaign' : 'image-missing',
        prod: key,
        new: null,
      });
      continue;
    }

    // Empty alt is parity only. An image with an empty alt on both sides is not a
    // finding, because production is the source of truth — which dissolves the
    // decorative-versus-content question with no human judgement anywhere.
    const prodAlt = prod.alt ?? '';
    const newAlt = image.alt ?? '';
    if (prodAlt === newAlt) continue;

    if (prodAlt && !newAlt) {
      collector.add({ class: 'alt-lost', prod: prodAlt, new: null });
      continue;
    }
    // The new site gained an alt where production had none. Production is the
    // reference and the tab reports regressions, so this is not a finding.
    // Measured: 0 instances site-wide.
    if (!prodAlt) continue;

    // Ticket 06 reuses ticket 02's vocabulary rather than adding `alt-casing`:
    // `class` is the mute key, so an editor who mutes casing on a page must not
    // keep receiving casing findings from a second tab.
    collector.add({
      class: tier2(prodAlt) === tier2(newAlt) ? 'casing' : 'alt-changed',
      prod: prodAlt,
      new: newAlt,
    });
  }

  for (const key of newImages.keys()) {
    if (prodImages.has(key)) continue;
    collector.add({
      // Hidden for the same reason as `extra-link`: unhidden it double-counts
      // every content block the text diff already reports as an addition.
      class: IMAGE_CAMPAIGN.test(key) ? 'image-campaign' : 'image-added',
      prod: null,
      new: key,
    });
  }
}
