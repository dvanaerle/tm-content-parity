/**
 * The text check (ticket 02). Production is the source of truth; every
 * difference is a defect on the new site.
 *
 * The element list is the diff spine. Markdown is never used here: it flattens
 * element identity, and the finding id depends on that identity.
 *
 * One alignment pass produces the rows, and the findings are derived from those
 * rows. The Diff tab and the finding count therefore cannot disagree about what
 * is on the page — a second alignment pass would eventually drift from the
 * first.
 */

import { lcsPairs, maskNumbers, pairLeftovers, tier2 } from './match.mjs';

/**
 * Promotional copy. Ticket 02: the pattern must match **both** sides, because a
 * keyword on one side alone classed `Bekijk alle deals` → `Bekijk alle FAQs` as
 * a campaign difference. That is a real CTA change, and the most important kind
 * of finding this log makes.
 *
 * `actie(?!f)` keeps `actief` out.
 */
export const PROMO = /korting|deal|actie(?!f)|aanbieding|black\s*friday|sale|nu\s+vanaf|op\s+voorraad/i;

/**
 * A row with the elements attached. The contract's `DiffRow` is the same row with
 * the elements reduced to indices for the wire; this shape is what the
 * comparison works on.
 *
 * @typedef {object} AlignedRow
 * @property {keyof import('./contract.mjs').FINDING_CLASSES | null} class
 * @property {import('./contract.mjs').TextElement | null} prod
 * @property {import('./contract.mjs').TextElement | null} new
 * @property {number | null} score
 */

/**
 * Two elements that the pairing decided are the same content. Which visible
 * difference is it?
 *
 * The order is the argument. `casing` is asked first, because a difference that
 * is nothing but letter case is a `casing` finding whatever else the text
 * contains — otherwise a price with a capital letter change would report as
 * `price` and hide. `restructured` is asked last of the hidden three, because it
 * is the weakest claim: it says only that the markup moved.
 *
 * @param {import('./contract.mjs').TextElement} prod
 * @param {import('./contract.mjs').TextElement} next
 * @returns {'casing' | 'price' | 'campaign' | 'restructured' | 'copy'}
 */
export function classifyPair(prod, next) {
  if (tier2(prod.norm) === tier2(next.norm)) return 'casing';
  if (maskNumbers(prod.norm) === maskNumbers(next.norm)) return 'price';
  if (PROMO.test(prod.norm) && PROMO.test(next.norm)) return 'campaign';
  // Ticket 02: the tag must differ **across the sides**. The prototype's rule
  // was "the tag is td or th", which hid every wrong value in a specification
  // table — a defect this log exists to find.
  if (prod.tag !== next.tag) return 'restructured';
  return 'copy';
}

/**
 * Align the two element lists and label every position. A row with
 * `class: null` is an exact tier-1 match, and ticket 02 is explicit that it is
 * **not** a finding: the earlier count of 61 was wrong because it counted them.
 *
 * The LCS anchors on `norm` alone and ignores the tag, so text that production
 * held in a `<p>` and the new site holds in a `<td>`, unchanged, is an exact
 * match and makes no finding at all. Ticket 02 defines `restructured` as "the
 * same content, built with a different element", which reads as though this
 * case should fire it. It does not, and that is the right outcome: the class is
 * hidden by default and an editor has nothing to do about markup that carries
 * the same words. In practice `restructured` means "the text differs **and** the
 * element moved".
 *
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @returns {AlignedRow[]} In production's document order.
 */
export function diffRows(production, next) {
  const prodElements = production.elements;
  const newElements = next.elements;

  const anchors = lcsPairs(prodElements, newElements);
  const anchoredProd = new Set(anchors.map(([i]) => prodElements[i]));
  const anchoredNew = new Set(anchors.map(([, j]) => newElements[j]));

  /** @type {AlignedRow[]} */
  const rows = anchors.map(([i, j]) => ({
    class: null,
    prod: prodElements[i],
    new: newElements[j],
    score: null,
  }));

  const { pairs, prodOnly, newOnly } = pairLeftovers(
    prodElements.filter((element) => !anchoredProd.has(element)),
    newElements.filter((element) => !anchoredNew.has(element)),
  );

  for (const pair of pairs) {
    const cls = classifyPair(pair.prod, pair.new);
    rows.push({
      class: cls,
      prod: pair.prod,
      new: pair.new,
      // Ticket 02 keeps the similarity score as a number, on `copy` only, and
      // does not put it in a confidence bucket.
      score: cls === 'copy' ? pair.score : null,
    });
  }

  // Ticket 02 gives a one-sided element a single class. A production campaign
  // line the new site dropped is `structure`, not `campaign`, because `campaign`
  // needs the pattern on both sides. Ticket 06 relaxed that for images only,
  // where the identity is a filename and the ambiguity is absent.
  for (const element of prodOnly) {
    rows.push({ class: 'structure', prod: element, new: null, score: null });
  }
  for (const element of newOnly) {
    rows.push({ class: 'structure', prod: null, new: element, score: null });
  }

  // A new-only element sorts just after the production element it follows, so an
  // addition reads in place instead of collecting at the end.
  return rows.sort((a, b) => order(a) - order(b));
}

/** @param {AlignedRow} row */
function order(row) {
  return row.prod ? row.prod.index : (row.new?.index ?? 0) + 0.5;
}

/**
 * @param {AlignedRow[]} rows
 * @param {import('./findings.mjs').FindingCollector} collector
 */
export function textFindings(rows, collector) {
  for (const row of rows) {
    if (!row.class) continue;
    // The row keeps the id of the finding it was grouped into, so the Diff tab
    // can offer an override control on a position. Six positions that grouped to
    // one finding all carry that one id, and acting on any of them acts on all
    // six — which is what grouping means.
    row.finding = collector.add({
      class: row.class,
      prod: row.prod?.norm ?? null,
      new: row.new?.norm ?? null,
      score: row.score,
    });
  }
}
