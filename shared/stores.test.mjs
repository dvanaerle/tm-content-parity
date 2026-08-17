import { describe, expect, it } from 'vitest';

import { HREFLANG_STORE, STORE_HREFLANG, STORES } from './stores.mjs';

describe('the hreflang code of each store', () => {
  it('names one store for each of the six hreflang codes', () => {
    expect(HREFLANG_STORE).toEqual({
      'nl-NL': 'nl',
      'nl-BE': 'be',
      'fr-BE': 'be_fr',
      'de-DE': 'de',
      'fr-FR': 'fr',
      'en-GB': 'uk',
    });
  });

  // The literal above already pins today's six, so this proves nothing extra
  // about them. It is here for the edit that changes the literal — a seventh
  // store, a code production renames — because then the literal moves with the
  // edit and this states what the edit may not break: one code per store, one
  // store per code, both ways round.
  it('pairs the stores and the codes one to one', () => {
    const codesOf = (store) => STORE_HREFLANG.filter((code) => HREFLANG_STORE[code] === store);
    for (const store of STORES) expect(codesOf(store)).toHaveLength(1);
    expect([...new Set(Object.values(HREFLANG_STORE))].sort()).toEqual([...STORES].sort());
    expect(STORE_HREFLANG).toHaveLength(STORES.length);
  });

  // Not implied by the literal above: object equality ignores key order, and
  // this order is `Object.keys` insertion order. `crawl/sitemap-extract.mjs`
  // writes an entry's alternates in it, so it is in `data/sitemap-extract.json`
  // and not a matter of taste.
  it('keeps the code order production declares', () => {
    expect(STORE_HREFLANG).toEqual(['nl-NL', 'nl-BE', 'fr-BE', 'de-DE', 'fr-FR', 'en-GB']);
  });
});
