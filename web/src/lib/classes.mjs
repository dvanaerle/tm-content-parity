/**
 * How a finding class looks. The vocabulary itself is the contract's, never
 * restated here — this file only adds the colour and the Dutch label an editor
 * reads.
 *
 * The tone rule is one rule: a class hidden by default is grey. Ticket 09 gives
 * a hidden class no place in the bar either, so nothing coloured is ever
 * something the editor was not asked to look at.
 */

// `vocabulary.mjs`, not `contract.mjs`: the contract also makes finding ids and
// needs `node:crypto`, which a browser bundle cannot resolve.
import { FINDING_CLASSES } from '../../../compare/vocabulary.mjs';

/** @type {Record<string, string>} */
const TONE = {
  'broken-link': 'red',
  // Rose is the tone of "production had this and the new site does not", on all
  // three checks. Ticket 33 gave text its own name for that direction.
  'text-missing': 'rose',
  'missing-link': 'rose',
  'image-missing': 'rose',
  'heading-level': 'amber',
  copy: 'amber',
  'link-target': 'amber',
  'alt-lost': 'amber',
  'alt-changed': 'amber',
  casing: 'sky',
  leakage: 'violet',
  'cross-store-link': 'violet',
};

/** Tailwind needs the whole class name in the source, so no template strings. */
const PILL = {
  red: 'bg-red-100 text-red-800',
  rose: 'bg-rose-100 text-rose-800',
  amber: 'bg-amber-100 text-amber-900',
  sky: 'bg-sky-100 text-sky-800',
  violet: 'bg-violet-100 text-violet-800',
  slate: 'bg-slate-100 text-slate-600',
};

const DOT = {
  red: 'bg-red-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
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
 * @returns {{ class: string, check: string, shown: boolean, meaning: string, pill: string, dot: string }}
 */
export function classInfo(cls) {
  const record = FINDING_CLASSES[cls];
  const tone = record?.shown ? (TONE[cls] ?? 'amber') : 'slate';
  return {
    class: cls,
    check: record?.check ?? 'text',
    shown: record?.shown ?? false,
    meaning: record?.meaning ?? '',
    pill: PILL[tone],
    dot: DOT[tone],
  };
}

/** @param {string} cls */
export const isShown = (cls) => FINDING_CLASSES[cls]?.shown ?? false;

export { FINDING_CLASSES };
