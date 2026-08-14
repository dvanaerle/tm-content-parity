/**
 * How a finding class looks. The vocabulary itself is the contract's, never
 * restated here — this file only names the **tone** of each class and the Dutch
 * label an editor reads. The tone's pixels come from `palette.mjs`, which is the
 * one place a colour is defined.
 *
 * The tone rule is one rule: a class that is not `work` is grey. Ticket 09 gives it
 * no place in the bar either, so nothing coloured is ever something the editor was
 * not asked to look at. Ticket 75 split the grey half in two — `information` renders
 * and `diagnostic` sits behind the noise toggle — and it is one tone, because the
 * colour answers *is this work* and that answer is the same for both.
 */

// `vocabulary.mjs`, not `contract.mjs`: the contract also makes finding ids and
// needs `node:crypto`, which a browser bundle cannot resolve.
import { FINDING_CLASSES, isWork, visibilityOf } from '../../../compare/vocabulary.mjs';
import { PILL } from './palette.mjs';

/**
 * `lost` is not in this table. It is the tone of "production had this and the new
 * site does not", on all three checks, and the class itself says which those are:
 * `direction: 'lost'` in the contract. Spelling the three names here again would
 * let the colour come apart from the meaning.
 *
 * Ticket 35 moved `broken-link` off red. Red now means a lost unit and only
 * that, so the loudest a defect on the new site's own terms can be is `warning`.
 *
 * `casing` takes `info` and not `closed`. A letter-case difference is not done — it is
 * work, and `toneOf()`
 * below only reaches this table when it is — so `info` here is the third rung of a
 * weight ramp under `warning` and `caution`, and never a claim that the row is finished.
 *
 * @type {Record<string, import('./palette.mjs').Tone>}
 */
const TONE = {
  'broken-link': 'warning',
  leakage: 'warning',
  'cross-store-link': 'warning',
  // `heading-level` sat here until ticket 86 moved it to `information`, and `toneOf()`
  // answers `neutral` for that before it ever reads this table. The entry was removed
  // rather than left: a tone that cannot be reached is a tone the next reader would
  // trust.
  copy: 'caution',
  'link-target': 'caution',
  'alt-lost': 'caution',
  'alt-changed': 'caution',
  casing: 'info',
};

/** @type {Record<string, string>} */
export const CHECK_LABEL = {
  text: 'Text',
  links: 'Links',
  images: 'Images',
  meta: 'Meta',
};

/**
 * The class is the whole input. It was the class and its record, and the record was
 * the caller's second reading of the same table — which is one more place for a
 * class that is not in it to be handled differently.
 *
 * @param {string} cls
 * @returns {import('./palette.mjs').Tone}
 */
function toneOf(cls) {
  // A class whose visibility is `information` goes `neutral` and **not** the `info` tone,
  // near-miss though the two words are. `info` is a weight — the quietest rung that is
  // still inside the work — while `neutral` is the palette carrying no judgement about the
  // class at all, which is the one meaning ticket 131 left that tone. The table above is
  // never reached from here.
  if (!isWork(cls)) return 'neutral';
  if (FINDING_CLASSES[cls].direction === 'lost') return 'lost';
  return TONE[cls] ?? 'caution';
}

/**
 * Whether a finding is one an editor can **decide** (ticket 86).
 *
 * `CONTEXT.md` says an `information` finding exactly: **a finding you can link to and
 * cannot decide.** It keeps its id, because somebody may have to be sent to it, and it
 * offers no override control, because a dismissal says "these two exact strings are
 * acceptable" and on an information row nothing is being asked.
 *
 * It reads the **visibility** and never a class name. Ticket 86 moved `heading-level`
 * behind it and ticket 116 brings `regrouped`; written as a special case for the first it
 * would have to be built twice. It is the sibling of `toneOf()` above, and it is here for
 * the same reason: a rule the interface derives from the visibility belongs beside the
 * other one, not in whichever surface asked first. The three surfaces that ask are the
 * content view, Links and Images — and two of them have no rows, so this cannot
 * live in `view.mjs`, which is the content view's own module.
 *
 * It is deliberately **not** `isWork()`. A `diagnostic` finding is decidable: what a rule
 * saw sits behind *Show noise*, and it keeps the control it has. Only `information` says
 * that nothing is being asked.
 *
 * A row whose two sides agree carries no finding at all (ticket 02) and has nothing to
 * ask either, so `null` answers `false`. One field covering both cases is what lets
 * ticket 79's context marker read one rule instead of two.
 *
 * @param {{ visibility?: import('../../../compare/vocabulary.mjs').Visibility } | null | undefined} finding
 *   A finding the override derivation has decided, or `null`.
 * @returns {boolean}
 */
export const canDecide = (finding) => Boolean(finding) && finding.visibility !== 'information';

/**
 * @param {string} cls
 * @returns {{ class: string, check: string,
 *   visibility: import('../../../compare/vocabulary.mjs').Visibility, meaning: string,
 *   direction: 'lost' | 'added' | null, tone: import('./palette.mjs').Tone, pill: string }}
 */
export function classInfo(cls) {
  const record = FINDING_CLASSES[cls];
  const tone = toneOf(cls);
  return {
    class: cls,
    check: record?.check ?? 'text',
    visibility: visibilityOf(cls),
    meaning: record?.meaning ?? '',
    // The diff paints a whole cell only on a one-sided class, so it needs the
    // direction itself and not the tone: `text-added` is `information` and
    // therefore grey, and its cell is still green.
    direction: record?.direction ?? null,
    tone,
    pill: PILL[tone],
  };
}

export { FINDING_CLASSES, isWork, visibilityOf };
