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
 * @type {import('../../../overrides/state.mjs').Bucket[]}
 */
export const BUCKETS = ['open', 'needs-attention', 'closed'];

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
 * @type {Record<import('../../../overrides/state.mjs').Bucket, string>}
 */
export const BUCKET_MEANING = {
  open: 'Waits for a decision.',
  'needs-attention':
    'Claimed fixed, but a later observation still sees the difference. Nothing else is in here — a page review that went stale is a badge on the page.',
  closed: 'Dismissed, or claimed fixed and not contradicted. No action for now.',
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
