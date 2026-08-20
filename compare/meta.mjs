/**
 * The `<head>`: which rows an editor is shown, and which of them are findings.
 *
 * The two answers are one file because they are one decision. `metaRows()` was
 * display only until ticket 97; the producer below reads its rows rather than the two
 * extracts, so a row an editor cannot act on cannot become work behind their back.
 * **Each checking row holds at most one finding** — the title classes are mutually
 * exclusive, and so are the two robots ones — which is what lets the panel stay a
 * table of fields instead of a list of defects.
 *
 * **Browser-safe and pure.** The panel is inside a React island, so this imports only
 * `./match.mjs` and `shared/keys.mjs`, neither of which imports anything.
 */

import { tier2 } from './match.mjs';
import { linkKey } from '../shared/keys.mjs';

/**
 * The fields, in reading order.
 *
 * `h1` is **not** one of them. It is a unit inside the content boundary, and
 * the merged content view owns it. That view gives it a position, a level and a
 * finding id. The `h1` differs on 93 of 179 nl pages, and one report is enough.
 */
export const META_FIELDS = ['title', 'description', 'canonical', 'noindex'];

/**
 * @typedef {object} MetaRow
 * @property {string} field
 * @property {string | null} prod  Display text. The raw value, never the folded one —
 *                                 an editor comparing canonicals wants the hostname on screen.
 * @property {string | null} new
 * @property {'same' | 'changed' | 'lost' | 'added'} state  `lost` is production's value gone,
 *                                                          `added` is a value production never had.
 */

/**
 * Fold an absolute url down to the identity the links check uses: the page's own
 * two hosts become one token. A relative or non-url value is its own identity.
 *
 * 18 of 179 nl pages differ on the canonical by hostname alone, which is the
 * environment and not the content.
 *
 * @param {string | null} value
 * @param {{ prodHost: string, newHost: string }} hosts
 * @returns {string | null}
 */
function fold(value, hosts) {
  if (value === null || value === '') return null;
  try {
    return linkKey(new URL(value), hosts);
  } catch {
    return value;
  }
}

/**
 * `noindex` is a boolean in the data and a word on the screen. The two words are
 * the words of a `<meta name="robots">` tag. Thus an editor can search the page
 * source for the word that the panel shows.
 *
 * @param {import('./contract.mjs').PageMeta} meta
 * @param {string} field
 * @returns {string | null}
 */
function display(meta, field) {
  const value = meta[field];
  if (field === 'noindex') return value ? 'noindex' : 'index';
  return value === '' ? null : (value ?? null);
}

/**
 * @param {string | null} prod
 * @param {string | null} next
 * @returns {MetaRow['state']}
 */
function stateOf(prod, next) {
  if (prod === next) return 'same';
  if (next === null) return 'lost';
  if (prod === null) return 'added';
  return 'changed';
}

/**
 * The rows for one page's `<head>`.
 *
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @returns {MetaRow[]} A row an editor has no power over is absent, not rendered quietly.
 */
export function metaRows(production, next) {
  const hosts = {
    prodHost: new URL(production.url).host,
    newHost: new URL(next.url).host,
  };

  /** @type {MetaRow[]} */
  const rows = [];

  for (const field of META_FIELDS) {
    const prod = display(production.meta, field);
    const value = display(next.meta, field);

    const state =
      field === 'canonical' ? stateOf(fold(prod, hosts), fold(value, hosts)) : stateOf(prod, value);

    // The canonical suppression, and it is **directional**. Production has no
    // canonical on 147 of 179 nl pages and the new site sets one on all of them.
    // The content team cannot set a canonical, so that was never an actionable
    // difference — but the 2 pages where the new site **lost** one are a launch
    // problem, and they stay. A symmetric rule would have buried them.
    if (field === 'canonical' && state === 'added') continue;

    rows.push({ field, prod, new: value, state });
  }

  return rows;
}

/**
 * The class one head row produces, or `null` for a row no editor can act on.
 *
 * A row yields **at most one** class: the three title classes are mutually exclusive
 * and so are the two robots ones, which is what lets the field row be the finding row.
 *
 * @param {MetaRow} row
 * @returns {string | null}
 */
function classOf(row) {
  if (row.state === 'same') return null;
  if (row.field === 'title' || row.field === 'description') {
    if (row.state === 'lost') return `meta-${row.field}-lost`;
    if (row.state === 'added') return `meta-${row.field}-added`;
    // Tier 2 is **not** folded here. A dropped trailing full stop is `meta-casing`,
    // because folding it would make the head the one place in the log where a lost
    // full stop is invisible.
    return tier2(row.prod) === tier2(row.new) ? 'meta-casing' : `meta-${row.field}-changed`;
  }
  // Off the derived boolean, which `display()` has already turned into the two words a
  // `<meta name="robots">` tag uses. The raw string stays display only: two spellings
  // of the same directive are not a difference an editor can act on.
  if (row.field === 'noindex') {
    return row.new === 'noindex' ? 'robots-index-lost' : 'robots-noindex-lost';
  }
  // The canonical, and nothing else reaches here. It keeps its row and makes no work:
  // the content team cannot set one, and production has none on 147 of 179 nl pages.
  return null;
}

/**
 * The head as a check, alongside text, links and images (ticket 97). The rows an
 * editor is shown are the rows a finding can come from, so this reads `metaRows()`
 * rather than the two extracts: one decision about what the head holds, in one place.
 *
 * **The collector is a parameter and not an import.** This module is inside a React
 * island, and `findings.mjs` reaches `node:crypto` through `contract.mjs`, so importing
 * it would break the island build (ADR 0001). `compare/images.mjs` has the same shape.
 *
 * A meta finding carries no `score` — that is a `copy` field and a head row has no
 * similarity pairing — and no `anchorHeading`, which is defined by document order
 * inside the content boundary, where the head is not. Both are the collector's
 * defaults.
 *
 * @param {import('./contract.mjs').PageExtract} production
 * @param {import('./contract.mjs').PageExtract} next
 * @param {import('./findings.mjs').FindingCollector} collector
 */
export function compareMeta(production, next, collector) {
  for (const row of metaRows(production, next)) {
    const cls = classOf(row);
    if (cls) collector.add({ class: cls, prod: row.prod, new: row.new });
  }
}
