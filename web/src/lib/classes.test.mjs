import { describe, expect, it } from 'vitest';
import { FINDING_CLASSES, canDecide, classInfo } from './classes.mjs';
import { TONES } from './palette.mjs';

/**
 * The rules the interface derives from a class's **visibility**, and nothing about how a
 * class looks: `PILL` is `palette.mjs`'s and it has its own file. The one exception is the
 * last block, which asserts that the **join** holds and never which pixels it lands on —
 * the shape `buckets.test.mjs` already uses for the bucket tones.
 *
 * `canDecide()` is the rule of ticket 86, and it is tested here rather than beside a
 * component because all three of its callers apply it and none of them decides it: the
 * content view reads it off `ContentRow.decidable`, and Links and Images call it on
 * the finding, because those two tabs have no rows.
 */
describe('canDecide', () => {
  it('offers no decision on an information finding', () => {
    // `CONTEXT.md`: an `information` finding is one you can link to and cannot decide. A
    // dismissal says "these two exact strings are acceptable", and nothing is being asked.
    expect(canDecide({ visibility: 'information' })).toBe(false);
  });

  it('offers a decision on work, and on a diagnostic behind the diagnostics control', () => {
    // The gate is `information` and nothing wider. What a rule saw is behind *Ruis tonen*
    // and it keeps the control it has: that is a different question and not this one.
    expect(canDecide({ visibility: 'work' })).toBe(true);
    expect(canDecide({ visibility: 'diagnostic' })).toBe(true);
  });

  it('reads the visibility and never the class name', () => {
    // Acceptance criterion eight of ticket 86, whole. `heading-level` is the class 86
    // moved and `regrouped` is the one ticket 116 brings; neither name is in the rule, so
    // a class re-triaged in `vocabulary.mjs` needs no second edit anywhere.
    expect(canDecide({ class: 'heading-level', visibility: 'information' })).toBe(false);
    expect(canDecide({ class: 'heading-level', visibility: 'work' })).toBe(true);
    expect(canDecide({ class: 'regrouped', visibility: 'information' })).toBe(false);
  });

  it('offers no decision where there is no finding', () => {
    // A row whose two sides agree is not a finding at all (ticket 02), so there is
    // nothing to ask about it either.
    expect(canDecide(null)).toBe(false);
    expect(canDecide(undefined)).toBe(false);
  });
});

describe('the tone of a class', () => {
  it('gives every class a tone the palette knows', () => {
    // `TONE` in `classes.mjs` names tones as strings, so a name the palette no longer
    // holds is a `pill` of `undefined` and a pill that draws with no colour at all —
    // silent, and on the class pill, which is the one thing every finding wears. Ticket
    // 131 renamed five of the eight, which is exactly when that goes wrong.
    for (const cls of Object.keys(FINDING_CLASSES)) {
      const { tone, pill } = classInfo(cls);
      expect(TONES, cls).toContain(tone);
      expect(pill, cls).toBeTruthy();
    }
  });
});
