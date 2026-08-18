import { describe, expect, it } from 'vitest';

import { BUCKETS } from '../../../overrides/state.mjs';
import { BUCKET_LABEL, BUCKET_MEANING, BUCKET_TONE, BUCKETS as WORDS_BUCKETS } from './buckets.mjs';
import { TONES } from './palette.mjs';

/**
 * The interface side of ticket 80's grouping.
 *
 * `overrides/state.mjs` owns the rule and proves it is total over the four states. What is
 * left to hold here is the other half of the same promise: the derivation and the words it
 * is drawn with must enumerate **the same three buckets**. A bucket that the derivation
 * counts and this file has no word for renders as `undefined` in a strip an editor plans
 * their day from, and nothing in the pure test would notice.
 *
 * These are regression guards rather than tests that drove a change — the coverage was
 * already there when they were written. They are here to keep a fourth bucket from being
 * added to the derivation and drawn as a blank.
 */
describe('the three buckets have words to be drawn with', () => {
  it('re-exports the derivation’s own list rather than restating it', () => {
    // Same array, not merely equal: a copy is what drifts.
    expect(WORDS_BUCKETS).toBe(BUCKETS);
  });

  it.each(['open', 'needs-attention', 'closed'])(
    '%s has a label, a meaning and a tone',
    (bucket) => {
      // A label a person reads, a sentence they get on hover, and a tone the palette knows.
      // Since ticket 133 the tone is checked against the vocabulary and not against a map of
      // class names: the pixels are `app.css`'s, and a bucket tone the vocabulary does not
      // hold is a `data-tone` no selector matches — a badge drawn with no colour at all.
      expect(BUCKET_LABEL[bucket]).toBeTruthy();
      expect(BUCKET_MEANING[bucket]).toMatch(/\.$/);
      expect(TONES, bucket).toContain(BUCKET_TONE[bucket]);
    },
  );

  it('has no word for anything the derivation does not group by', () => {
    // The maps are exactly the three, so a retired bucket cannot linger as a dead word
    // that a later reader takes for a fourth group.
    for (const map of [BUCKET_LABEL, BUCKET_MEANING, BUCKET_TONE]) {
      expect(Object.keys(map).sort()).toEqual([...BUCKETS].sort());
    }
  });

  /**
   * *Open drops to `neutral` so the amber is spent once rather than twice* — ticket 80's
   * own answer to the open question the prototype raised. So these two tones are asserted
   * by name: they are a decision and not an accident.
   *
   * The ink shape has no `neutral`, which is the interface saying a plain number is the
   * neutral — that is `palette.test.mjs`'s to assert, over the stylesheet that draws it, and
   * this file stops holding half of it (ticket 133).
   */
  it('spends the amber once, on Needs attention', () => {
    expect(BUCKET_TONE.open).toBe('neutral');
    expect(BUCKET_TONE['needs-attention']).toBe('caution');
  });
});
