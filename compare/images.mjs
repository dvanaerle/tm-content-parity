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

import { anchorHeadingFor } from './locate.mjs';
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
 *
 * Since ticket 64 that artwork no longer arrives: `#campaign-banner` is cut at
 * extraction (ADR 0003), which is now the primary mechanism. This rule is the net
 * for campaign artwork placed in page content *outside* the banner, where nothing
 * upstream removes it.
 *
 * The boundary is letters, not `\b`. Both are ticket 101, and both are measured
 * over every image key in `data/extract/`:
 *
 * - Without a boundary, `deal` matched `ideale` and `ideal`, and `actie` matched
 *   `actie-updates`. That was the rule's *entire* output on the corpus — 29
 *   findings, 29 collateral — because a diagnostic class is unread by design, so
 *   its mistakes never surfaced. `ideal-wero.svg` is the shape of the damage: a
 *   payment-provider logo, called a campaign.
 * - `\b` is worse, in the other direction: a filename separates words with `-`,
 *   `_`, `.`, digits and the string edges, and `\b` reads only two of those. It
 *   drops `summer_sale_2026.svg` and `sales_uk.png`, which are campaigns, while
 *   still matching `winactie` and `interactieve`, which are not.
 *
 * `actie` has no arm at all now. A left boundary alone still matches
 * `actie-updates_*.jpg`, a newsletter block on the reviews page, and the German
 * store settles it: the same block is named `aktions-update_erhalten.jpg` there
 * and has always been a visible `image-missing`, because the pattern says `actie`
 * and not `aktion`. Dropping the arm makes all six stores agree in the direction
 * `de` already had. **The cost is real and accepted:** a future
 * `zomeractie-2027.jpg` outside the banner, carrying none of the words below,
 * lands as `image-missing` on every page it sits on. No regex separates
 * `actie-updates` from `zomer-actie` without naming a filename, which ticket 90
 * forbids — so the banner exclusion carries that case, not this rule.
 *
 * Ticket 126 asked for the other five stores' vocabulary and answered "add none":
 * filenames on this site are not translated even where the copy is.
 */
export const IMAGE_CAMPAIGN =
  /korting|aanbieding|black[-_]?friday|(?<![a-z])deals?(?![a-z])|(?<![a-z])sales?(?![a-z])/i;

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

  // Ticket 34 answers "which of the eleven images". The image record now carries
  // its position on the same counter as the text, so the section it sits in is a
  // backwards scan over the units of its own side.
  const prodHeading = anchorHeadingFor(production.elements);
  const newHeading = anchorHeadingFor(next.elements);

  for (const [key, prod] of prodImages) {
    const image = newImages.get(key);
    const anchorHeading = prodHeading(prod.index);
    // Where the finding is on each side. An image the new site does not have is not
    // there to be scrolled to, so that side is `null` and offers no link.
    //
    // `text` is null throughout this check, and that is the honest answer rather than a
    // gap: an image finding has no words on the page. Its key is a basename and its alt
    // is an attribute, so a text fragment built from either would match nothing and
    // scroll nowhere in silence. The section heading is as close as this tab can get.
    const locations = {
      production: { heading: anchorHeading, text: null },
      new: image ? { heading: newHeading(image.index), text: null } : null,
    };

    if (!image) {
      collector.add({
        class: IMAGE_CAMPAIGN.test(key) ? 'image-campaign' : 'image-missing',
        prod: key,
        new: null,
        anchorHeading,
        locations,
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
      collector.add({ class: 'alt-lost', prod: prodAlt, new: null, anchorHeading, locations });
      continue;
    }
    // The new site gained an alt where production had none. Production is the
    // reference and the tab reports regressions, so this is not a finding.
    // Measured: 0 instances site-wide.
    if (!prodAlt) continue;

    // Ticket 06 reuses ticket 02's vocabulary rather than adding `alt-casing`:
    // `class` is the unit visibility is decided on, and casing is one kind of difference,
    // so it gets one decision. A separate `alt-casing` would split that decision in two
    // and let the same judgement drift between two tabs.
    collector.add({
      class: tier2(prodAlt) === tier2(newAlt) ? 'casing' : 'alt-changed',
      prod: prodAlt,
      new: newAlt,
      anchorHeading,
      locations,
    });
  }

  for (const [key, image] of newImages) {
    if (prodImages.has(key)) continue;
    collector.add({
      // Out of the count for the same reason as `extra-link`: counted, it would
      // double every content block the text diff already reports as an addition.
      class: IMAGE_CAMPAIGN.test(key) ? 'image-campaign' : 'image-added',
      prod: null,
      new: key,
      anchorHeading: newHeading(image.index),
      locations: { production: null, new: { heading: newHeading(image.index), text: null } },
    });
  }
}
