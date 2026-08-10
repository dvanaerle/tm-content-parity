import { describe, expect, it } from 'vitest';
import { pageHref, recheckPath } from './page-url.mjs';

describe('pageHref', () => {
  // The Astro route is a rest parameter, so a slash in the key is a route
  // segment and must survive. `encodeURIComponent` on the whole key would write
  // `%2F` and the link would 404.
  it('keeps a slash in the key as a route segment', () => {
    expect(pageHref('nl', 'faq/productinformatie')).toBe('/nl/faq/productinformatie/');
  });

  // Measured on 2026-08-10: encoding changes **0** of the 550 committed keys, so
  // this is a guard on the input widening and not a repair of a live link. The
  // characters below are what it guards against.
  it('encodes a character that would break the URL', () => {
    expect(pageHref('fr', 'a b')).toBe('/fr/a%20b/');
    expect(pageHref('fr', '100%-glas')).toBe('/fr/100%25-glas/');
    expect(pageHref('fr', 'a#b')).toBe('/fr/a%23b/');
  });

  // The parenthesis is the sentinel precisely because it survives the static
  // route. `encodeURIComponent` leaves it alone, so the href is the built
  // directory name byte for byte.
  it('leaves the unanchored sentinel exactly as the build wrote it', () => {
    expect(pageHref('fr', '(fr)heavy-duty-veranda')).toBe('/fr/(fr)heavy-duty-veranda/');
    expect(pageHref('be_fr', '(be_fr)fr/pergola')).toBe('/be_fr/(be_fr)fr/pergola/');
  });
});

describe('recheckPath', () => {
  // `api/server.mjs` reads the store as the first segment and the page as
  // everything after it, then decodes. `api/server.test.mjs` pins the same two
  // literals from the other side, so the round trip is fixed in both directions.
  it('gives the path the re-check service parses', () => {
    expect(recheckPath('nl', 'faq/productinformatie')).toBe(
      '/api/recheck/nl/faq/productinformatie'
    );
    expect(recheckPath('fr', '(fr)heavy-duty-veranda')).toBe(
      '/api/recheck/fr/(fr)heavy-duty-veranda'
    );
  });
});
