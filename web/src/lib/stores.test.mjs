import { describe, expect, it } from 'vitest';
import { STORE_LANGUAGE } from './stores.mjs';
import { LANGUAGE_BLOCKS } from './language-blocks.mjs';

/**
 * The language a scraped cell declares (ticket 125).
 *
 * **Coverage is not asserted here, and that is deliberate.** A store with no language is a
 * `throw` at import in `stores.mjs`, the way a store with no name has been since the
 * switcher shipped — so a test for it could never go red, and it would restate the guard
 * standing over it.
 *
 * What is left is the property the map itself cannot promise: that the two stores of a
 * language block give the **same** answer. It is what lets the sibling tab declare one
 * language over two columns, and it holds because the map and the blocks are cut from one
 * walk of `HREFLANG_STORE` — which is exactly the kind of claim that survives until somebody
 * writes the second copy.
 */
describe('the language of a store', () => {
  it('gives the two stores of a language block one language', () => {
    // The sweep has to sweep: no block would make this pass by asserting nothing.
    expect(LANGUAGE_BLOCKS.length).toBeGreaterThan(1);

    for (const block of LANGUAGE_BLOCKS) {
      const spoken = new Set(block.stores.map((store) => STORE_LANGUAGE[store]));
      expect([...spoken], block.stores.join(' + ')).toHaveLength(1);
    }
  });
});
