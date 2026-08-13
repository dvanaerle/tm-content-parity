import { describe, expect, it } from 'vitest';
import { canDecide } from './classes.mjs';

/**
 * The rules the interface derives from a class's **visibility**, and nothing about how a
 * class looks: `PILL` is `palette.mjs`'s and it has its own file.
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

  it('offers a decision on work, and on a diagnostic behind the noise toggle', () => {
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
