/**
 * The text check (ticket 02). Production is the source of truth; every
 * difference is a defect on the new site.
 *
 * The unit list is the diff spine. Markdown is never used here: it flattens
 * unit identity, and the finding id depends on that identity.
 *
 * One alignment pass produces the rows, and the findings are derived from those
 * rows. The content view and the finding count therefore cannot disagree about what
 * is on the page — a second alignment pass would eventually drift from the
 * first.
 */

import { anchorHeadingFor } from './locate.mjs';
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
 * A row with the units attached. The contract's `DiffRow` is the same row with
 * the units reduced to indices for the wire; this shape is what the
 * comparison works on.
 *
 * @typedef {object} AlignedRow
 * @property {keyof import('./contract.mjs').FINDING_CLASSES | null} class
 * @property {import('./contract.mjs').ContentUnit | null} prod
 * @property {import('./contract.mjs').ContentUnit | null} new
 * @property {number | null} score
 * @property {string | null} [anchorHeading]  The heading this position sits under (ticket 34).
 * @property {import('./contract.mjs').AnchorHeadings} [anchorHeadings]  That heading as
 *                                            each side words it, for the two deep links.
 */

/**
 * Two units that the pairing decided are the same content. Which visible
 * difference is it?
 *
 * The order is the argument. `casing` is asked first, because a difference that
 * is nothing but letter case is a `casing` finding whatever else the text
 * contains — otherwise a price with a capital letter change would report as
 * `price` and not count. `restructured` is asked last of the three that are not
 * work, because it is the weakest claim: it says only that the markup moved.
 *
 * Ticket 62 puts equality before all of it. The pairing can hand this rule two
 * texts that are equal character for character. The LCS keeps document order, so
 * a reorder of 24 identical links on `/downloads` left one copy unmatched on
 * **both** sides. The leftovers then paired at score 1.0, and `casing` answered a
 * question that has no answer. Equal text is the unit rule's question, so it
 * is handed over.
 *
 * `mayPair()` holds a leftover pair to one heading level, and after ticket 67 it
 * permits `cta` against `text`. A heading still pairs with a heading only, so the
 * only class that arrives here from the unit rule is `tag-changed`.
 *
 * @param {import('./contract.mjs').ContentUnit} prod
 * @param {import('./contract.mjs').ContentUnit} next
 * @returns {'casing' | 'price' | 'campaign' | 'restructured' | 'copy' | 'heading-level' | 'tag-changed' | null}
 */
export function classifyPair(prod, next) {
  if (prod.norm === next.norm) return classifyExactPair(prod, next);
  if (tier2(prod.norm) === tier2(next.norm)) return 'casing';
  if (maskNumbers(prod.norm) === maskNumbers(next.norm)) return 'price';
  if (PROMO.test(prod.norm) && PROMO.test(next.norm)) return 'campaign';
  // Ticket 02: the tag must differ **across the sides**. The prototype's rule
  // was "the tag is td or th", which hid every wrong value in a specification
  // table — a defect this log exists to find.
  if (prod.tag !== next.tag) return 'restructured';
  return 'copy';
}

/** @param {import('./contract.mjs').ContentUnit} unit */
const isHeading = (unit) => unit.kind === 'heading';

/**
 * Two units whose normalised text is identical. Is the unit itself still
 * the same?
 *
 * Ticket 33. The LCS anchors on `norm` alone. So before this rule existed a
 * heading demoted from `h2` to `h3` was an exact match that emitted nothing —
 * 762 units on 80 nl pages, 467 of them a heading-level change, measured by
 * `crawl/probes/probe-tag-changes.mjs` **before ticket 67 folded inline links**.
 * That probe reads `data/extract/`, and the fold took production from 9,293 units
 * to 7,424 on the same 179 pages, so the number is history and not a count of
 * today. It is the one rule in spec 32 that turns a silent match into a finding,
 * and the fold does not weaken the reason for it: a folded block still carries the
 * tag it was emitted from.
 *
 * A heading on either side makes it `heading-level`, and it is work. The outline
 * is what a reader and a search engine navigate by. Two non-headings make it
 * `tag-changed`, and it is a diagnostic: production held the words in a `<p>` and the
 * new site holds them in a `<td>`. That is a PageBuilder rebuild, and an editor
 * has nothing to do about it.
 *
 * The class is the unit visibility is decided on (ADR 0005), so `heading-level` covers a
 * level change and a promotion to or from a heading with one word, and one visibility
 * decision covers both. That is accepted: both break the outline in the same way. The
 * finding carries a `detail` (`h2 → h3`), so the two are still separate findings
 * with separate ids.
 *
 * This is not `restructured`. That class needs the **text** to differ as well,
 * and it is the weakest claim the pairing makes. This rule fires on text that is
 * character-for-character identical, which is a much stronger statement.
 *
 * @param {import('./contract.mjs').ContentUnit} prod
 * @param {import('./contract.mjs').ContentUnit} next
 * @returns {'heading-level' | 'tag-changed' | null} `null` if the unit is unchanged.
 */
