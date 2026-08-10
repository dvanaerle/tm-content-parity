import { describe, expect, it } from 'vitest';
import { HOME, unanchoredKey, unanchoredStore, unsafeReason } from './page-key.mjs';

describe('unanchoredStore', () => {
  it('reads the store out of the sentinel', () => {
    expect(unanchoredStore('(fr)heavy-duty-veranda')).toBe('fr');
  });

  // Two guarantees the log depends on. An anchored key keeps its current string
  // byte for byte. The home row is the home row in all six stores.
  it('gives null for a page that production declares in Dutch', () => {
    expect(unanchoredStore('faq/productinformatie')).toBe(null);
  });

  it('gives null for the home row, which is no store’s own page', () => {
    expect(unanchoredStore(HOME)).toBe(null);
  });

  it('gives null for a parenthesis that names no store', () => {
    expect(unanchoredStore('(nlx)pergola')).toBe(null);
  });

  it('reads back what unanchoredKey writes', () => {
    // The writer and the reader are one pair. Two files held them apart, and the
    // sentinel then had two definitions.
    expect(unanchoredStore(unanchoredKey('be_fr', 'fr/pergola'))).toBe('be_fr');
    expect(unanchoredKey('fr', 'heavy-duty-veranda')).toBe('(fr)heavy-duty-veranda');
  });
});

describe('unsafeReason', () => {
  // The old generator's unused fallback used a colon. It is the NTFS
  // alternate-data-stream separator, so it breaks the extract writer, the report
  // writer and the static build. Ticket 54 says do not ship it.
  it('refuses a colon', () => {
    expect(unsafeReason('fr:pergola')).toMatch(/colon/);
  });

  // `reportFilename()` replaces a slash with `__`, so the name is not injective:
  // a page named with one collides with a page path.
  it('refuses a double underscore', () => {
    expect(unsafeReason('fr__pergola')).toMatch(/double underscore/);
  });

  it('keeps the single underscore that the store ids need', () => {
    expect(unsafeReason('(be_fr)fr/pergola')).toBe(null);
  });
});
