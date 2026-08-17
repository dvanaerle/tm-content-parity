import { describe, expect, it } from 'vitest';

import { blockOf, LANGUAGE_BLOCKS, languageOf, siblingOf } from './language-blocks.mjs';
import { STORES } from '../../../shared/stores.mjs';

describe('the language blocks', () => {
  // The two blocks the spec names: `nl-NL`/`nl-BE` give `{nl, be}` and
  // `fr-BE`/`fr-FR` give `{be_fr, fr}`.
  it('holds the two blocks the six stores make', () => {
    expect(LANGUAGE_BLOCKS).toEqual([
      { language: 'nl', stores: ['nl', 'be'] },
      { language: 'fr', stores: ['be_fr', 'fr'] },
    ]);
  });

  // A **guard** and not a slice: it passed the moment it was written. The literal
  // above is the answer and this is the reason, and it is here for the edit that
  // moves the literal — a seventh store, a code production renames — because then
  // the literal moves with the edit and this states what the edit may not break.
  //
  // It reads the derivation against `HREFLANG_STORE` and never against a second
  // copy of `{nl, be}`, which is the shape that would go on passing with the
  // derivation deleted.
  it('derives every block from the hreflang map and leaves no shared language out', () => {
    for (const block of LANGUAGE_BLOCKS) {
      for (const store of block.stores) expect(languageOf(store)).toBe(block.language);
    }
    for (const store of STORES) {
      const alone = STORES.filter((one) => languageOf(one) === languageOf(store)).length === 1;
      expect(LANGUAGE_BLOCKS.some((block) => block.stores.includes(store))).toBe(!alone);
    }
  });

  // Also a guard. `siblingOf()` answers with **one** store, so the shape it assumes
  // is asserted here rather than assumed there: three stores of one language would
  // make it unanswerable.
  it('gives every block exactly two stores, which is what a sibling is asked of', () => {
    for (const block of LANGUAGE_BLOCKS) expect(block.stores).toHaveLength(2);
    for (const store of STORES) {
      expect(
        LANGUAGE_BLOCKS.filter((block) => block.stores.includes(store)).length,
      ).toBeLessThanOrEqual(1);
    }
  });

  // The question this test exists to close, so the answer survives the next person
  // who asks it. The reason is not a rule about these two stores: each one is the
  // only store of its language, so there is no second store to compare words with.
  it('gives `de` and `uk` no block, because each is alone in its language', () => {
    for (const store of ['de', 'uk']) {
      expect(STORES.filter((one) => languageOf(one) === languageOf(store))).toEqual([store]);
      expect(blockOf(store)).toBe(null);
      expect(siblingOf(store)).toBe(null);
    }
  });
});

describe('the sibling of a store', () => {
  // The reading belongs to no one store of the block — an editor of `be` sees `nl`
  // and an editor of `nl` sees the mirror of it — so the relation is asked for from
  // either side.
  it('names the other store of the block, both ways round', () => {
    expect(siblingOf('nl')).toBe('be');
    expect(siblingOf('be')).toBe('nl');
    expect(siblingOf('be_fr')).toBe('fr');
    expect(siblingOf('fr')).toBe('be_fr');
  });
});
