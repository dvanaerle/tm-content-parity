import { afterEach, describe, expect, it, vi } from 'vitest';
import { announce } from './announce.mjs';

/**
 * The one live region, at the two seams that make it one (ticket 03 of the polish pass).
 *
 * It is a browser test because the whole of this module is a DOM node: what is worth
 * knowing is whether a screen reader would find one polite region and hear each outcome
 * once, and neither half of that is a question a pretend DOM answers.
 *
 * Nothing here asserts the wording. The words belong to the surfaces that announce, and a
 * test that restated them would break on every copy edit while proving nothing about the
 * region.
 */

/**
 * The region as a screen reader finds it: by the attribute, and never by the id the module
 * happens to use. The test asks the same question the assistive technology does, so nothing
 * here holds the module to an implementation detail — and the module's whole interface
 * stays the one function the interface calls.
 */
const liveRegion = () => document.querySelector('[aria-live]');

afterEach(() => {
  liveRegion()?.remove();
});

/** What a screen reader would be handed: the region's text, once the write has landed. */
const heard = async (text) => vi.waitFor(() => expect(liveRegion()?.textContent).toBe(text));

describe('the live region', () => {
  it('says an outcome out loud, politely', async () => {
    announce('The decision is saved.');

    await heard('The decision is saved.');
    expect(liveRegion()?.getAttribute('aria-live')).toBe('polite');
  });

  // The trap ADR 0019 names: several regions announcing at once is worse than none,
  // because a screen reader interleaves them and the editor hears fragments.
  it('is one region however many surfaces announce', async () => {
    announce('The decision is saved.');
    announce('The re-check did not run.');

    await heard('The re-check did not run.');
    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1);
  });

  // Two decisions saved in a row is the ordinary case, and the two outcomes are the same
  // sentence. Setting the same text a second time is not a mutation, so a screen reader
  // would say it once — the region has to be cleared before it is written again.
  it('says the same outcome twice when it happens twice', async () => {
    announce('The decision is saved.');
    await heard('The decision is saved.');

    announce('The decision is saved.');

    await heard('');
    await heard('The decision is saved.');
  });
});
