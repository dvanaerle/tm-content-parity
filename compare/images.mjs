/**
 * The images check (ticket 06). Identity is the basename, made in the extractor,
 * because full-path matching scores 2.8%: production resizes through Cloudflare
 * and the two environments carry different catalog cache hashes.
 *
 * Images are compared as a **set**. The new site emits a mobile and a desktop
 * copy of the same src on every page, so a raw count difference is never a
 * finding. The extractor already deduplicates, which is why this file can treat
 * the list as a set without doing it again.
 *
 * A set comparison on the basename cannot see a **rename**: the two sides share no key, so
 * `max.svg → max-new.svg` arrives as an `image-missing` and an `image-added` that an editor
 * joins in their head, and the new filename is on no `work` finding and therefore in no
 * search index. `renamedImage()` below is the one rule here whose matcher is not a key
 * lookup, and ADR 0027 is why it is arity and position rather than the byte digest that
 * would be stronger.
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
 * The one image on this side that the other side has no key for, and the position it sits
 * at — or nothing, where there is not exactly one.
 *
 * Position is the record's place in **this side's own image order**, and never its `index`.
 * `index` is a document-order counter shared with the text units (ticket 34), so it counts
 * whatever prose happens to sit between two photos; comparing one side's against the other's
 * would ask whether the two pages have the same number of paragraphs. What the rule needs is
 * *the fourth image on this page is the fourth image on that one*, which is what an editor
 * can verify by eye — so the images are ordered among themselves and their ranks compared.
 *
 * A campaign filename is excluded because it is a `diagnostic` on either side and never an
 * `image-missing` or an `image-added`, so it is not one of the two the rule counts.
 *
 * @param {Map<string, import('./contract.mjs').ImageRecord>} mine
 * @param {Map<string, import('./contract.mjs').ImageRecord>} theirs
 * @returns {{ image: import('./contract.mjs').ImageRecord, position: number } | null}
 */
function soleUnclaimed(mine, theirs) {
  // Campaign artwork leaves **before** the ranking and not after it. Ranked after, a
  // banner one side carries and the other does not would shift every image below it by
  // one and decline a rename the rule means to make — the campaign image would be
  // excluded from pairing and still be counted in the positions.
  const ordered = [...mine.values()]
    .filter((image) => !IMAGE_CAMPAIGN.test(image.key))
    .sort((a, b) => a.index - b.index);
  const unclaimed = ordered
    .map((image, position) => ({ image, position }))
    .filter(({ image }) => !theirs.has(image.key));
  return unclaimed.length === 1 ? unclaimed[0] : null;
}

/**
 * The page's rename, or `null` where it has none. ADR 0027.
 *
 * **Arity and position, both.** One unclaimed image on each side, at the same rank. A reader
 * can verify that the fourth image on one side is the fourth on the other; they cannot verify
 * which of three became which of three, so many-to-many is refused rather than guessed at —
 * `regrouped`'s rule about runs, applied to images.
 *
 * **Equal alt text raises the score and does not gate the pairing.** An empty alt on both
 * sides is parity rather than a finding on this check, and most of the corpus is exactly
 * that, so a rule requiring the alt to agree would answer nothing where it matters. The alt
 * corroborates a pairing the arity and the position already made: 1 where both sides carry
 * the same non-empty alt, and 0.5 otherwise — an empty alt on either side, and two alts that
 * disagree, both land on 0.5. They are one answer because they are one thing: *the alt does
 * not corroborate*. Two alts that disagree are not evidence against a rename either, since a
 * page that renamed an image is a page somebody edited and the alt is what they edited.
 *
 * ADR 0027 expects this function to be replaced, and only this function. A byte digest of the
 * original pairs without arity, without position and without a tiebreak — measured at 70.3%
 * against filename matching's 19.6% on the album pages, with no false pair anywhere — and it
 * needs a crawl stage that fetches images, which no stage does. The class, the arrow, the two
 * searchable basenames and the ordering below are the same either way.
 *
 * @param {Map<string, import('./contract.mjs').ImageRecord>} prodImages
 * @param {Map<string, import('./contract.mjs').ImageRecord>} newImages
 * @returns {{ prod: import('./contract.mjs').ImageRecord,
 *   new: import('./contract.mjs').ImageRecord, score: number } | null}
 */
function renamedImage(prodImages, newImages) {
  const lost = soleUnclaimed(prodImages, newImages);
  const arrived = soleUnclaimed(newImages, prodImages);
  if (!lost || !arrived || lost.position !== arrived.position) return null;

  const alt = lost.image.alt ?? '';
  return {
    prod: lost.image,
    new: arrived.image,
    score: alt && alt === (arrived.image.alt ?? '') ? 1 : 0.5,
  };
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

  // Before either loop emits, so neither half of the pair is also a single.
  const renamed = renamedImage(prodImages, newImages);
  if (renamed) {
    collector.add({
      class: 'image-renamed',
      // The two basenames go in these two columns and not in the detail alone, because the
      // search index reads `prod` and `new` and reads no detail. A search for the **new**
      // filename returning the finding is half of what this class is for, and today that
      // name is only ever on an `image-added`: `information`, unindexed, unfindable.
      prod: renamed.prod.key,
      new: renamed.new.key,
      detail: `${renamed.prod.key} → ${renamed.new.key}`,
      anchorHeading: prodHeading(renamed.prod.index),
      locations: {
        production: { heading: prodHeading(renamed.prod.index), text: null },
        new: { heading: newHeading(renamed.new.index), text: null },
      },
      score: renamed.score,
    });
  }

  for (const [key, prod] of prodImages) {
    if (renamed && key === renamed.prod.key) continue;
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
    if (renamed && key === renamed.new.key) continue;
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