export function classifyExactPair(prod, next) {
  // The tag alone. `level` is derived from the tag in `crawl/extract.mjs`, so it
  // cannot differ while the tag is equal, and a second test would read as a rule
  // that does not exist.
  if (prod.tag === next.tag) return null;
  return isHeading(prod) || isHeading(next) ? 'heading-level' : 'tag-changed';
}

/**
 * The two classes `classifyExactPair()` makes, and the only ones whose two sides
 * of text are equal. They are the reason a finding needs a `detail`.
 */
const EXACT_PAIR_CLASSES = new Set(['heading-level', 'tag-changed']);

/**
 * What changed on a row whose two texts are equal, as an editor reads it.
 *
 * `null` on every other class, and that keeps their finding ids exactly where
 * they were: `findingId()` joins `detail` only when it is present.
 *
 * @param {AlignedRow} row
 * @returns {string | null}
 */
function tagChange(row) {
  if (!row.class || !EXACT_PAIR_CLASSES.has(row.class)) return null;
  return `${row.prod?.tag} → ${row.new?.tag}`;
}

/**
 * Align the two unit lists and label every position. A row with
 * `class: null` holds the same text in the same unit, and ticket 02 is
 * explicit that it is not a finding: the earlier count of 61 was wrong because
 * it counted them. Ticket 62: which tier paired the row does not change that.
 *
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @returns {AlignedRow[]} In production's document order.
 */
