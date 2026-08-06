/**
 * How a finding class looks. The vocabulary itself is the contract's, never
 * restated here — this file only names the **tone** of each class and the Dutch
 * label an editor reads. The tone's pixels come from `palette.mjs`, which is the
 * one place a colour is defined.
 *
 * The tone rule is one rule: a class hidden by default is grey. Ticket 09 gives
 * a hidden class no place in the bar either, so nothing coloured is ever
 * something the editor was not asked to look at.
 */

// `vocabulary.mjs`, not `contract.mjs`: the contract also makes finding ids and
// needs `node:crypto`, which a browser bundle cannot resolve.
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';
import { PILL } from './palette.mjs';

/**
 * `lost` is not in this table. It is the tone of "production had this and the new
 * site does not", on all three checks, and the class itself says which those are:
 * `direction: 'lost'` in the contract. Spelling the three names here again would
 * let the colour come apart from the meaning.
 *
 * Ticket 35 moved `broken-link` off red. Red now means a lost element and only
 * that, so the loudest a defect on the new site's own terms can be is `severe`.
 *
 * @type {Record<string, import('./palette.mjs').Tone>}
 */
const TONE = {
  'broken-link': 'severe',
  leakage: 'severe',
  'cross-store-link': 'severe',
  'heading-level': 'attention',
  copy: 'attention',
  'link-target': 'attention',
  'alt-lost': 'attention',
  'alt-changed': 'attention',
  casing: 'info',
};

/** @type {Record<string, string>} */
export const CHECK_LABEL = {
  text: 'Tekst',
  links: 'Links',
  images: "Afbeeldingen",
  meta: 'Meta',
};

/**
 * @param {string} cls
 * @param {import('../../../compare/vocabulary.mjs').FindingClass | undefined} record
 * @returns {import('./palette.mjs').Tone}
 */
function toneOf(cls, record) {
  if (!record?.shown) return 'neutral';
  if (record.direction === 'lost') return 'lost';
  return TONE[cls] ?? 'attention';
}

/**
 * @param {string} cls
 * @returns {{ class: string, check: string, shown: boolean, meaning: string,
 *   direction: 'lost' | 'added' | null, tone: import('./palette.mjs').Tone, pill: string }}
 */
export function classInfo(cls) {
  const record = FINDING_CLASSES[cls];
  const tone = toneOf(cls, record);
  return {
    class: cls,
    check: record?.check ?? 'text',
    shown: record?.shown ?? false,
    meaning: record?.meaning ?? '',
    // The diff paints a whole cell only on a one-sided class, so it needs the
    // direction itself and not the tone: `text-added` is hidden by default and
    // therefore grey, and its cell is still green.
    direction: record?.direction ?? null,
    tone,
    pill: PILL[tone],
  };
}

/** @param {string} cls */
export const isShown = (cls) => FINDING_CLASSES[cls]?.shown ?? false;

export { FINDING_CLASSES };
