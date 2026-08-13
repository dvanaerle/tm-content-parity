/**
 * What the `<head>` panel shows (ticket 35, phase 6 of spec 32).
 *
 * **This makes no findings.** Ticket 21 has not decided what a parity defect in the
 * head is, and this ticket does not decide it. Nothing here goes into the contract,
 * the bar or the count. The panel uses the diff's colours, thus an editor reads a
 * changed `<title>` in the same way as changed body copy. The panel has no override
 * control, thus the shared colours cannot show something an editor can act on.
 *
 * Each rule in this file answers one question: *does an editor see this row?* Each
 * rule is about attention, and not about correctness. This is also why the rules
 * are here and not in a component. A rule that decides what a person never sees
 * needs a test.
 *
 * **Browser-safe and pure.** The panel is inside a React island, so this imports
 * only `shared/keys.mjs`, which imports nothing.
 */

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
  return value === '' ? null : value ?? null;
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

    const state = field === 'canonical'
      ? stateOf(fold(prod, hosts), fold(value, hosts))
      : stateOf(prod, value);

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
