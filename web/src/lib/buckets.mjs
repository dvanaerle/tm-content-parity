/**
 * The three buckets, as the interface says them (ticket 80).
 *
 * The grouping itself is `bucketOf()` in `overrides/state.mjs` — pure, tested, and the
 * only thing that decides which bucket a finding is in. This file holds the **words and
 * the tones**, for the reason `STATE` in `OverrideControl.jsx` holds the state words: a
 * second copy of a label is how one thing comes to be called two things on two screens.
 *
 * `CONTEXT.md` defines all three, and the third is **Closed**. The word ticket 80 retired
 * for it hid the difference between a claim of fact and a judgement; it is not written
 * here, because the stopword guard in `interface-language.test.mjs` refuses it anywhere
 * under `web/src` — comments included, which is the guard working rather than a limit to
 * route around. `CONTEXT.md` names it and explains it, outside the swept tree.
 */

/**
 * Worst first, and Closed last. The order is the reading order on both the dashboard and
 * the ledger, and it is what keeps Closed out of the active workload without hiding it.
 *
 * It is **re-exported and not restated**: the derivation builds its own tallies from this
 * list, so a second copy here is how a fourth bucket comes to be counted in one place and
 * drawn in another.
 */
export { BUCKETS } from '../../../overrides/state.mjs';

/** @type {Record<import('../../../overrides/state.mjs').Bucket, string>} */
export const BUCKET_LABEL = {
  open: 'Open',
  'needs-attention': 'Needs attention',
  closed: 'Closed',
};

/**
 * What each bucket means, as the sentence a reader gets on hover. They are `CONTEXT.md`'s
 * own definitions and not a second set: a bucket that reads one way in the glossary and
 * another way in a tooltip is exactly the drift this file exists to stop.
 *
 * So these are the glossary's three sentences with *"a finding that is"* trimmed off the
 * front, and nothing else. The tempting edit is to shorten Closed to *"no action for now"*
 * and drop the absent findings — but absent is the commonest way a difference closes, and a
 * tooltip that omits it teaches the bucket wrong.
 *
 * @type {Record<import('../../../overrides/state.mjs').Bucket, string>}
 */
export const BUCKET_MEANING = {
  open: 'Waits for a decision.',
  'needs-attention':
    'Contradicted, and nothing else. A page review that went stale is a fact about a page, so it is a badge on the page and never a finding in this bucket.',
  closed: 'Absent from the snapshot, or dismissed, or claimed fixed and not contradicted.',
};

/**
 * **Needs attention shares `attention` with nothing else here, and leans on position.**
 *
 * The palette has no tone that fits it, and this was decided rather than defaulted:
 * `severe` means *the new site is wrong on its own terms*, which a contradicted claim is
 * not — it is an editor's claim that a later observation disagreed with. Amber has only
 * two weights and the second one would have been a lie. So Open goes `neutral` here
 * rather than spending the amber twice, and `attention` is left to mean the one thing on
 * this strip that a person got wrong. It is the same tone `contradicted` already wears in
 * `STATE`, which is the state this bucket holds.
 *
 * Adding an eighth meaning to the palette was the alternative and was refused: ADR 0007
 * keeps that map small on purpose.
 *
 * @type {Record<import('../../../overrides/state.mjs').Bucket, import('./palette.mjs').Tone>}
 */
export const BUCKET_TONE = {
  open: 'neutral',
  'needs-attention': 'attention',
  closed: 'added',
};