export function diffRows(production, next) {
  const prodUnits = production.elements;
  const newUnits = next.elements;

  const exact = lcsPairs(prodUnits, newUnits);
  const pairedProd = new Set(exact.map(([i]) => prodUnits[i]));
  const pairedNew = new Set(exact.map(([, j]) => newUnits[j]));

  /** @type {AlignedRow[]} */
  const rows = exact.map(([i, j]) => ({
    class: classifyExactPair(prodUnits[i], newUnits[j]),
    prod: prodUnits[i],
    new: newUnits[j],
    score: null,
  }));

  const { pairs, prodOnly, newOnly } = pairLeftovers(
    prodUnits.filter((unit) => !pairedProd.has(unit)),
    newUnits.filter((unit) => !pairedNew.has(unit)),
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

  // Ticket 02 gives a one-sided unit a single class. A production campaign
  // line the new site dropped is `text-missing`, not `campaign`, because
  // `campaign` needs the pattern on both sides. Ticket 06 relaxed that for images
  // only, where the identity is a filename and the ambiguity is absent.
  //
  // Ticket 33 names the two directions apart. `structure` said only "the unit
  // is on one side only", which is a statement about the alignment rather than
  // about the sites, and it carried the same word for a dropped paragraph and an
  // invented one.
  for (const unit of prodOnly) {
    rows.push({ class: 'text-missing', prod: unit, new: null, score: null });
  }
  for (const unit of newOnly) {
    rows.push({ class: 'text-added', prod: null, new: unit, score: null });
  }

  const sorted = inProductionOrder(rows);

  // Ticket 34: the position an editor scrolls to. Production is the source of
  // truth, so its heading names the section; a row the new site invented has no
  // production side and takes the heading above it on the new site.
  const prodHeading = anchorHeadingFor(prodUnits);
  const newHeading = anchorHeadingFor(newUnits);
  for (const row of sorted) {
    // Each side's own wording of the section, for the deep link that opens **that**
    // side. A row is on one side or both, and the side it is not on gets `null`: there
    // is no position there to scroll to, and a link built from the other side's heading
    // would name text the page does not contain and scroll nowhere in silence.
    row.anchorHeadings = {
      production: row.prod ? prodHeading(row.prod.index) : null,
      new: row.new ? newHeading(row.new.index) : null,
    };
    // The section's name, which the row displays and a mute keys on. Production is the
    // source of truth, so it names the section wherever it has one.
    row.anchorHeading = row.prod ? row.anchorHeadings.production : row.anchorHeadings.new;
  }
  return sorted;
}

/**
 * Production's document order, with a new-only unit read in place rather than
 * collected at the end.
 *
 * **Ticket 34 fixes the defect here.** A new-only row used to sort on its index in
 * the *new* document, compared against *production* indices. The two index spaces
 * only coincide while the two documents are about the same length, and on
 * `fotogalerij` production holds 163 content units against the new site's 47
 * (2026-08-10, after the fold; 178 against 9 before it) — so
 * an addition that belongs at the foot of the page sorted near the top. The rule
 * is instead: **anchor a new-only row to the production position of the nearest
 * matched pair before it**, which is the last place the two documents agreed.
 *
 * Two cases have no pair before them. An addition above the **first** agreement is
 * anchored just before that agreement, not at the top of the page: on `fotogalerij`
 * the first agreement is production unit 21, and the top of production is not
 * where the new site's opening block belongs. It was unit 170 before the fold. The
 * fold gave the new site 47 units where it had 9, so the two documents agree in 15
 * places instead of one. The rule does not change. The case it defends against is
 * smaller. And when the two documents agree
 * **nowhere**, there is no position to claim, so the additions follow the whole of
 * production — a wholly rebuilt page reads as production first, then the new site.
 *
 * The key is a tuple rather than a fraction, so no arithmetic can collide a new-only
 * row with the production row it must sit against: the base position, then before
 * (`-1`) or after (`1`) the rows with a production side, then the new-document order
 * among the additions that share a base.
 *
 * @param {AlignedRow[]} rows
 * @returns {AlignedRow[]}
 */
function inProductionOrder(rows) {
  const matched = rows
    .filter((row) => row.prod && row.new)
    .sort((a, b) => a.new.index - b.new.index);

  // One past the last production unit, which is what "the additions follow the
  // whole of production" means as a position. It has to be a real number: two rows
  // that both claimed `Infinity` would subtract to `NaN` in the comparator below.
  const afterProduction = rows.reduce((last, row) => Math.max(last, row.prod ? row.prod.index + 1 : 0), 0);

  const keyed = rows.map((row) => ({ row, key: sortKey(row, matched, afterProduction) }));
  keyed.sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2]);
  return keyed.map((entry) => entry.row);
}

/**
 * @param {AlignedRow} row
 * @param {AlignedRow[]} matched  Rows with both sides, by their new-document index.
 * @param {number} afterProduction  One past the last production unit.
 * @returns {[number, number, number]}
 */
function sortKey(row, matched, afterProduction) {
  if (row.prod) return [row.prod.index, 0, 0];

  const index = row.new?.index ?? 0;
  let before = null;
  for (const pair of matched) {
    if (pair.new.index >= index) break;
    before = pair;
  }

  if (before) return [before.prod.index, 1, index];
  if (matched.length) return [matched[0].prod.index, -1, index];
  return [afterProduction, 1, index];
}

/**
 * @param {AlignedRow[]} rows
 * @param {import('./findings.mjs').FindingCollector} collector
 */
export function textFindings(rows, collector) {
  for (const row of rows) {
    if (!row.class) continue;
    // The row keeps the id of the finding it was grouped into, so the content view
    // can offer an override control on a position. Six positions that grouped to
    // one finding all carry that one id, and acting on any of them acts on all
    // six — which is what grouping means.
    row.finding = collector.add({
      class: row.class,
      prod: row.prod?.norm ?? null,
      new: row.new?.norm ?? null,
      // Ticket 33: on `heading-level` and `tag-changed` the two sides of text are
      // equal, so the record would say "identical" and give an `h2` → `h3` the
      // same id as an `h2` → `h4`. The detail is what changed.
      detail: tagChange(row),
      anchorHeading: row.anchorHeading ?? null,
      anchorHeadings: row.anchorHeadings ?? { production: null, new: null },
      score: row.score,
    });
  }
}
