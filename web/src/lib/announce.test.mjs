import { describe, expect, it } from 'vitest';
import { pressMessage, savedMessage } from './announce.mjs';

/**
 * The sentences the live region says, at the branches that are decisions rather than
 * table lookups. What a `dismissed` event is called is a word in a map and a test of it
 * would restate the map; whether *no priority* and *a priority* are the same sentence is
 * not, and neither is what a press that half-wrote says.
 */

describe('the sentence a stored decision says', () => {
  // Taking a value off is not the same outcome as setting one, and both arrive as the
  // same action with the value at `null`. Announcing "the priority is set" for a press
  // that unset it would tell a reader the opposite of what happened.
  it('tells setting a value from taking it off', () => {
    expect(savedMessage({ action: 'prioritised', priority: 'high' })).toBe(
      'Saved: the priority of this page is high.',
    );
    expect(savedMessage({ action: 'prioritised', priority: null })).toBe(
      'Saved: this page has no priority.',
    );
  });

  it('tells a written note from a cleared one', () => {
    expect(savedMessage({ action: 'noted', note: 'Checked with the shop' })).toBe(
      'Saved: the note on this page.',
    );
    expect(savedMessage({ action: 'noted', note: '' })).toBe('Saved: this page has no note.');
  });
});

describe('the sentence a bulk press says', () => {
  it('says a whole press succeeded, which is the thing the screen only implies', () => {
    expect(pressMessage({ written: 40, total: 40, stoppedOn: null, error: null })).toBe(
      'Saved on 40 pages.',
    );
  });

  it('reads a shortfall as the count that was written, not as a failure alone', () => {
    expect(
      pressMessage({ written: 12, total: 30, stoppedOn: 'nl/carport', error: 'timeout' }),
    ).toBe('Saved on 12 of 30 pages. It stopped on nl/carport. timeout');
  });

  // A press that writes nothing names no page, and the sentence must not trail off into
  // "it stopped on undefined".
  it('says a press that wrote nothing at all', () => {
    expect(pressMessage({ written: 0, total: 8, stoppedOn: null, error: 'No connection.' })).toBe(
      'Saved on 0 of 8 pages. Nothing is written. No connection.',
    );
  });

  it('counts one page as one page', () => {
    expect(pressMessage({ written: 1, total: 1, stoppedOn: null, error: null })).toBe(
      'Saved on 1 page.',
    );
  });
});
